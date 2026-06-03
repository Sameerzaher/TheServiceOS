"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PRODUCT_BRANDING } from "@/config/branding";
import { Button, ui, useToast } from "@/components/ui";
import type { WeekdayKey } from "@/core/types/availability";
import type { BusinessType } from "@/core/types/teacher";
import {
  defaultOwnerDraft,
  loadOwnerOnboardingDraft,
  saveOwnerOnboardingDraft,
  clearOwnerOnboardingDraft,
  type OwnerOnboardingDraft,
  type OwnerOnboardingStep,
} from "@/core/onboarding/ownerOnboardingStorage";
import { weeklyAvailabilityFromWorkDays } from "@/core/onboarding/weeklyDefaults";
import { mergeTeacherScopeHeaders } from "@/lib/api/teacherScopeHeaders";
import { cn } from "@/lib/cn";

import { heOnboarding } from "./ownerOnboardingCopy";

const STEPS: { id: OwnerOnboardingStep; label: string }[] = [
  { id: 1, label: heOnboarding.step1 },
  { id: 2, label: heOnboarding.step2 },
  { id: 3, label: heOnboarding.step3 },
  { id: 4, label: heOnboarding.step4 },
];

const DAY_GRID: { id: WeekdayKey; label: string }[] = [
  { id: "sunday", label: "א׳" },
  { id: "monday", label: "ב׳" },
  { id: "tuesday", label: "ג׳" },
  { id: "wednesday", label: "ד׳" },
  { id: "thursday", label: "ה׳" },
  { id: "friday", label: "ו׳" },
  { id: "saturday", label: "ש׳" },
];

const VERTICAL_OPTIONS = PRODUCT_BRANDING.audiences.filter(
  (a): a is (typeof PRODUCT_BRANDING.audiences)[number] & { id: BusinessType } =>
    a.id === "driving_instructor" || a.id === "cosmetic_clinic",
);

function normalizeClientSlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function defaultServiceName(type: BusinessType): string {
  return type === "cosmetic_clinic" ? "טיפול / ייעוץ" : "שיעור / מפגש";
}

type AuthTeacher = {
  id: string;
  fullName: string;
  businessName: string;
  phone: string;
  slug: string;
  businessType: BusinessType;
};

