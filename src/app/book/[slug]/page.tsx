"use client";

import { notFound, useParams } from "next/navigation";
import { useMemo } from "react";

import {
  isValidPublicTeacherSlug,
  normalizeTeacherSlug,
} from "@/core/validation/teacher";
import { isPublicSupabaseEnvConfigured } from "@/config/env.public";

import { PublicBookingEnvMissing } from "./PublicBookingEnvMissing";
import PublicBookingSlugClient from "./PublicBookingSlugClient";

/**
 * Entire segment is a Client Component so Vercel/Next never runs the buggy RSC path
 * that reads `module.clientModules` as undefined for this route (`clientModules` crash).
 * Slug comes from `useParams()` instead of async server `params`.
 */
export default function PublicBookingBySlugPage() {
  const params = useParams();
  const slug = useMemo(() => {
    const raw = params?.slug;
    return typeof raw === "string" ? normalizeTeacherSlug(raw) : "";
  }, [params]);

  if (!slug || !isValidPublicTeacherSlug(slug)) {
    notFound();
  }

  if (!isPublicSupabaseEnvConfigured()) {
    return <PublicBookingEnvMissing />;
  }

  return <PublicBookingSlugClient slug={slug} />;
}
