import Link from "next/link";

import { heUi } from "@/config";
import { Button, EmptyState, ui } from "@/components/ui";
import type { AppointmentRecord } from "@/core/types/appointment";
import type { Client, ClientId } from "@/core/types/client";
import {
  getLastLesson,
  getNextLesson,
} from "@/core/utils/clientSchedule";
import { formatIls } from "@/core/utils/currency";
import { sumClientDebt } from "@/core/utils/insights";
import {
  CustomFieldInputKind,
  type CustomFieldDefinition,
  type VerticalPreset,
} from "@/core/types/vertical";
import { cn } from "@/lib/cn";

export interface ClientListProps {
  clients: Client[];
  /** Total clients before search filter (for empty-search messaging). */
  totalClientCount?: number;
  preset: VerticalPreset;
  /** When provided, shows "next lesson" per client. */
  appointments?: readonly AppointmentRecord[];
  referenceDate?: Date;
  highlightedClientId?: string | null;
  onEdit?: (id: ClientId) => void;
  onRequestDelete?: (id: ClientId) => void;
  /** Opens add-lesson flow with this client pre-selected (e.g. scroll + prefill). */
  onAddLessonForClient?: (id: ClientId) => void;
}

function formatNextWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("he-IL", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatShortDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("he-IL", {
      day: "numeric",
      month: "short",
      year: "numeric",
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

export function ClientList({
  clients,
  totalClientCount = 0,
  preset,
  appointments,
  referenceDate,
  highlightedClientId,
  onEdit,
  onRequestDelete,
  onAddLessonForClient,
}: ClientListProps) {
  const ref = referenceDate ?? new Date();

  if (clients.length === 0) {
    const isFilteredOut = totalClientCount > 0;
    return (
      <EmptyState
        title={
          isFilteredOut
            ? heUi.filters.filterResultsEmpty
            : heUi.clientsPage.listEmptyTitle
        }
        description={
          isFilteredOut ? undefined : heUi.clientsPage.listEmptyDescription
        }
      />
    );
  }

  return (
    <ul className={ui.list}>
      {clients.map((client) => {
        const next =
          appointments && appointments.length > 0
            ? getNextLesson(client.id, appointments, ref)
            : null;
        const last =
          appointments && appointments.length > 0
            ? getLastLesson(client.id, appointments, ref)
            : null;
        const debt =
          appointments && appointments.length > 0
            ? sumClientDebt(appointments, client.id)
            : 0;
        return (
        <li key={client.id}>
          <article
            className={cn(
              ui.listItem,
              ui.cardHover,
              highlightedClientId === client.id &&
                "ring-2 ring-amber-400/70 ring-offset-2 ring-offset-neutral-50",
            )}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold leading-tight text-neutral-900 dark:text-neutral-100 sm:text-lg">
                    {client.fullName}
                  </h3>
                  <Link
                    href={`/clients/${client.id}`}
                    className="text-xs font-medium text-neutral-700 underline-offset-2 hover:underline dark:text-neutral-300 sm:text-sm"
                  >
                    {heUi.list.profile}
                  </Link>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 sm:text-sm">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    {heUi.forms.phonePrefix}
                  </span>
                  {client.phone.trim() ? (
                    <a
                      href={`tel:${client.phone.replace(/\s/g, "")}`}
                      className="text-neutral-900 underline-offset-2 hover:underline dark:text-neutral-100"
                    >
                      {client.phone}
                    </a>
                  ) : (
                    <span className="text-neutral-500 dark:text-neutral-500">—</span>
                  )}
                </p>
                {appointments && appointments.length > 0 ? (
                  <div className="grid gap-1.5 rounded-xl border border-neutral-100 bg-neutral-50/80 p-3 text-xs dark:border-neutral-700 dark:bg-neutral-800/40 sm:grid-cols-2 sm:text-sm">
                    <p className="text-neutral-800 dark:text-neutral-200">
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {heUi.clientCard.nextLesson}:{" "}
                      </span>
                      {next ? (
                        <span>{formatNextWhen(next.startAt)}</span>
                      ) : (
                        <span className="text-neutral-500">
                          {heUi.clientCard.noUpcoming}
                        </span>
                      )}
                    </p>
                    <p className="text-neutral-800 dark:text-neutral-200">
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {heUi.clientsPage.colLastVisit}:{" "}
                      </span>
                      {last ? (
                        <span>{formatShortDate(last.startAt)}</span>
                      ) : (
                        <span className="text-neutral-500">—</span>
                      )}
                    </p>
                    <p
                      className={cn(
                        "sm:col-span-2",
                        debt > 0
                          ? "font-semibold text-amber-900 dark:text-amber-200"
                          : "text-neutral-700 dark:text-neutral-300",
                      )}
                    >
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {heUi.clientsPage.colDebt}:{" "}
                      </span>
                      <span className="tabular-nums">{formatIls(debt)}</span>
                    </p>
                  </div>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2 sm:shrink-0 sm:flex-col">
                {onEdit ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onEdit(client.id)}
                    aria-label={`${heUi.list.edit}: ${client.fullName}`}
                  >
                    {heUi.list.edit}
                  </Button>
                ) : null}
                {onAddLessonForClient ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onAddLessonForClient(client.id)}
                    aria-label={`${heUi.list.addLessonForClient} — ${client.fullName}`}
                  >
                    {heUi.list.addLessonForClient}
                  </Button>
                ) : null}
                {onRequestDelete ? (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => onRequestDelete(client.id)}
                    aria-label={`${heUi.list.delete}: ${client.fullName}`}
                  >
                    {heUi.list.delete}
                  </Button>
                ) : null}
              </div>
            </div>

            {preset.clientFields.length > 0 ? (
              <dl className="mt-3 grid gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-700 sm:mt-4 sm:grid-cols-2 sm:gap-x-6 sm:pt-4">
                {preset.clientFields.map((def) => {
                  const raw = client.customFields[def.key];
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
