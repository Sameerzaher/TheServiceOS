"use client";

import Link from "next/link";

import { appPageTitle, heUi } from "@/config";
import {
  DataLoadErrorBanner,
  EmptyState,
  InlineLoading,
  ui,
} from "@/components/ui";
import { WhatsAppActionButton } from "@/components/whatsapp/WhatsAppActionButton";
import { useServiceApp } from "@/features/app/ServiceAppProvider";
import { formatIls } from "@/core/utils/currency";
import {
  sumPaidTotal,
  sumUnpaidDebt,
  topClientsByDebt,
} from "@/core/utils/insights";
import { whatsappPaymentReminderHref } from "@/core/whatsapp";
import { cn } from "@/lib/cn";

export default function PaymentsPage() {
  const {
    preset,
    settings,
    sortedClients,
    sortedAppointments,
    clientsReady,
    appointmentsReady,
    clientsLoadError,
    clientsSyncError,
    retryClientsLoad,
    retryClientsSync,
    appointmentsLoadError,
    appointmentsSyncError,
    retryAppointmentsLoad,
    retryAppointmentsSync,
  } = useServiceApp();

  const ready = clientsReady && appointmentsReady;
  const totalPaid = sumPaidTotal(sortedAppointments);
  const totalUnpaid = sumUnpaidDebt(sortedAppointments);
  const debtRows = topClientsByDebt(sortedClients, sortedAppointments, 50);

  const displayTitle =
    settings.businessName.trim() || appPageTitle(preset);

  return (
    <main className={ui.pageMain}>
      <header className={ui.header}>
        <h1 className={ui.pageTitle}>{displayTitle}</h1>
        <p className={ui.pageSubtitle}>{heUi.paymentsPage.title}</p>
        <p className="mt-1 max-w-prose text-sm text-neutral-600 dark:text-neutral-400">
          {heUi.paymentsPage.subtitle}
        </p>
      </header>

      <div className={ui.pageStack}>
        {clientsLoadError ? (
          <DataLoadErrorBanner
            title={clientsLoadError}
            description={heUi.data.clientsLoadFailedHint}
            onRetry={retryClientsLoad}
          />
        ) : null}
        {clientsSyncError ? (
          <DataLoadErrorBanner
            title={clientsSyncError}
            description={heUi.data.clientsSyncFailedHint}
            onRetry={retryClientsSync}
          />
        ) : null}
        {appointmentsLoadError ? (
          <DataLoadErrorBanner
            title={appointmentsLoadError}
            description={heUi.data.loadFailedHint}
            onRetry={retryAppointmentsLoad}
          />
        ) : null}
        {appointmentsSyncError ? (
          <DataLoadErrorBanner
            title={appointmentsSyncError}
            description={heUi.data.syncFailedHint}
            onRetry={retryAppointmentsSync}
          />
        ) : null}

        {!ready ? (
          <InlineLoading className="py-10" />
        ) : (
          <>
            <section className={ui.section}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className={cn(ui.statCard, "border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30")}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900 dark:text-emerald-200/90">
                    {heUi.paymentsPage.totalPaid}
                  </p>
                  <p className="mt-2 text-3xl font-bold tabular-nums text-emerald-950 dark:text-emerald-50">
                    {formatIls(totalPaid)}
                  </p>
                </div>
                <div className={cn(ui.statCard, "border-amber-300/80 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40")}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-950 dark:text-amber-200/90">
                    {heUi.paymentsPage.totalUnpaid}
                  </p>
                  <p className="mt-2 text-3xl font-bold tabular-nums text-amber-950 dark:text-amber-50">
                    {formatIls(totalUnpaid)}
                  </p>
                </div>
              </div>
            </section>

            <section className={ui.section}>
              <h2 className={ui.sectionHeading}>{heUi.paymentsPage.debtByClient}</h2>
              {debtRows.length === 0 ? (
                <EmptyState
                  tone="muted"
                  title={heUi.paymentsPage.emptyDebt}
                  description={heUi.paymentsPage.emptyDebtHint}
                />
              ) : (
                <ul className="flex flex-col gap-2">
                  {debtRows.map(({ client, debt }) => {
                    const wa = whatsappPaymentReminderHref(client.phone, {
                      name: client.fullName.trim() || "לקוח",
                      amountDue: formatIls(debt),
                      businessName: settings.businessName.trim(),
                    });
                    return (
                      <li
                        key={client.id}
                        className={cn(
                          ui.card,
                          ui.cardPadding,
                          "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
                        )}
                      >
                        <div className="min-w-0">
                          <Link
                            href={`/clients/${client.id}`}
                            className="font-semibold text-neutral-900 underline-offset-2 hover:underline dark:text-neutral-100"
                          >
                            {client.fullName}
                          </Link>
                          <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
                            {formatIls(debt)}
                          </p>
                        </div>
                        <WhatsAppActionButton
                          href={wa}
                          variant="primary"
                          className="sm:shrink-0"
                          disabledHint={heUi.whatsapp.noPhoneDetail}
                        >
                          {heUi.paymentsPage.reminderCta}
                        </WhatsAppActionButton>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
