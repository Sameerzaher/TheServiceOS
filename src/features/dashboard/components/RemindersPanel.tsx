"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

import { heUi } from "@/config";
import { Button, EmptyState, ui, useToast } from "@/components/ui";
import {
  dedupeReminderBuckets,
  formatAmountDueForTemplate,
  getPaymentReminderCandidates,
  getSameDayReminderCandidates,
  getTomorrowReminderCandidates,
  type ReminderKind,
} from "@/core/reminders";
import type { AppointmentRecord } from "@/core/types/appointment";
import type { Client } from "@/core/types/client";
import { buildWhatsAppHref } from "@/core/utils/whatsapp";
import { applyReminderTemplate } from "@/core/utils/reminderTemplate";
import { useDashboardTeacherId } from "@/features/app/DashboardTeacherContext";
import { AiReminderButton } from "@/features/reminders/components/AiReminderButton";
import {
  getLocalDateYmd,
  isReminderMarkedSentLocal,
  markReminderSentLocal,
} from "@/features/reminders/reminderSentLocal";

export type ReminderWorkflowSettings = {
  remindersEnabled: boolean;
  reminderTomorrow: boolean;
  reminderSameDay: boolean;
  reminderPaymentUnpaid: boolean;
  reminderTemplate: string;
  sameDayReminderTemplate: string;
  paymentReminderTemplate: string;
  businessName?: string;
  businessPhone?: string;
};

export interface RemindersPanelProps {
  appointments: AppointmentRecord[];
  clients: Client[];
  workflow: ReminderWorkflowSettings;
  onCopied?: () => void;
}

function formatTimeShort(iso: string): string {
  try {
    return new Intl.DateTimeFormat("he-IL", { timeStyle: "short" }).format(
      new Date(iso),
    );
  } catch {
    return "";
  }
}

function formatDateMedium(iso: string): string {
  try {
    return new Intl.DateTimeFormat("he-IL", { dateStyle: "medium" }).format(
      new Date(iso),
    );
  } catch {
    return "";
  }
}

function templateForKind(
  kind: ReminderKind,
  w: ReminderWorkflowSettings,
): string {
  if (kind === "payment") return w.paymentReminderTemplate;
  if (kind === "same_day") {
    const o = w.sameDayReminderTemplate.trim();
    return o.length > 0 ? o : w.reminderTemplate;
  }
  return w.reminderTemplate;
}

