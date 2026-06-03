"use client";

import { useCallback, useEffect, useState } from "react";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ui } from "@/components/ui/theme";
import { heUi } from "@/config";
import { coerceBusinessType, type BusinessType } from "@/core/types/teacher";
import { safeNormalizeAvailabilitySettings } from "@/core/types/availability";
import {
  PublicBookingPageContent,
  type PublicBookingIdentity,
} from "@/features/booking/components/PublicBookingPageContent";
import { PublicBookingMobileFlow } from "@/features/booking/components/public-flow/PublicBookingMobileFlow";
import type { PublicCatalogService } from "@/features/booking/components/public-flow/types";
import { HILAI_NAILS_SLUG } from "@/features/booking/hilai/constants";
import { cn } from "@/lib/cn";
import { isPublicSupabaseEnvConfigured } from "@/config/env.public";

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string; title?: string }
  | { kind: "settings_unavailable"; message: string; title?: string }
  | {
      kind: "ready";
      teacherId: string;
      businessType: BusinessType;
      identity: PublicBookingIdentity;
      /** Always normalized — never pass raw API payload to slot logic. */
      availability: ReturnType<typeof safeNormalizeAvailabilitySettings>;
      branding: {
        logoUrl: string | null;
        primaryColor: string | null;
        accentColor: string | null;
      };
      services: PublicCatalogService[];
    };

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function parseServicesFromBootstrap(raw: unknown): PublicCatalogService[] {
  if (!Array.isArray(raw)) return [];
  const out: PublicCatalogService[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const o = item as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id.trim() : "";
    const name = typeof o.name === "string" ? o.name.trim() : "";
    if (!id || !name) continue;
    const price =
      typeof o.price === "number" && Number.isFinite(o.price) ? o.price : 0;
    const dmRaw = o.durationMinutes ?? o.duration_minutes;
    const durationMinutes =
      typeof dmRaw === "number" && Number.isFinite(dmRaw)
        ? Math.max(1, Math.trunc(dmRaw))
        : 45;
    out.push({ id, name, price, durationMinutes });
  }
  return out;
}

function safeTeacherPayload(
  raw: unknown,
): { id: string; businessType: unknown; businessName?: unknown; fullName?: unknown; phone?: unknown } | null {
  if (!isRecord(raw)) return null;
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  if (!id) return null;
  return {
    id,
    businessType: raw.businessType,
    businessName: raw.businessName,
    fullName: raw.fullName,
    phone: raw.phone,
  };
}

