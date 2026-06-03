"use client";

import { useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/cn";

import {
  HILAI_NAILS_SERVICES,
  HILAI_SERVICE_EMOJI,
} from "@/features/booking/hilai/constants";

export function HilaiSectionHeading({
  title,
  hint,
  stepNumber,
}: {
  title: string;
  hint?: string;
  stepNumber?: 1 | 2 | 3;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-3">
        {stepNumber != null ? (
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-pink-50 text-sm font-extrabold text-pink-700 shadow-sm ring-2 ring-white"
            aria-hidden
          >
            {stepNumber}
          </span>
        ) : null}
        <h2 className="min-w-0 flex-1 text-lg font-bold leading-snug tracking-tight text-stone-800 sm:text-xl">
          {title}
        </h2>
      </div>
      {hint ? (
        <p className="text-[13px] leading-relaxed text-stone-500 sm:text-sm">{hint}</p>
      ) : null}
    </div>
  );
}

/** Business logo from settings URL, or emoji fallback */
export function HilaiBrandMark({
  className,
  logoUrl,
  accentColor,
}: {
  className?: string;
  logoUrl?: string | null;
  accentColor?: string | null;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = Boolean(logoUrl?.trim()) && !imgFailed;
  return (
    <div
      className={cn(
        "mx-auto flex h-[4.25rem] w-[4.25rem] items-center justify-center overflow-hidden rounded-2xl border bg-white/95 text-[1.75rem] shadow-lg ring-[3px]",
        !accentColor && "border-pink-200/70 shadow-pink-300/25 ring-pink-50/90",
        className,
      )}
      style={
        accentColor
          ? {
              borderColor: `${accentColor}55`,
              boxShadow: `0 12px 36px -14px ${accentColor}44`,
            }
          : undefined
      }
      aria-hidden
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element -- customer-provided HTTPS URL from settings
        <img
          src={logoUrl!}
          alt=""
          className="h-full w-full object-contain p-1.5"
          onError={() => setImgFailed(true)}
        />
      ) : (
        "💅"
      )}
    </div>
  );
}

export function HilaiPremiumHero({
  headline,
  subheadline,
  brandName,
  eyebrow,
  logoUrl,
  accentColor,
}: {
  headline: string;
  subheadline: string;
  brandName?: string;
  eyebrow?: string;
  logoUrl?: string | null;
  accentColor?: string | null;
}) {
  return (
    <header
      className={cn(
        "relative overflow-hidden rounded-3xl border border-pink-100/90",
        "bg-gradient-to-br from-[#fce7f3] via-white to-[#f3e8ff]",
        "px-6 pb-12 pt-10 shadow-[0_28px_80px_-36px_rgba(219,39,119,0.38)] sm:px-10 sm:pb-14 sm:pt-12",
      )}
    >
      <div
        className="pointer-events-none absolute -left-24 -top-28 size-[18rem] rounded-full bg-pink-300/35 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-28 -right-20 size-[16rem] rounded-full bg-violet-300/30 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-lg text-center">
        <HilaiBrandMark className="mb-8" logoUrl={logoUrl} accentColor={accentColor} />
        <h1 className="text-balance text-3xl font-bold leading-[1.15] tracking-tight text-stone-900 sm:text-4xl sm:leading-tight">
          {headline}
        </h1>
        <p className="mx-auto mt-5 max-w-md text-pretty text-lg leading-relaxed text-stone-600 sm:text-xl">
          {subheadline}
        </p>
        {brandName ? (
          <p
            className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-pink-800/80"
            style={accentColor ? { color: accentColor } : undefined}
          >
            {brandName}
          </p>
        ) : null}
        {eyebrow ? (
          <p className="mt-3 text-sm font-medium text-stone-500">{eyebrow}</p>
        ) : null}
      </div>
    </header>
  );
}

/** Honest urgency when today has open slots */
export function HilaiUrgencyStrip({
  title,
  subtitle,
  show,
}: {
  title: string;
  subtitle: string;
  show: boolean;
}) {
  if (!show) return null;
  return (
    <div
      className="rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50 via-orange-50/90 to-rose-50 px-4 py-3.5 text-center shadow-md shadow-amber-200/30"
      role="status"
    >
      <p className="text-sm font-bold tracking-tight text-amber-950 sm:text-base">{title}</p>
      <p className="mt-1 text-xs font-medium leading-snug text-amber-900/85 sm:text-sm">{subtitle}</p>
    </div>
  );
}

export function HilaiStudioWhatsAppLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-2xl border border-[#25D366]/35 bg-[#25D366]/10 px-4 py-3.5 text-sm font-semibold text-emerald-950 shadow-sm transition hover:bg-[#25D366]/18",
      )}
    >
      <span aria-hidden className="text-lg">
        💬
      </span>
      {label}
    </a>
  );
}