export function RemindersPanel({
  appointments,
  clients,
  workflow,
  onCopied,
}: RemindersPanelProps) {
  const toast = useToast();
  const teacherId = useDashboardTeacherId();
  const reference = new Date();
  const sendDateYmd = getLocalDateYmd(reference);

  const rawTomorrow = !workflow.reminderTomorrow
    ? []
    : getTomorrowReminderCandidates(appointments, reference);

  const rawSameDay = !workflow.reminderSameDay
    ? []
    : getSameDayReminderCandidates(appointments, reference);

  const rawPayment = !workflow.reminderPaymentUnpaid
    ? []
    : getPaymentReminderCandidates(appointments);

  const { tomorrow: tomorrowRows, sameDay: sameDayRows, payment: paymentRows } =
    dedupeReminderBuckets(rawTomorrow, rawSameDay, rawPayment);

  const clientById = useMemo(
    () => new Map(clients.map((c) => [c.id, c])),
    [clients],
  );

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  /** Bumps after marking sent so “sent today” re-reads localStorage. */
  const [sentTick, setSentTick] = useState(0);

  const anyChannelEnabled =
    workflow.reminderTomorrow ||
    workflow.reminderSameDay ||
    workflow.reminderPaymentUnpaid;

  function reminderTextFor(
    appt: AppointmentRecord,
    kind: ReminderKind,
  ): string {
    const name = clientById.get(appt.clientId)?.fullName ?? "";
    const time = formatTimeShort(appt.startAt);
    const date = formatDateMedium(appt.startAt);
    const businessName = (workflow.businessName ?? "").trim();
    const businessPhone = (workflow.businessPhone ?? "").trim();
    const amountDue =
      kind === "payment"
        ? formatAmountDueForTemplate(appt.amount ?? 0)
        : undefined;
    return applyReminderTemplate(templateForKind(kind, workflow), {
      name,
      time,
      date,
      businessName,
      businessPhone,
      ...(amountDue !== undefined ? { amountDue } : {}),
    });
  }

  async function copyMessage(
    appt: AppointmentRecord,
    kind: ReminderKind,
  ): Promise<void> {
    if (busyId !== null) return;
    const text = reminderTextFor(appt, kind);
    const key = `${appt.id}:${kind}`;
    setBusyId(key);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(key);
      onCopied?.();
      window.setTimeout(
        () => setCopiedId((cur) => (cur === key ? null : cur)),
        2000,
      );
    } catch {
      toast(heUi.reminders.clipboardError, "error");
      setCopiedId(null);
    } finally {
      setBusyId(null);
    }
  }

  function openWhatsapp(appt: AppointmentRecord, kind: ReminderKind): void {
    const phone = clientById.get(appt.clientId)?.phone?.trim() ?? "";
    const href = buildWhatsAppHref(phone, reminderTextFor(appt, kind));
    if (href) {
      markReminderSentLocal(teacherId, appt.id, kind, sendDateYmd);
      setSentTick((t) => t + 1);
      window.open(href, "_blank", "noopener,noreferrer");
    }
  }

  function isSentToday(appt: AppointmentRecord, kind: ReminderKind): boolean {
    void sentTick;
    return isReminderMarkedSentLocal(teacherId, appt.id, kind, sendDateYmd);
  }

  if (!workflow.remindersEnabled) {
    return (
      <div className="rounded-xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-5">
        <h3 className="text-base font-semibold leading-snug text-neutral-900 sm:text-lg">
          {heUi.reminders.workflowTitle}
        </h3>
        <EmptyState
          className="py-8 sm:py-10"
          tone="muted"
          title={heUi.reminders.disabledTitle}
          description={heUi.reminders.disabledHint}
        />
        <div className="flex justify-center">
          <Link
            href="/settings"
            className="text-sm font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
          >
            {heUi.reminders.openSettings}
          </Link>
        </div>
      </div>
    );
  }

  if (!anyChannelEnabled) {
    return (
      <div className="rounded-xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-5">
        <h3 className="text-base font-semibold leading-snug text-neutral-900 sm:text-lg">
          {heUi.reminders.workflowTitle}
        </h3>
        <EmptyState
          className="py-8 sm:py-10"
          tone="muted"
          title={heUi.reminders.allChannelsOffTitle}
          description={heUi.reminders.allChannelsOffHint}
        />
        <div className="flex justify-center">
          <Link
            href="/settings"
            className="text-sm font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
          >
            {heUi.reminders.openSettings}
          </Link>
        </div>
      </div>
    );
  }

  const totalRows =
    tomorrowRows.length + sameDayRows.length + paymentRows.length;

  return (
    <div className="rounded-xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-5">
      <h3 className="text-base font-semibold leading-snug text-neutral-900 sm:text-lg">
        {heUi.reminders.workflowTitle}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">
        {heUi.reminders.workflowIntro}
      </p>

      {totalRows === 0 ? (
        <EmptyState
          className="py-8 sm:py-10"
          tone="muted"
          title={heUi.reminders.workflowEmptyTitle}
          description={heUi.reminders.workflowEmptyHint}
        />
      ) : (
        <div className="mt-5 flex flex-col gap-8">
          {workflow.reminderTomorrow ? (
            <ReminderSubsection
              title={heUi.reminders.sectionTomorrow}
              rows={tomorrowRows}
              kind="tomorrow"
              emptyTitle={heUi.reminders.emptyTomorrowSection}
              emptyHint={heUi.reminders.emptyTomorrowSectionHint}
              clientById={clientById}
              copiedId={copiedId}
              busyId={busyId}
              isSentToday={isSentToday}
              onCopy={(a) => void copyMessage(a, "tomorrow")}
              onWhatsapp={(a) => openWhatsapp(a, "tomorrow")}
              renderExtra={(appt, name) => (
                <AiReminderButton
                  clientName={name === "—" ? "" : name}
                  date={
                    formatDateMedium(appt.startAt) || appt.startAt.slice(0, 10)
                  }
                  time={formatTimeShort(appt.startAt) || "00:00"}
                  businessName={workflow.businessName ?? ""}
                  onCopied={onCopied}
                />
              )}
              formatTimeShort={formatTimeShort}
            />
          ) : null}

          {workflow.reminderSameDay ? (
            <ReminderSubsection
              title={heUi.reminders.sectionSameDay}
              rows={sameDayRows}
              kind="same_day"
              emptyTitle={heUi.reminders.emptySameDaySection}
              emptyHint={heUi.reminders.emptySameDaySectionHint}
              clientById={clientById}
              copiedId={copiedId}
              busyId={busyId}
              isSentToday={isSentToday}
              onCopy={(a) => void copyMessage(a, "same_day")}
              onWhatsapp={(a) => openWhatsapp(a, "same_day")}
              renderExtra={(appt, name) => (
                <AiReminderButton
                  clientName={name === "—" ? "" : name}
                  date={
                    formatDateMedium(appt.startAt) || appt.startAt.slice(0, 10)
                  }
                  time={formatTimeShort(appt.startAt) || "00:00"}
                  businessName={workflow.businessName ?? ""}
                  onCopied={onCopied}
                />
              )}
              formatTimeShort={formatTimeShort}
            />
          ) : null}

          {workflow.reminderPaymentUnpaid ? (
            <ReminderSubsection
              title={heUi.reminders.sectionPayment}
              rows={paymentRows}
              kind="payment"
              emptyTitle={heUi.reminders.emptyPaymentSection}
              emptyHint={heUi.reminders.emptyPaymentSectionHint}
              clientById={clientById}
              copiedId={copiedId}
              busyId={busyId}
              isSentToday={isSentToday}
              onCopy={(a) => void copyMessage(a, "payment")}
              onWhatsapp={(a) => openWhatsapp(a, "payment")}
              renderExtra={() => null}
              formatTimeShort={formatTimeShort}
            />
          ) : null}
        </div>
      )}

      <p className="mt-6 text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400 sm:text-xs">
        {heUi.reminders.automationNote}
      </p>
    </div>
  );
}

