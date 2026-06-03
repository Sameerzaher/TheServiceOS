import Link from "next/link";

import { heUi, paymentStatusLabel } from "@/config";
import { Button, EmptyState, ui } from "@/components/ui";
import { AppointmentStatus, PaymentStatus } from "@/core/types/appointment";
import { isTomorrowAppointment } from "@/core/reminders";
import type {
  AppointmentId,
  AppointmentRecord,
} from "@/core/types/appointment";
import type { Client } from "@/core/types/client";
import { DEFAULT_APP_SETTINGS } from "@/core/types/settings";
import { formatIls } from "@/core/utils/currency";
import { isPaidStatus } from "@/core/utils/insights";
import { getAppointmentServiceLabel } from "@/core/utils/appointmentDisplay";
import { applyReminderTemplate } from "@/core/utils/reminderTemplate";
import { buildWhatsAppHref } from "@/core/utils/whatsapp";
import {
  CustomFieldInputKind,
  type CustomFieldDefinition,
  type VerticalPreset,
} from "@/core/types/vertical";
import { cn } from "@/lib/cn";

export interface AppointmentListProps {
  appointments: AppointmentRecord[];
  /** Total appointments before filters (for empty-filter messaging). */
  totalAppointmentCount?: number;
  clients: Client[];
  preset: VerticalPreset;
  highlightedAppointmentId?: string | null;
  onRequestDelete?: (id: AppointmentId) => void;
  onEdit?: (id: AppointmentId) => void;
  onTogglePaid?: (id: AppointmentId) => void;
  onApproveRequest?: (id: AppointmentId) => void;
  onApproveAndSendWhatsapp?: (id: AppointmentId) => void;
  onRejectRequest?: (id: AppointmentId) => void;
  onChangeStatus?: (id: AppointmentId, status: AppointmentStatus) => void;
  /** For quick WhatsApp — same template as dashboard reminders */
  reminderTemplate?: string;
  businessName?: string;
  businessPhone?: string;
  /** Unpaid → partial → paid → unpaid */
  onCyclePayment?: (id: AppointmentId) => void;
  /** Open editor to reschedule (e.g. change time) */
  onReschedule?: (id: AppointmentId) => void;
}

function isPendingPublicRequest(appt: AppointmentRecord): boolean {
  return (
    appt.customFields?.bookingSource === "public" &&
    appt.customFields?.bookingApproval === "pending" &&
    appt.status === AppointmentStatus.Scheduled
  );
}

function isApprovedPublicRequest(appt: AppointmentRecord): boolean {
  return (
    appt.customFields?.bookingSource === "public" &&
    appt.customFields?.bookingApproval === "approved"
  );
}

function isRejectedPublicRequest(appt: AppointmentRecord): boolean {
  return (
    appt.customFields?.bookingSource === "public" &&
    appt.customFields?.bookingApproval === "rejected"
  );
}

function clientNameById(clients: Client[], id: string): string {
  return clients.find((c) => c.id === id)?.fullName ?? "—";
}

function clientPhoneById(clients: Client[], id: string): string {
  const phone = clients.find((c) => c.id === id)?.phone ?? "";
  return phone.trim() || "—";
}

