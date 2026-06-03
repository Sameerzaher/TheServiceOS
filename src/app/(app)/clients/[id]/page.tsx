"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";

import { heUi, paymentStatusLabel } from "@/config";
import { Button, EmptyState, InlineLoading, ui } from "@/components/ui";
import { useServiceApp } from "@/features/app/ServiceAppProvider";
import type { AppointmentRecord } from "@/core/types/appointment";
import { AppointmentStatus } from "@/core/types/appointment";
import { getAppointmentServiceLabel } from "@/core/utils/appointmentDisplay";
import { formatIls } from "@/core/utils/currency";
import { getLastLesson, getNextLesson } from "@/core/utils/clientSchedule";
import {
  sumClientDebt,
  sumClientPaid,
} from "@/core/utils/insights";
import { WhatsAppActionButton } from "@/components/whatsapp/WhatsAppActionButton";
import {
  whatsappFollowUpAfterAppointmentHref,
  whatsappPaymentReminderHref,
} from "@/core/whatsapp";
import { buildWhatsAppHref } from "@/core/utils/whatsapp";
import { cn } from "@/lib/cn";
import {
  CustomFieldInputKind,
  type CustomFieldDefinition,
} from "@/core/types/vertical";

function formatStartAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat("he-IL", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatCustomValue(
  def: CustomFieldDefinition,
  value: unknown,
): string {
  if (value === undefined || value === null) {
    return "—";
  }
  switch (def.kind) {
    case CustomFieldInputKind.Boolean:
      return value === true ? heUi.boolean.yes : heUi.boolean.no;
    case CustomFieldInputKind.Number: {
      if (typeof value === "number" && !Number.isNaN(value)) {
        return String(value);
      }
      const n = Number(value);
      return Number.isNaN(n) ? "—" : String(n);
    }
    case CustomFieldInputKind.Date:
      return typeof value === "string" ? value : String(value);
    default:
      return String(value);
  }
}

export default function ClientProfilePage() {
  const params = useParams();
  const segment = params.id;
  const id =
    typeof segment === "string"
      ? segment
      : Array.isArray(segment)
        ? (segment[0] ?? "")
        : "";
  const {
    preset,
    settings,
    sortedClients,
    clientsReady,
    sortedAppointments,
    appointmentsReady,
  } = useServiceApp();

  const client = useMemo(
    () => sortedClients.find((c) => c.id === id),
    [sortedClients, id],
  );

  const clientAppointments = useMemo((): AppointmentRecord[] => {
    if (!id) return [];
    return sortedAppointments.filter((a) => a.clientId === id);
  }, [sortedAppointments, id]);

  const { paidTotal, debtTotal } = useMemo(() => {
    if (!id) {
      return { paidTotal: 0, debtTotal: 0 };
    }
    return {
      paidTotal: sumClientPaid(sortedAppointments, id),
      debtTotal: sumClientDebt(sortedAppointments, id),
    };
  }, [id, sortedAppointments]);

  const lessonCount = clientAppointments.length;

  const lastLesson = useMemo(() => {
    if (!id) return null;
    return getLastLesson(id, sortedAppointments);
  }, [id, sortedAppointments]);

  const nextLesson = useMemo(() => {
    if (!id) return null;
    return getNextLesson(id, sortedAppointments, new Date());
  }, [id, sortedAppointments]);

  function appointmentStatusLabelHe(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.Confirmed:
        return heUi.appointments.statusConfirmed;
      case AppointmentStatus.InProgress:
        return heUi.appointments.statusInProgress;
      case AppointmentStatus.Completed:
        return heUi.appointments.statusCompleted;
      case AppointmentStatus.Cancelled:
        return heUi.appointments.statusCancelled;
      case AppointmentStatus.NoShow:
        return heUi.appointments.statusNoShow;
      case AppointmentStatus.Scheduled:
      default:
        return heUi.appointments.statusScheduled;
    }
  }

  if (!clientsReady || !appointmentsReady) {
    return (
      <main className={ui.pageMain}>
        <InlineLoading className="py-8" />
      </main>
    );
  }

  if (!client) {
    return (
      <main className={ui.pageMain}>
        <EmptyState
          tone="muted"
          title={heUi.clientProfile.notFound}
          description={heUi.clientProfile.notFoundHint}
          className="mb-6"
        />
        <Link
          href="/clients"
          className="inline-flex font-medium text-neutral-900 underline-offset-2 hover:underline"
        >
          {heUi.clientProfile.back}
        </Link>
      </main>
    );
  }

  const whatsappHref = buildWhatsAppHref(client.phone);
  const paymentPingHref =
    debtTotal > 0
      ? whatsappPaymentReminderHref(client.phone, {
          name: client.fullName.trim() || "לקוח",
          amountDue: formatIls(debtTotal),
          businessName: settings.businessName.trim(),
        })
      : null;
  const followUpHref = whatsappFollowUpAfterAppointmentHref(client.phone, {
    name: client.fullName.trim() || "לקוח",
    businessName: settings.businessName.trim(),
  });

  return (
    <main className={ui.pageMain}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <Link
          href="/clients"
          className="inline-flex min-h-[2.5rem] items-center text-sm font-medium text-neutral-700 underline-offset-2 hover:underline"
        >
          ← {heUi.clientProfile.back}
        </Link>
        <div className="flex w-full max-w-md flex-col gap-2 sm:w-auto sm:items-end">
          <WhatsAppActionButton
            href={whatsappHref}
            variant="primary"
            fullWidth
            className="sm:w-auto"
            disabledHint={heUi.whatsapp.noPhoneDetail}
          >
            {heUi.whatsapp.openChat}
          </WhatsAppActionButton>
          {debtTotal > 0 ? (
            <WhatsAppActionButton
              href={paymentPingHref}
              variant="secondary"
              fullWidth
              className="sm:w-auto"
              disabledHint={heUi.whatsapp.noPhoneDetail}
            >
              {heUi.clientProfile.debtWhatsappHint}
            </WhatsAppActionButton>
          ) : null}
          <WhatsAppActionButton
            href={followUpHref}
            variant="secondary"
            fullWidth
            className="sm:w-auto"
            disabledHint={heUi.whatsapp.noPhoneDetail}
          >
            {heUi.whatsapp.followUp}
          </WhatsAppActionButton>
        </div>
      </div>

      <header className={ui.header}>
        <h1 className={ui.pageTitle}>{client.fullName}</h1>
        <p className={ui.pageSubtitle}>
          <span className="font-medium text-neutral-700">
            {heUi.forms.phonePrefix}
          </span>
          {client.phone.trim() ? client.phone : "—"}
        </p>
      </header>

      <div className={ui.pageStack}>
        <section className={ui.section}>
          <h2 className={ui.sectionHeading}>{heUi.clientProfile.overviewTitle}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className={cn(ui.statCard, "text-start")}>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                {heUi.clientProfile.nextAppointment}
              </p>
              <p className="mt-2 text-sm font-semibold text-neutral-900">
                {nextLesson
                  ? formatStartAt(nextLesson.startAt)
                  : heUi.clientProfile.noNextAppointment}
              </p>
            </div>
            <div className={cn(ui.statCard, "text-start")}>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                {heUi.clientProfile.lastLesson}
              </p>
              <p className="mt-2 text-sm font-semibold text-neutral-900">
                {lastLesson
                  ? formatStartAt(lastLesson.startAt)
                  : heUi.clientProfile.noLastLesson}
              </p>
            </div>
          </div>
        </section>

        <section className={ui.section}>
          <h2 className={ui.sectionHeading}>{heUi.forms.notes}</h2>
          <p className="rounded-xl border border-neutral-200/90 bg-white p-4 text-neutral-800 shadow-sm">
            {client.notes.trim() ? client.notes : "—"}
          </p>
        </section>

        <section className={ui.section}>
          <h2 className={ui.sectionHeading}>
            {heUi.clientProfile.paymentSummaryTitle}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className={ui.statCard}>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                {heUi.clientProfile.lessonsTotal}
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-neutral-900">
                {lessonCount}
              </p>
            </div>
            <div className={ui.statCard}>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                {heUi.clientProfile.paidTotal}
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-emerald-900">
                {formatIls(paidTotal)}
              </p>
            </div>
            <div
              className={cn(
                ui.statCard,
                "border-2 border-amber-500 bg-amber-50 shadow-md sm:col-span-1",
              )}
            >
              <p className="text-xs font-bold uppercase tracking-wide text-amber-950">
                {heUi.clientProfile.debtTitle}
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-amber-950">
                {formatIls(debtTotal)}
              </p>
            </div>
          </div>
        </section>

        {preset.clientFields.length > 0 ? (
          <section className={ui.section}>
            <h2 className={ui.sectionHeading}>
              {heUi.clientProfile.detailsTitle}
            </h2>
            <dl className="grid gap-3 rounded-xl border border-neutral-200/90 bg-white p-4 shadow-sm sm:grid-cols-2">
              {preset.clientFields.map((def) => {
                const raw = client.customFields[def.key];
                return (
                  <div key={def.key}>
                    <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                      {def.label}
                    </dt>
                    <dd className="mt-0.5 text-sm text-neutral-900">
                      {formatCustomValue(def, raw)}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        ) : null}

        <section className={ui.section}>
          <h2 className={ui.sectionHeading}>
            {heUi.clientProfile.appointmentsHistory}
          </h2>
          {clientAppointments.length === 0 ? (
            <div className="space-y-3">
              <EmptyState
                tone="muted"
                className="py-8"
                title={heUi.clientProfile.appointmentsEmptyTitle}
                description={heUi.clientProfile.appointmentsEmptyHint}
              />
              <div className="flex justify-center">
                <Link href="/appointments">
                  <Button type="button" variant="secondary">
                    {preset.labels.addLesson}
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {[...clientAppointments]
                .sort(
                  (a, b) =>
                    new Date(b.startAt).getTime() -
                    new Date(a.startAt).getTime(),
                )
                .map((appt) => (
                  <li
                    key={appt.id}
                    className={`${ui.card} ${ui.cardPadding} flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between`}
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-medium text-neutral-900">
                        {formatStartAt(appt.startAt)}
                      </p>
                      <p className="text-xs text-neutral-600">
                        {heUi.appointments.serviceLabel}:{" "}
                        {getAppointmentServiceLabel(appt, preset)}
                      </p>
                      <p className="text-xs text-neutral-600">
                        {heUi.appointments.statusPrefix}{" "}
                        {appointmentStatusLabelHe(appt.status)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-800 dark:bg-neutral-700 dark:text-neutral-100">
                        {paymentStatusLabel(appt.paymentStatus)}
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-neutral-900">
                        {formatIls(appt.amount ?? 0)}
                      </span>
                      <Link
                        href={`/appointments?edit=${encodeURIComponent(appt.id)}`}
                        className="text-xs font-medium text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-300"
                      >
                        {heUi.appointments.edit}
                      </Link>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
