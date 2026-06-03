"use client";

import { useRouter } from "next/navigation";

import { heUi } from "@/config";
import { cn } from "@/lib/cn";

/** Section `id`s for scroll targets and page wiring. */
export const ONBOARDING_ANCHORS = {
  clientForm: "onboarding-first-client",
  lessonForm: "onboarding-first-lesson",
  summary: "onboarding-summary",
} as const;

export interface FirstRunOnboardingProps {
  hasClient: boolean;
  hasAppointment: boolean;
  remindersReviewed: boolean;
  onMarkRemindersReviewed: () => void;
  onDismiss: () => void;
}

export function FirstRunOnboarding({
  hasClient,
  hasAppointment,
  remindersReviewed,
  onMarkRemindersReviewed,
  onDismiss,
}: FirstRunOnboardingProps) {
  const router = useRouter();

  const checklist = [
    {
      id: "client",
      title: heUi.onboarding.checklistAddClient,
      done: hasClient,
      action: () => router.push("/clients"),
      actionLabel: heUi.onboarding.jumpToClientForm,
    },
    {
      id: "appointment",
      title: heUi.onboarding.checklistAddLesson,
      done: hasAppointment,
      action: () => router.push("/appointments"),
      actionLabel: heUi.onboarding.jumpToLessonForm,
    },
    {
      id: "reminders",
      title: heUi.onboarding.checklistReviewReminders,
      done: remindersReviewed,
      action: () => {
        router.push("/");
        window.requestAnimationFrame(() => {
          document
            .getElementById(ONBOARDING_ANCHORS.summary)
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        onMarkRemindersReviewed();
      },
      actionLabel: heUi.onboarding.markRemindersReviewed,
    },
  ] as const;
  const completed = checklist.filter((item) => item.done).length;
  const total = checklist.length;

  return (
    <section
      className="rounded-xl border border-amber-200/90 bg-amber-50/95 px-4 py-3 text-amber-950 shadow-sm"
      aria-labelledby="onboarding-heading"
      role="region"
    >
      <div className="flex flex-col gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <h2
            id="onboarding-heading"
            className="text-sm font-semibold text-amber-950 sm:text-base"
          >
            {heUi.onboarding.welcomeTitle}
          </h2>
          <p className="text-sm leading-relaxed text-amber-900/95">
            {heUi.onboarding.welcomeHint}
          </p>
          <p className="text-xs font-medium text-amber-900/80">
            {heUi.onboarding.progressLabel(completed, total)}
          </p>
        </div>

        <ul className="space-y-2">
          {checklist.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-white/70 px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2 text-sm">
                <span
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs",
                    item.done
                      ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                      : "border-amber-300 bg-amber-100 text-amber-900",
                  )}
                  aria-hidden
                >
                  {item.done ? "✓" : "•"}
                </span>
                <span className={cn(item.done && "text-amber-900/80 line-through")}>
                  {item.title}
                </span>
              </div>
              {!item.done ? (
                <button
                  type="button"
                  onClick={item.action}
                  className={cn(
                    "min-h-[2.25rem] shrink-0 rounded-lg border border-amber-700 bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition",
                    "hover:bg-amber-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700",
                  )}
                >
                  {item.actionLabel}
                </button>
              ) : null}
            </li>
          ))}
        </ul>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onDismiss}
            className="min-h-[2.25rem] rounded-lg px-3 py-1.5 text-xs font-medium text-amber-900 underline-offset-2 transition hover:underline"
          >
            {heUi.onboarding.dismiss}
          </button>
        </div>
      </div>
    </section>
  );
}