export function OwnerOnboardingFlow() {
  const router = useRouter();
  const toast = useToast();
  const [auth, setAuth] = useState<AuthTeacher | null>(null);
  const [authError, setAuthError] = useState(false);
  const [draft, setDraft] = useState<OwnerOnboardingDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [publicSlug, setPublicSlug] = useState<string | null>(null);

  const teacherId = auth?.id ?? "";

  const persistDraft = useCallback((next: OwnerOnboardingDraft) => {
    setDraft(next);
    saveOwnerOnboardingDraft(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (cancelled) return;
      if (!res.ok) {
        setAuthError(true);
        return;
      }
      const data = (await res.json()) as {
        ok?: boolean;
        data?: { teacher: AuthTeacher };
      };
      if (!data.ok || !data.data?.teacher) {
        setAuthError(true);
        return;
      }
      const t = data.data.teacher;
      setAuth(t);
      const saved = loadOwnerOnboardingDraft(t.id);
      const base = saved ?? defaultOwnerDraft(t.id);
      persistDraft({
        ...base,
        teacherId: t.id,
        businessName: base.businessName || t.businessName || "",
        phone: base.phone || t.phone || "",
        slug: base.slug || normalizeClientSlug(t.slug) || "",
        businessType: base.businessType || (t.businessType as BusinessType) || "driving_instructor",
        serviceName: base.serviceName || defaultServiceName(t.businessType as BusinessType),
      });
      setPublicSlug(t.slug || null);
    })();
    return () => {
      cancelled = true;
    };
  }, [persistDraft]);

  const stepIndex = useMemo(() => {
    if (!draft) return 0;
    return STEPS.findIndex((s) => s.id === draft.step);
  }, [draft]);

  const progressPct = draft
    ? ((stepIndex + 1) / STEPS.length) * 100
    : 0;

  const bookingUrl =
    typeof window !== "undefined" && publicSlug
      ? `${window.location.origin}/book/${publicSlug}`
      : "";

  async function refreshPublicSlug(tid: string): Promise<void> {
    const res = await fetch("/api/settings", {
      credentials: "include",
      headers: mergeTeacherScopeHeaders(tid),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      teacherSlug?: string | null;
    };
    if (data.ok && data.teacherSlug) {
      setPublicSlug(data.teacherSlug);
    }
  }

  async function saveStep1(): Promise<boolean> {
    if (!draft || !auth) return false;
    const slug = normalizeClientSlug(draft.slug);
    if (draft.businessName.trim().length < 2) {
      toast(heOnboarding.errBusinessName, "error");
      return false;
    }
    if (draft.phone.trim().length < 9) {
      toast(heOnboarding.errPhone, "error");
      return false;
    }
    if (slug.length < 2) {
      toast(heOnboarding.errSlug, "error");
      return false;
    }

    setBusy(true);
    try {
      const putTeacher = await fetch(`/api/teachers/${auth.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: draft.businessName.trim(),
          phone: draft.phone.trim(),
          businessType: draft.businessType,
          slug,
        }),
      });
      const putData = (await putTeacher.json()) as { ok?: boolean; error?: string };
      if (!putTeacher.ok || !putData.ok) {
        toast(putData.error ?? heOnboarding.errGeneric, "error");
        return false;
      }

      const settingsRes = await fetch("/api/settings", {
        credentials: "include",
        headers: mergeTeacherScopeHeaders(auth.id),
      });
      const settingsJson = (await settingsRes.json()) as {
        ok?: boolean;
        settings?: {
          teacherName: string;
          bookingEnabled: boolean;
          bufferBetweenLessons: number;
          brandLogoUrl: string;
          brandPrimaryColor: string;
          brandAccentColor: string;
        };
      };
      if (!settingsJson.ok || !settingsJson.settings) {
        toast(heOnboarding.errSettings, "error");
        return false;
      }
      const s = settingsJson.settings;
      const putSettings = await fetch("/api/settings", {
        method: "PUT",
        credentials: "include",
        headers: {
          ...mergeTeacherScopeHeaders(auth.id),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessName: draft.businessName.trim(),
          teacherName: s.teacherName,
          phone: draft.phone.trim(),
          businessType: draft.businessType,
          defaultLessonDuration: draft.slotDurationMinutes,
          bookingEnabled: s.bookingEnabled,
          workingHoursStart: draft.workStart,
          workingHoursEnd: draft.workEnd,
          bufferBetweenLessons: s.bufferBetweenLessons,
          brandLogoUrl: s.brandLogoUrl ?? "",
          brandPrimaryColor: s.brandPrimaryColor,
          brandAccentColor: s.brandAccentColor,
        }),
      });
      const saveSet = (await putSettings.json()) as { ok?: boolean; error?: string };
      if (!putSettings.ok || !saveSet.ok) {
        toast(saveSet.error ?? heOnboarding.errGeneric, "error");
        return false;
      }

      await refreshPublicSlug(auth.id);
      return true;
    } catch (e) {
      console.error(e);
      toast(heOnboarding.errGeneric, "error");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function saveStep2(): Promise<boolean> {
    if (!draft || !auth) return false;
    if (draft.workDays.length === 0) {
      toast(heOnboarding.errDays, "error");
      return false;
    }
    setBusy(true);
    try {
      const avRes = await fetch("/api/availability-settings", {
        credentials: "include",
        headers: mergeTeacherScopeHeaders(auth.id),
      });
      const avJson = (await avRes.json()) as {
        ok?: boolean;
        settings?: Record<string, unknown>;
      };
      if (!avJson.ok || !avJson.settings) {
        toast(heOnboarding.errAvailability, "error");
        return false;
      }
      const av = avJson.settings as Record<string, unknown>;
      const weekly = weeklyAvailabilityFromWorkDays(
        draft.workDays,
        draft.workStart,
        draft.workEnd,
      );
      const putAv = await fetch("/api/availability-settings", {
        method: "PUT",
        credentials: "include",
        headers: {
          ...mergeTeacherScopeHeaders(auth.id),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...av,
          teacherId: auth.id,
          weeklyAvailability: weekly,
          slotDurationMinutes: draft.slotDurationMinutes,
          bookingEnabled: draft.bookingEnabled,
        }),
      });
      const putData = (await putAv.json()) as { ok?: boolean; error?: string };
      if (!putAv.ok || !putData.ok) {
        toast(putData.error ?? heOnboarding.errGeneric, "error");
        return false;
      }
      return true;
    } catch (e) {
      console.error(e);
      toast(heOnboarding.errGeneric, "error");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function saveStep3(): Promise<boolean> {
    if (!draft || !auth) return false;
    if (draft.serviceName.trim().length < 2) {
      toast(heOnboarding.errServiceName, "error");
      return false;
    }
    if (!Number.isFinite(draft.servicePrice) || draft.servicePrice < 0) {
      toast(heOnboarding.errServicePrice, "error");
      return false;
    }
    if (draft.clientName.trim().length < 2) {
      toast(heOnboarding.errClientName, "error");
      return false;
    }
    if (draft.clientPhone.trim().length < 9) {
      toast(heOnboarding.errClientPhone, "error");
      return false;
    }

    setBusy(true);
    try {
      const serviceRes = await fetch("/api/services", {
        method: "POST",
        credentials: "include",
        headers: {
          ...mergeTeacherScopeHeaders(auth.id),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: draft.serviceName.trim(),
          description: "",
          price: draft.servicePrice,
          durationMinutes: draft.slotDurationMinutes,
          isActive: true,
          displayOrder: 0,
        }),
      });
      const serviceData = (await serviceRes.json()) as { ok?: boolean; error?: string };
      if (!serviceRes.ok || !serviceData.ok) {
        toast(serviceData.error ?? heOnboarding.errGeneric, "error");
        return false;
      }

      const clientRes = await fetch("/api/clients", {
        method: "POST",
        credentials: "include",
        headers: {
          ...mergeTeacherScopeHeaders(auth.id),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: draft.clientName.trim(),
          phone: draft.clientPhone.trim(),
          notes: "",
          customFields: {},
          teacherId: auth.id,
        }),
      });
      const clientData = (await clientRes.json()) as { ok?: boolean; error?: string };
      if (!clientRes.ok || !clientData.ok) {
        toast(clientData.error ?? heOnboarding.errGeneric, "error");
        return false;
      }

      return true;
    } catch (e) {
      console.error(e);
      toast(heOnboarding.errGeneric, "error");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function completeOnboarding(): Promise<void> {
    setBusy(true);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        credentials: "include",
        headers: mergeTeacherScopeHeaders(teacherId),
      });
      const data = (await res.json()) as { ok?: boolean };
      if (!res.ok || !data.ok) {
        toast(heOnboarding.errGeneric, "error");
        return;
      }
      clearOwnerOnboardingDraft();
    } catch (e) {
      console.error(e);
      toast(heOnboarding.errGeneric, "error");
    } finally {
      setBusy(false);
    }
  }

  async function goNext(): Promise<void> {
    if (!draft || !auth) return;
    if (draft.step === 1) {
      const ok = await saveStep1();
      if (!ok) return;
      persistDraft({ ...draft, step: 2 });
      return;
    }
    if (draft.step === 2) {
      const ok = await saveStep2();
      if (!ok) return;
      persistDraft({ ...draft, step: 3 });
      return;
    }
    if (draft.step === 3) {
      const ok = await saveStep3();
      if (!ok) return;
      persistDraft({ ...draft, step: 4 });
      return;
    }
  }

  function goBack(): void {
    if (!draft) return;
    if (draft.step <= 1) return;
    persistDraft({ ...draft, step: (draft.step - 1) as OwnerOnboardingStep });
  }

  async function finishAndGoDashboard(): Promise<void> {
    await completeOnboarding();
    router.push("/dashboard");
  }

  function toggleDay(day: WeekdayKey): void {
    if (!draft) return;
    const has = draft.workDays.includes(day);
    const workDays = has
      ? draft.workDays.filter((d) => d !== day)
      : [...draft.workDays, day];
    persistDraft({ ...draft, workDays });
  }

  if (authError) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <p className="text-neutral-800">{heOnboarding.needLogin}</p>
        <Link
          href="/login"
          className="mt-4 inline-block font-medium text-emerald-700 underline"
        >
          {heOnboarding.goLogin}
        </Link>
      </div>
    );
  }

  if (!draft || !auth) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center text-neutral-600">
        {heOnboarding.loading}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-8">
        <div className="mb-3 flex justify-between gap-1 text-[11px] text-neutral-500 sm:text-xs">
          {STEPS.map((s, idx) => (
            <span
              key={s.id}
              className={cn(
                "flex-1 text-center",
                idx <= stepIndex ? "font-semibold text-emerald-700" : "",
              )}
            >
              {s.label}
            </span>
          ))}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full bg-emerald-600 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className={cn(ui.card, "p-6 shadow-sm sm:p-8")}>
        <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-emerald-700/80">
          {PRODUCT_BRANDING.name}
        </p>

        {draft.step === 1 ? (
          <div className="space-y-5">
            <div>
              <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">
                {heOnboarding.title1}
              </h1>
              <p className="mt-2 text-sm text-neutral-600">{heOnboarding.sub1}</p>
            </div>

            <div>
              <span className={ui.label}>{heOnboarding.fieldBusinessType}</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {VERTICAL_OPTIONS.map((aud) => (
                  <button
                    key={aud.id}
                    type="button"
                    onClick={() =>
                      persistDraft({
                        ...draft,
                        businessType: aud.id,
                        serviceName:
                          draft.serviceName.length < 2
                            ? defaultServiceName(aud.id)
                            : draft.serviceName,
                      })
                    }
                    className={cn(
                      "rounded-xl border-2 p-3 text-center text-sm font-medium transition-all",
                      draft.businessType === aud.id
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                        : "border-neutral-200 hover:border-emerald-300",
                    )}
                  >
                    <span className="mb-1 block text-2xl">{aud.icon}</span>
                    {aud.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={ui.label} htmlFor="ob-biz">
                {heOnboarding.fieldBusinessName}
              </label>
              <input
                id="ob-biz"
                className={ui.input}
                value={draft.businessName}
                onChange={(e) =>
                  persistDraft({ ...draft, businessName: e.target.value })
                }
                placeholder={heOnboarding.phBusinessName}
              />
            </div>

            <div>
              <label className={ui.label} htmlFor="ob-phone">
                {heOnboarding.fieldPhone}
              </label>
              <input
                id="ob-phone"
                type="tel"
                className={ui.input}
                dir="ltr"
                value={draft.phone}
                onChange={(e) =>
                  persistDraft({ ...draft, phone: e.target.value })
                }
                placeholder="050-0000000"
              />
            </div>

            <div>
              <label className={ui.label} htmlFor="ob-slug">
                {heOnboarding.fieldSlug}
              </label>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                <span className="text-xs text-neutral-500 sm:pt-2" dir="ltr">
                  …/book/
                </span>
                <input
                  id="ob-slug"
                  className={cn(ui.input, "flex-1 font-mono text-sm")}
                  dir="ltr"
                  value={draft.slug}
                  onChange={(e) =>
                    persistDraft({ ...draft, slug: e.target.value })
                  }
                  onBlur={() =>
                    persistDraft({
                      ...draft,
                      slug: normalizeClientSlug(draft.slug),
                    })
                  }
                  placeholder="my-business"
                />
              </div>
              <p className="mt-1 text-xs text-neutral-500">{heOnboarding.hintSlug}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={ui.label} htmlFor="ob-ws">
                  {heOnboarding.fieldWorkStart}
                </label>
                <input
                  id="ob-ws"
                  type="time"
                  className={ui.input}
                  value={draft.workStart}
                  onChange={(e) =>
                    persistDraft({ ...draft, workStart: e.target.value })
                  }
                />
              </div>
              <div>
                <label className={ui.label} htmlFor="ob-we">
                  {heOnboarding.fieldWorkEnd}
                </label>
                <input
                  id="ob-we"
                  type="time"
                  className={ui.input}
                  value={draft.workEnd}
                  onChange={(e) =>
                    persistDraft({ ...draft, workEnd: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        ) : null}

        {draft.step === 2 ? (
          <div className="space-y-5">
            <div>
              <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">
                {heOnboarding.title2}
              </h1>
              <p className="mt-2 text-sm text-neutral-600">{heOnboarding.sub2}</p>
            </div>

            <div>
              <span className={ui.label}>{heOnboarding.fieldWorkDays}</span>
              <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
                {DAY_GRID.map((day) => (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleDay(day.id)}
                    className={cn(
                      "rounded-lg border-2 py-2 text-sm font-medium transition-all",
                      draft.workDays.includes(day.id)
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                        : "border-neutral-200 text-neutral-600 hover:border-emerald-200",
                    )}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={ui.label} htmlFor="ob-slot">
                {heOnboarding.fieldSlot}
              </label>
              <select
                id="ob-slot"
                className={ui.select}
                value={draft.slotDurationMinutes}
                onChange={(e) =>
                  persistDraft({
                    ...draft,
                    slotDurationMinutes: Number(e.target.value),
                  })
                }
              >
                <option value={30}>30 {heOnboarding.minutes}</option>
                <option value={45}>45 {heOnboarding.minutes}</option>
                <option value={60}>60 {heOnboarding.minutes}</option>
                <option value={90}>90 {heOnboarding.minutes}</option>
              </select>
            </div>

            <label className="flex cursor-pointer items-start gap-3 text-sm text-neutral-800">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-neutral-300 text-emerald-600"
                checked={draft.bookingEnabled}
                onChange={(e) =>
                  persistDraft({ ...draft, bookingEnabled: e.target.checked })
                }
              />
              <span>{heOnboarding.publishBooking}</span>
            </label>
          </div>
        ) : null}

        {draft.step === 3 ? (
          <div className="space-y-5">
            <div>
              <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">
                {heOnboarding.title3}
              </h1>
              <p className="mt-2 text-sm text-neutral-600">{heOnboarding.sub3}</p>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
              <p className="mb-3 text-sm font-medium text-emerald-900 dark:text-emerald-100">
                {heOnboarding.blockService}
              </p>
              <div className="space-y-3">
                <div>
                  <label className={ui.label} htmlFor="ob-svc-name">
                    {heOnboarding.fieldServiceName}
                  </label>
                  <input
                    id="ob-svc-name"
                    className={ui.input}
                    value={draft.serviceName}
                    onChange={(e) =>
                      persistDraft({ ...draft, serviceName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className={ui.label} htmlFor="ob-svc-price">
                    {heOnboarding.fieldServicePrice}
                  </label>
                  <input
                    id="ob-svc-price"
                    type="number"
                    min={0}
                    className={ui.input}
                    dir="ltr"
                    value={draft.servicePrice}
                    onChange={(e) =>
                      persistDraft({
                        ...draft,
                        servicePrice: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-600 dark:bg-neutral-900/40">
              <p className="mb-3 text-sm font-medium text-neutral-800 dark:text-neutral-100">
                {heOnboarding.blockClient}
              </p>
              <div className="space-y-3">
                <div>
                  <label className={ui.label} htmlFor="ob-cl-name">
                    {heOnboarding.fieldClientName}
                  </label>
                  <input
                    id="ob-cl-name"
                    className={ui.input}
                    value={draft.clientName}
                    onChange={(e) =>
                      persistDraft({ ...draft, clientName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className={ui.label} htmlFor="ob-cl-phone">
                    {heOnboarding.fieldClientPhone}
                  </label>
                  <input
                    id="ob-cl-phone"
                    type="tel"
                    className={ui.input}
                    dir="ltr"
                    value={draft.clientPhone}
                    onChange={(e) =>
                      persistDraft({ ...draft, clientPhone: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {draft.step === 4 ? (
          <div className="space-y-6 text-center">
            <div className="text-5xl" aria-hidden>
              ✓
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">
                {heOnboarding.title4}
              </h1>
              <p className="mt-2 text-neutral-600">{heOnboarding.sub4}</p>
            </div>

            {bookingUrl ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-start dark:border-emerald-800 dark:bg-emerald-950/30">
                <p className="text-xs font-medium text-emerald-900 dark:text-emerald-200">
                  {heOnboarding.yourLink}
                </p>
                <p
                  className="mt-2 break-all font-mono text-sm text-neutral-800 dark:text-neutral-100"
                  dir="ltr"
                >
                  {bookingUrl}
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="primary"
                    className="w-full sm:flex-1"
                    disabled={busy}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(bookingUrl);
                        toast(heOnboarding.copied);
                      } catch {
                        toast(heOnboarding.copyFailed, "error");
                      }
                    }}
                  >
                    {heOnboarding.copyLink}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full sm:flex-1"
                    disabled={busy}
                    onClick={() => {
                      const text = heOnboarding.whatsappShareText(bookingUrl);
                      window.open(
                        `https://wa.me/?text=${encodeURIComponent(text)}`,
                        "_blank",
                        "noopener,noreferrer",
                      );
                    }}
                  >
                    {heOnboarding.shareWhatsapp}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">{heOnboarding.noSlugYet}</p>
            )}

            <Button
              type="button"
              variant="primary"
              className="w-full py-3 text-base"
              disabled={busy}
              onClick={() => void finishAndGoDashboard()}
            >
              {heOnboarding.goDashboard}
            </Button>
          </div>
        ) : null}

        {draft.step < 4 ? (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="secondary"
              disabled={busy || draft.step <= 1}
              onClick={goBack}
              className="order-2 sm:order-1"
            >
              {heOnboarding.back}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={busy}
              className="order-1 sm:order-2 sm:min-w-[10rem]"
              onClick={() => void goNext()}
            >
              {heOnboarding.next}
            </Button>
          </div>
        ) : null}

        {draft.step < 4 ? (
          <div className="mt-6 text-center">
            <button
              type="button"
              className="text-sm text-neutral-500 underline-offset-2 hover:underline"
              onClick={() => router.push("/dashboard")}
            >
              {heOnboarding.skipForNow}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