export function HilaiGalleryStrip({
  heading,
  images,
}: {
  heading: string;
  images: readonly { src: string; alt: string }[];
}) {
  return (
    <section className="space-y-4" aria-label={heading}>
      <h2 className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
        {heading}
      </h2>
      <div className="-mx-0.5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 pt-1 [scrollbar-width:thin]">
        {images.map((img) => (
          <div
            key={img.src}
            className="relative h-40 w-[46%] min-w-[10.5rem] shrink-0 snap-center overflow-hidden rounded-2xl shadow-lg shadow-pink-200/35 ring-1 ring-white/90 sm:h-44 sm:min-w-[12rem]"
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 46vw, 200px"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5 text-amber-400" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="text-[15px] leading-none">
          ★
        </span>
      ))}
    </div>
  );
}

export function HilaiReviewsSection({
  heading,
  reviews,
}: {
  heading: string;
  reviews: readonly { id: string; name: string; rating: number; text: string }[];
}) {
  return (
    <section
      className="rounded-3xl border border-pink-100/80 bg-white/85 p-5 shadow-xl shadow-pink-200/25 backdrop-blur-sm sm:p-7"
      aria-label={heading}
    >
      <h2 className="mb-5 text-center text-lg font-bold text-stone-800 sm:text-xl">
        {heading}
      </h2>
      <ul className="flex flex-col gap-4">
        {reviews.map((r) => (
          <li
            key={r.id}
            className="rounded-2xl border border-stone-100/90 bg-gradient-to-br from-white to-pink-50/50 p-4 shadow-md shadow-stone-200/30"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-stone-900">{r.name}</span>
              <StarRow count={r.rating} />
            </div>
            <p className="mt-2.5 text-sm leading-relaxed text-stone-600">{r.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HilaiSectionDivider() {
  return (
    <div className="flex items-center gap-3 py-2" aria-hidden>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-pink-200/70 to-transparent" />
      <span className="text-[10px] text-pink-300">✦</span>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-pink-200/70 to-transparent" />
    </div>
  );
}

export function HilaiNailsServiceGrid({
  selected,
  onSelect,
  disabled,
  heading,
  hint,
  stepNumber = 1,
  serviceLabels,
  slotDurationMinutes,
}: {
  selected: string | null;
  onSelect: (name: string) => void;
  disabled?: boolean;
  heading: string;
  hint?: string;
  stepNumber?: 1 | 2 | 3;
  /** Optional display labels (e.g. English) while value stays canonical Hebrew key */
  serviceLabels?: Record<string, string>;
  /** From availability settings — shown as session length hint on each card */
  slotDurationMinutes?: number | null;
}) {
  const dur =
    slotDurationMinutes != null &&
    Number.isFinite(slotDurationMinutes) &&
    slotDurationMinutes > 0
      ? slotDurationMinutes
      : null;

  return (
    <div className="space-y-5 sm:space-y-6">
      <HilaiSectionHeading title={heading} hint={hint} stepNumber={stepNumber} />
      <ul className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
        {HILAI_NAILS_SERVICES.map((name) => {
          const isOn = selected === name;
          const emoji = HILAI_SERVICE_EMOJI[name] ?? "💅";
          const display = serviceLabels?.[name] ?? name;
          return (
            <li key={name}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(name)}
                aria-pressed={isOn}
                className={cn(
                  "group flex w-full min-h-[4.5rem] items-center gap-3 rounded-2xl border bg-white p-4 shadow-md transition-all duration-200 sm:min-h-[4.75rem] sm:p-5",
                  "touch-manipulation",
                  disabled && "cursor-not-allowed opacity-50",
                  isOn
                    ? "border-pink-500/90 bg-gradient-to-br from-pink-50 to-white shadow-lg shadow-pink-300/35 ring-2 ring-pink-400/40"
                    : "border-stone-100 shadow-stone-200/50 hover:scale-[1.01] hover:border-pink-300/70 hover:shadow-lg hover:shadow-pink-200/30 active:scale-[0.99]",
                )}
              >
                <span className="min-w-0 flex-1 text-start">
                  <span
                    className={cn(
                      "block text-[15px] font-bold leading-snug sm:text-base",
                      isOn ? "text-pink-950" : "text-stone-800",
                    )}
                  >
                    {display}
                  </span>
                  {dur != null ? (
                    <span className="mt-1 block text-[13px] font-medium text-stone-500 sm:text-sm">
                      ~{dur} min session
                    </span>
                  ) : null}
                </span>
                <span
                  className="flex size-[3.25rem] shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-50 to-violet-50 text-2xl shadow-inner sm:size-14 sm:text-[1.65rem]"
                  aria-hidden
                >
                  {emoji}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