function ReminderSubsection({
  title,
  rows,
  kind,
  emptyTitle,
  emptyHint,
  clientById,
  copiedId,
  busyId,
  isSentToday,
  onCopy,
  onWhatsapp,
  renderExtra,
  formatTimeShort,
}: {
  title: string;
  rows: AppointmentRecord[];
  kind: ReminderKind;
  emptyTitle: string;
  emptyHint: string;
  clientById: Map<string, Client>;
  copiedId: string | null;
  busyId: string | null;
  isSentToday: (a: AppointmentRecord, k: ReminderKind) => boolean;
  onCopy: (a: AppointmentRecord) => void;
  onWhatsapp: (a: AppointmentRecord) => void;
  renderExtra: (appt: AppointmentRecord, name: string) => ReactNode;
  formatTimeShort: (iso: string) => string;
}) {
  if (rows.length === 0) {
    return (
      <div>
        <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
          {title}
        </h4>
        <EmptyState
          className="py-6 sm:py-8"
          tone="muted"
          title={emptyTitle}
          description={emptyHint}
        />
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
        {title}
      </h4>
      <ul className="mt-3 flex flex-col gap-3">
        {rows.map((appt) => {
          const name = clientById.get(appt.clientId)?.fullName ?? "—";
          const key = `${appt.id}:${kind}`;
          const isBusy = busyId === key;
          const sent = isSentToday(appt, kind);
          const phone = (clientById.get(appt.clientId)?.phone ?? "").trim();
          return (
            <li
              key={key}
              className={`flex flex-col gap-3 ${ui.card} ${ui.cardPadding} sm:flex-row sm:items-center sm:justify-between sm:gap-4`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">
                    {name}
                  </p>
                  {sent ? (
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100 sm:text-xs">
                      {heUi.reminders.sentTodayBadge}
                    </span>
                  ) : (
                    <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 sm:text-xs">
                      {heUi.reminders.notSentBadge}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
                  {formatTimeShort(appt.startAt)}
                  {kind === "payment" ? (
                    <span className="ms-2 text-neutral-500">
                      · {formatAmountDueForTemplate(appt.amount ?? 0)}
                    </span>
                  ) : null}
                </p>
              </div>
              <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:items-stretch">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    className="w-full shrink-0 sm:w-auto"
                    disabled={busyId !== null || !phone}
                    title={!phone ? heUi.whatsapp.noPhoneDetail : undefined}
                    aria-busy={isBusy}
                    aria-label={`${heUi.reminders.openWhatsapp} — ${name}`}
                    onClick={() => onWhatsapp(appt)}
                  >
                    {heUi.reminders.openWhatsapp}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    className="w-full shrink-0 sm:w-auto"
                    disabled={busyId !== null}
                    aria-busy={isBusy}
                    aria-label={`${heUi.reminders.copyWhatsapp} — ${name}`}
                    onClick={() => onCopy(appt)}
                  >
                    {copiedId === key
                      ? heUi.reminders.copied
                      : heUi.reminders.copyWhatsapp}
                  </Button>
                </div>
                {renderExtra(appt, name)}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