function PublicBookingSlugClient({ slug }: { slug: string }) {
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const load = useCallback(async () => {
    const trimmed = typeof slug === "string" ? slug.trim() : "";

    if (!trimmed) {
      console.error("[BOOK_PAGE_ERROR]", new Error("empty_slug_prop"));
      notFound();
      return;
    }

    if (!isPublicSupabaseEnvConfigured()) {
      console.error("[BOOK_PAGE_ERROR]", new Error("missing_public_supabase_env"));
      setState({
        kind: "error",
        message: heUi.publicBooking.errUnavailable,
      });
      return;
    }

    setState({ kind: "loading" });

    try {
      const url = `/api/public-booking/bootstrap?slug=${encodeURIComponent(trimmed)}`;

      let res: Response;
      try {
        res = await fetch(url);
      } catch (networkErr) {
        console.error("[BOOK_PAGE_ERROR]", networkErr);
        setState({
          kind: "error",
          message: heUi.publicBooking.errNetwork,
        });
        return;
      }

      let raw: unknown;
      try {
        raw = await res.json();
      } catch (parseErr) {
        console.error("[BOOK_PAGE_ERROR]", parseErr);
        setState({
          kind: "error",
          message:
            res.status === 503 || res.status === 502
              ? heUi.publicBooking.errUnavailable
              : heUi.publicBooking.bootstrapLoadFailedTitle,
        });
        return;
      }

      if (res.status === 404) {
        notFound();
        return;
      }

      if (!isRecord(raw)) {
        console.error("[BOOK_PAGE_ERROR]", new Error("bootstrap_not_object"));
        setState({
          kind: "error",
          message: heUi.publicBooking.bootstrapLoadFailedTitle,
        });
        return;
      }

      if (raw.ok !== true) {
        const errMsg =
          typeof raw.error === "string" && raw.error.length > 0
            ? raw.error
            : heUi.publicBooking.bootstrapLoadFailedTitle;
        if (res.status === 503 || res.status === 502) {
          setState({
            kind: "error",
            message:
              errMsg !== heUi.publicBooking.bootstrapLoadFailedTitle
                ? errMsg
                : heUi.publicBooking.errUnavailable,
          });
        } else {
          setState({ kind: "error", message: errMsg });
        }
        return;
      }

      const businessPayload = (raw as Record<string, unknown>).business;
      const businessId =
        isRecord(businessPayload) && typeof businessPayload.id === "string"
          ? businessPayload.id.trim()
          : "";
      if (!businessId) {
        console.error("[BOOK_PAGE_ERROR]", new Error("bootstrap_missing_business"));
        setState({
          kind: "error",
          title: heUi.publicBooking.businessNotFound,
          message: heUi.publicBooking.businessNotFound,
        });
        return;
      }

      const teacherRaw = raw.teacher;
      const teacher = safeTeacherPayload(teacherRaw);
      if (!teacher) {
        console.error("[BOOK_PAGE_ERROR]", new Error("bootstrap_teacher_invalid"));
        notFound();
        return;
      }

      const availabilityRaw = raw.availability;
      if (
        availabilityRaw == null ||
        typeof availabilityRaw !== "object" ||
        Array.isArray(availabilityRaw)
      ) {
        console.warn("[PublicBookingSlugClient] booking settings missing on payload");
        setState({
          kind: "settings_unavailable",
          message: heUi.publicBooking.bookingDataIncomplete,
        });
        return;
      }
      let availability: ReturnType<typeof safeNormalizeAvailabilitySettings>;
      try {
        availability = safeNormalizeAvailabilitySettings(
          availabilityRaw ?? {},
          teacher.id,
        );
      } catch (normErr) {
        console.error("[BOOK_PAGE_ERROR] availability normalize", normErr);
        setState({
          kind: "settings_unavailable",
          message: heUi.publicBooking.bookingDataIncomplete,
        });
        return;
      }

      if (!availability.weeklyAvailability || typeof availability.weeklyAvailability !== "object") {
        console.warn("[PublicBookingSlugClient] weeklyAvailability missing after normalize — safe defaults applied");
      }

      let businessType: BusinessType;
      try {
        businessType = coerceBusinessType(teacher.businessType);
      } catch (e) {
        console.warn("[PublicBookingSlugClient] coerceBusinessType", e);
        businessType = "driving_instructor";
      }

      const identity: PublicBookingIdentity = {
        businessName:
          typeof teacher.businessName === "string" ? teacher.businessName : "",
        teacherName: typeof teacher.fullName === "string" ? teacher.fullName : "",
        phone: typeof teacher.phone === "string" ? teacher.phone : "",
      };

      const brandingRaw = (raw as Record<string, unknown>).branding;
      const branding = isRecord(brandingRaw)
        ? {
            logoUrl:
              typeof brandingRaw.logoUrl === "string" && brandingRaw.logoUrl.length > 0
                ? brandingRaw.logoUrl
                : null,
            primaryColor:
              typeof brandingRaw.primaryColor === "string" && brandingRaw.primaryColor.length > 0
                ? brandingRaw.primaryColor
                : null,
            accentColor:
              typeof brandingRaw.accentColor === "string" && brandingRaw.accentColor.length > 0
                ? brandingRaw.accentColor
                : null,
          }
        : {
            logoUrl: null,
            primaryColor: null,
            accentColor: null,
          };

      setState({
        kind: "ready",
        teacherId: teacher.id,
        businessType,
        identity,
        availability,
        branding,
        services: parseServicesFromBootstrap(
          isRecord(raw) ? raw.services : undefined,
        ),
      });
    } catch (e) {
      console.error("[BOOK_PAGE_ERROR]", e);
      setState({
        kind: "error",
        message: heUi.publicBooking.bootstrapLoadFailedTitle,
      });
    }
  }, [slug]);

  useEffect(() => {
    void load().catch((e) => {
      console.error("[BOOK_PAGE_ERROR]", e);
      setState({
        kind: "error",
        message: heUi.publicBooking.bootstrapLoadFailedTitle,
      });
    });
  }, [load]);

  if (state.kind === "loading") {
    const trimmedSlug = typeof slug === "string" ? slug.trim() : "";
    const hilaiLoad = trimmedSlug === HILAI_NAILS_SLUG;
    return (
      <main
        className={cn(
          ui.pageMain,
          hilaiLoad &&
            "min-h-screen bg-gradient-to-b from-[#fff0f7] via-[#fffbfd] to-[#f5f0ff]",
        )}
        dir={hilaiLoad ? "ltr" : undefined}
        lang={hilaiLoad ? "en" : undefined}
      >
        <div
          className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-neutral-600"
          role="status"
          aria-live="polite"
        >
          <Spinner
            className={cn(
              "size-8",
              hilaiLoad
                ? "border-rose-100 border-t-[#c4a5bc]"
                : "border-neutral-300 border-t-neutral-700",
            )}
          />
          <span className="sr-only">{heUi.loading.ariaBusy}</span>
        </div>
      </main>
    );
  }

  if (state.kind === "error" || state.kind === "settings_unavailable") {
    const heading =
      state.title ??
      (state.kind === "settings_unavailable"
        ? heUi.publicBooking.bootstrapLoadFailedTitle
        : heUi.publicBooking.invalidSlugTitle);
    return (
      <main className={ui.pageMain}>
        <header className={ui.header}>
          <h1 className={ui.pageTitle}>{heading}</h1>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-neutral-600">
            {state.message}
          </p>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-neutral-600">
            {heUi.publicBooking.invalidSlugDescription}
          </p>
          <div className="mt-6">
            <Button type="button" variant="secondary" onClick={() => void load()}>
              {heUi.errors.tryAgain}
            </Button>
          </div>
        </header>
      </main>
    );
  }

  const tid = state.teacherId.trim();
  if (!tid) {
    console.error("[BOOK_PAGE_ERROR]", new Error("ready_state_missing_teacherId"));
    notFound();
    return null;
  }

  const isHilai =
    typeof slug === "string" && slug.trim() === HILAI_NAILS_SLUG;

  if (isHilai) {
    return (
      <PublicBookingPageContent
        teacherId={tid}
        businessType={state.businessType}
        identity={state.identity}
        availability={state.availability}
        branding={state.branding}
      />
    );
  }

  return (
    <PublicBookingMobileFlow
      teacherId={tid}
      businessType={state.businessType}
      identity={state.identity}
      availability={state.availability}
      branding={state.branding}
      catalogServices={state.services}
    />
  );
}

export default PublicBookingSlugClient;