function appointmentStatusLabel(status: AppointmentStatus): string {
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

function paymentStatusChipClass(status: PaymentStatus): string {
  switch (status) {
    case PaymentStatus.Paid:
    case PaymentStatus.Waived:
      return "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100";
    case PaymentStatus.Partial:
      return "bg-violet-100 text-violet-900 dark:bg-violet-900/40 dark:text-violet-100";
    case PaymentStatus.Pending:
      return "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100";
    case PaymentStatus.Refunded:
      return "bg-neutral-200 text-neutral-800 dark:bg-neutral-600 dark:text-neutral-100";
    case PaymentStatus.Unpaid:
    default:
      return "bg-amber-100 text-amber-950 dark:bg-amber-900/50 dark:text-amber-100";
  }
}

function appointmentStatusColor(status: AppointmentStatus): string {
  switch (status) {
    case AppointmentStatus.Confirmed:
      return "bg-emerald-100 text-emerald-900 border-emerald-200";
    case AppointmentStatus.InProgress:
      return "bg-blue-100 text-blue-900 border-blue-200";
    case AppointmentStatus.Completed:
      return "bg-neutral-100 text-neutral-700 border-neutral-200";
    case AppointmentStatus.Cancelled:
      return "bg-rose-100 text-rose-900 border-rose-200";
    case AppointmentStatus.NoShow:
      return "bg-orange-100 text-orange-900 border-orange-200";
    case AppointmentStatus.Scheduled:
    default:
      return "bg-sky-100 text-sky-900 border-sky-200";
  }
}

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

function formatAppointmentDateOnly(iso: string): string {
  try {
    return new Intl.DateTimeFormat("he-IL", { dateStyle: "medium" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

function formatAppointmentTimeOnly(iso: string): string {
  try {
    return new Intl.DateTimeFormat("he-IL", { timeStyle: "short" }).format(
      new Date(iso),
    );
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

export function AppointmentList({
  appointments,
  totalAppointmentCount = 0,
  clients,
  preset,
  highlightedAppointmentId,
  onRequestDelete,
  onEdit,
  onTogglePaid,
  onApproveRequest,
  onApproveAndSendWhatsapp,
  onRejectRequest,
  onChangeStatus,
  reminderTemplate,
  businessName = "",
  businessPhone = "",
  onCyclePayment,
  onReschedule,
}: AppointmentListProps) {
  const tmpl = reminderTemplate ?? DEFAULT_APP_SETTINGS.reminderTemplate;
  if (appointments.length === 0) {
    const isFilteredOut =
      totalAppointmentCount > 0 && appointments.length === 0;
    return (
      <EmptyState
        title={
          isFilteredOut
            ? heUi.filters.filterResultsEmpty
            : heUi.empty.lessonsListEmpty
        }
        description={
          isFilteredOut ? undefined : heUi.empty.appointmentsDescription
        }
      />
    );
  }

  return (
    <ul className={ui.list}>
      {appointments.map((appt) => {
        const tomorrow = isTomorrowAppointment(appt);
        const pendingRequest = isPendingPublicRequest(appt);
        const approvedRequest = isApprovedPublicRequest(appt);
        const rejectedRequest = isRejectedPublicRequest(appt);
        const clientRow = clients.find((c) => c.id === appt.clientId);
        const phoneRaw = clientRow?.phone?.trim() ?? "";
        const displayName = clientNameById(clients, appt.clientId);
        const waMessage = applyReminderTemplate(tmpl, {
          name: displayName === "—" ? "" : displayName,
          time: formatAppointmentTimeOnly(appt.startAt),
          date: formatAppointmentDateOnly(appt.startAt),
          businessName: businessName.trim(),
          businessPhone: businessPhone.trim(),
        });
        const waHref = buildWhatsAppHref(phoneRaw, waMessage);
        const serviceLabel = getAppointmentServiceLabel(appt, preset);

        return (
          <li key={appt.id}>
            <article
              className={cn(
                ui.listItem,
                ui.cardHover,
                highlightedAppointmentId === appt.id &&
                  "ring-2 ring-amber-400/70 ring-offset-2 ring-offset-neutral-50",
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <h3 className="text-base font-semibold leading-tight text-neutral-900 dark:text-neutral-100 sm:text-lg">
                      <Link
                        href={`/clients/${appt.clientId}`}
                        className="underline-offset-2 hover:underline"
                      >
                        {clientNameById(clients, appt.clientId)}
                      </Link>
                    </h3>
                    {tomorrow ? (
                      <span
                        className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-900 dark:bg-sky-900 dark:text-sky-100 sm:text-xs"
                        title={heUi.appointments.tomorrowBadgeTitle}
                      >
                        {heUi.appointments.tomorrowBadge}
                      </span>
                    ) : null}
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-xs",
                        paymentStatusChipClass(appt.paymentStatus),
                      )}
                    >
                      {paymentStatusLabel(appt.paymentStatus)}
                    </span>
                    {pendingRequest ? (
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-900 dark:bg-violet-900 dark:text-violet-100 sm:text-xs">
                        {heUi.appointments.pendingApprovalBadge}
                      </span>
                    ) : null}
                    {approvedRequest ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100 sm:text-xs">
                        {heUi.appointments.approvedRequestBadge}
                      </span>
                    ) : null}
                    {rejectedRequest ? (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-900 dark:bg-rose-900 dark:text-rose-100 sm:text-xs">
                        {heUi.appointments.rejectedRequestBadge}
                      </span>
                    ) : null}
                  </div>
                  <div className="grid gap-1 text-xs sm:text-sm">
                    <p className="text-neutral-700 dark:text-neutral-300">
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">
                        {heUi.appointments.listDateLabel}
                      </span>{" "}
                      {formatAppointmentDateOnly(appt.startAt)}
                    </p>
                    <p className="text-neutral-700 dark:text-neutral-300">
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">
                        {heUi.appointments.listTimeLabel}
                      </span>{" "}
                      {formatAppointmentTimeOnly(appt.startAt)}
                    </p>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">
                        {heUi.appointments.phonePrefix}
                      </span>
                      {clientPhoneById(clients, appt.clientId)}
                    </p>
                    <p className="text-neutral-800 dark:text-neutral-200">
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">
                        {heUi.appointments.serviceLabel}:{" "}
                      </span>
                      <span className="text-neutral-700 dark:text-neutral-300">
                        {serviceLabel}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-neutral-700 dark:text-neutral-300 sm:text-xs">
                      {heUi.appointments.statusPrefix}
                    </span>
                    <span
                      className={cn(
                        "rounded-lg border px-2 py-0.5 text-[10px] font-semibold sm:px-3 sm:py-1 sm:text-xs",
                        appointmentStatusColor(appt.status)
                      )}
                    >
                      {appointmentStatusLabel(appt.status)}
                    </span>
                  </div>
                  {onChangeStatus && !pendingRequest && (
                    <div className="flex flex-wrap gap-1.5">
                      {appt.status !== AppointmentStatus.Confirmed && (
                        <button
                          type="button"
                          onClick={() => onChangeStatus(appt.id, AppointmentStatus.Confirmed)}
                          className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-300 sm:px-2.5 sm:text-xs"
                        >
                          ✓ אשר
                        </button>
                      )}
                      {appt.status !== AppointmentStatus.Completed && appt.status !== AppointmentStatus.Cancelled && (
                        <button
                          type="button"
                          onClick={() => onChangeStatus(appt.id, AppointmentStatus.Completed)}
                          className="rounded-md bg-neutral-50 px-2 py-1 text-[11px] font-medium text-neutral-700 transition hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 sm:px-2.5 sm:text-xs"
                        >
                          ✓ הושלם
                        </button>
                      )}
                      {appt.status !== AppointmentStatus.Cancelled && appt.status !== AppointmentStatus.Completed && (
                        <button
                          type="button"
                          onClick={() => onChangeStatus(appt.id, AppointmentStatus.Cancelled)}
                          className="rounded-md bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700 transition hover:bg-rose-100 dark:bg-rose-900 dark:text-rose-300 sm:px-2.5 sm:text-xs"
                        >
                          ✗ בטל
                        </button>
                      )}
                      {appt.status !== AppointmentStatus.NoShow && appt.status !== AppointmentStatus.Completed && appt.status !== AppointmentStatus.Cancelled && (
                        <button
                          type="button"
                          onClick={() => onChangeStatus(appt.id, AppointmentStatus.NoShow)}
                          className="rounded-md bg-orange-50 px-2 py-1 text-[11px] font-medium text-orange-700 transition hover:bg-orange-100 dark:bg-orange-900 dark:text-orange-300 sm:px-2.5 sm:text-xs"
                        >
                          לא הגיע
                        </button>
                      )}
                    </div>
                  )}
                  <div className="grid gap-1 text-xs sm:text-sm">
                    <p className="text-neutral-600 dark:text-neutral-400">
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">
                        {heUi.appointments.amountPrefix}
                      </span>
                      {formatIls(appt.amount ?? 0)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:max-w-[14rem] sm:shrink-0 sm:flex-col">
                  {onChangeStatus &&
                  appt.status !== AppointmentStatus.Completed &&
                  appt.status !== AppointmentStatus.Cancelled &&
                  !pendingRequest ? (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() =>
                        onChangeStatus(appt.id, AppointmentStatus.Completed)
                      }
                    >
                      {heUi.appointments.quickComplete}
                    </Button>
                  ) : null}
                  {waHref ? (
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${heUi.appointments.sendReminder} — ${displayName}`}
                      className={cn(
                        "inline-flex min-h-[2.5rem] w-full items-center justify-center gap-1.5 rounded-xl border-2 border-emerald-600/35 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 shadow-md transition-all duration-200 hover:border-emerald-500 hover:bg-emerald-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 active:scale-95 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-100 dark:hover:bg-emerald-900/60 sm:w-auto sm:text-sm",
                      )}
                    >
                      <span aria-hidden>💬</span>
                      {heUi.appointments.sendReminder}
                    </a>
                  ) : phoneRaw ? null : (
                    <span
                      className="self-center text-[10px] text-neutral-400 sm:text-xs"
                      title={heUi.whatsapp.noPhoneDetail}
                    >
                      {heUi.whatsapp.noPhone}
                    </span>
                  )}
                  {onReschedule ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => onReschedule(appt.id)}
                    >
                      {heUi.appointments.reschedule}
                    </Button>
                  ) : null}
                  {pendingRequest && onApproveRequest ? (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => onApproveRequest(appt.id)}
                    >
                      {heUi.appointments.approveRequest}
                    </Button>
                  ) : null}
                  {pendingRequest && onApproveAndSendWhatsapp ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onApproveAndSendWhatsapp(appt.id)}
                    >
                      {heUi.appointments.approveAndSendWhatsapp}
                    </Button>
                  ) : null}
                  {pendingRequest && onRejectRequest ? (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => onRejectRequest(appt.id)}
                    >
                      {heUi.appointments.rejectRequest}
                    </Button>
                  ) : null}
                  {onCyclePayment ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="w-full border-violet-200 bg-violet-50 text-violet-950 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-100 sm:w-auto"
                      onClick={() => onCyclePayment(appt.id)}
                      aria-label={`${heUi.appointments.cyclePayment} — ${displayName}`}
                    >
                      {heUi.appointments.cyclePayment}
                    </Button>
                  ) : onTogglePaid ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => onTogglePaid(appt.id)}
                      aria-label={
                        isPaidStatus(appt.paymentStatus)
                          ? `${heUi.appointments.markUnpaid} — ${clientNameById(clients, appt.clientId)}`
                          : `${heUi.appointments.markPaid} — ${clientNameById(clients, appt.clientId)}`
                      }
                      aria-pressed={isPaidStatus(appt.paymentStatus)}
                    >
                      {isPaidStatus(appt.paymentStatus)
                        ? heUi.appointments.markUnpaid
                        : heUi.appointments.markPaid}
                    </Button>
                  ) : null}
                  {onEdit ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onEdit(appt.id)}
                      aria-label={`${heUi.appointments.edit} — ${formatStartAt(appt.startAt)}`}
                    >
                      {heUi.appointments.edit}
                    </Button>
                  ) : null}
                  {onRequestDelete ? (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => onRequestDelete(appt.id)}
                      aria-label={`${heUi.appointments.delete}: ${clientNameById(clients, appt.clientId)} — ${formatStartAt(appt.startAt)}`}
                    >
                      {heUi.appointments.delete}
                    </Button>
                  ) : null}
                </div>
              </div>

              {preset.appointmentFields.length > 0 ? (
                <dl className="mt-3 grid gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-700 sm:mt-4 sm:grid-cols-2 sm:gap-x-6 sm:pt-4">
                  {preset.appointmentFields.map((def) => {
                    const raw = appt.customFields[def.key];
                    return (
                      <div key={def.key} className="min-w-0">
                        <dt className="text-[10px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400 sm:text-xs">
                          {def.label}
                        </dt>
                        <dd className="mt-0.5 break-words text-xs text-neutral-900 dark:text-neutral-100 sm:text-sm">
                          {formatCustomValue(def, raw)}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              ) : null}
            </article>
          </li>
        );
      })}
    </ul>
  );
}
