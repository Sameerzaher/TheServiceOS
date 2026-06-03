"use client";

import { useEffect, useMemo, useState } from "react";

import {
  appPageTitle,
  heUi,
  resolveVerticalPresetMerged,
} from "@/config";
import { useToast } from "@/components/ui";
import { DEMO_SETTINGS, buildDemoDataset } from "@/core/demo/demoSeed";
import { isDemoModeActive, setDemoModeActive } from "@/core/demo/demoMode";
import {
  loadFirstRunOnboardingState,
  saveFirstRunOnboardingState,
} from "@/core/onboarding/firstRun";
import { AppointmentStatus, PaymentStatus } from "@/core/types/appointment";
import { isPaidStatus } from "@/core/utils/insights";
import {
  filterAppointments,
  matchesClientSearch,
  sortAppointments,
  type AppointmentSort,
  type PaymentFilter,
} from "@/core/utils/appointmentFilters";
import type { AppointmentDateFilter } from "@/core/utils/dateRange";
import type { AppointmentRecord } from "@/core/types/appointment";
import { buildWhatsAppHref } from "@/core/utils/whatsapp";
import {
  useDashboardTeacherId,
  useDashboardTeacherOptional,
} from "@/features/app/DashboardTeacherContext";
import { useAppointments } from "@/features/appointments/hooks/useAppointments";
import { useAvailabilitySettings } from "@/features/booking/hooks/useAvailabilitySettings";
import { useClients } from "@/features/clients/hooks/useClients";
import type { NewClientInput } from "@/features/clients/hooks/useClients";
import { useSettings } from "@/features/settings/hooks/useSettings";
import { mergeTeacherScopeHeaders } from "@/lib/api/teacherScopeHeaders";

function togglePaymentStatus(current: PaymentStatus): PaymentStatus {
  return isPaidStatus(current) ? PaymentStatus.Unpaid : PaymentStatus.Paid;
}

/** Unpaid → partial → paid → unpaid (quick owner actions on list). */
function cyclePaymentStatusQuick(current: PaymentStatus): PaymentStatus {
  switch (current) {
    case PaymentStatus.Unpaid:
      return PaymentStatus.Partial;
    case PaymentStatus.Partial:
    case PaymentStatus.Pending:
      return PaymentStatus.Paid;
    case PaymentStatus.Paid:
    case PaymentStatus.Waived:
    case PaymentStatus.Refunded:
      return PaymentStatus.Unpaid;
    default:
      return PaymentStatus.Unpaid;
  }
}

function isPendingPublicApproval(customFields: Record<string, unknown>): boolean {
  return (
    customFields.bookingSource === "public" &&
    customFields.bookingApproval === "pending"
  );
}

function formatAppointmentDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("he-IL", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function useServiceAppState() {
  const toast = useToast();
  const dashboardTeacherId = useDashboardTeacherId();
  const dashboardTeacherCtx = useDashboardTeacherOptional();
  const {
    settings,
    isReady: settingsReady,
    replaceSettings,
    loadError: settingsLoadError,
    syncError: settingsSyncError,
    retryLoad: retrySettingsLoad,
    retrySync: retrySettingsSync,
  } = useSettings();
  const teacherBusinessType = useMemo(() => {
    const row = dashboardTeacherCtx?.teachers.find(
      (t) => t.id === dashboardTeacherId,
    );
    return row?.businessType ?? null;
  }, [dashboardTeacherCtx?.teachers, dashboardTeacherId]);
  const preset = useMemo(
    () => resolveVerticalPresetMerged(settings, teacherBusinessType),
    [settings, teacherBusinessType],
  );
  const {
    settings: availabilitySettings,
    isReady: availabilityReady,
    updateSettings: updateAvailabilitySettings,
    resetSettings: resetAvailabilitySettings,
    loadError: availabilityLoadError,
    syncError: availabilitySyncError,
    retryLoad: retryAvailabilityLoad,
    retrySync: retryAvailabilitySync,
  } = useAvailabilitySettings();
  const {
    sortedClients,
    addClient,
    updateClient,
    deleteClient,
    replaceClients,
    isReady: clientsReady,
    loadError: clientsLoadError,
    syncError: clientsSyncError,
    retryLoad: retryClientsLoad,
    retrySync: retryClientsSync,
  } = useClients();
  const {
    sortedAppointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    deleteAppointmentsForClient,
    replaceAppointments,
    reloadAppointments,
    isReady: appointmentsReady,
    loadError: appointmentsLoadError,
    syncError: appointmentsSyncError,
    retryLoad: retryAppointmentsLoad,
    retrySync: retryAppointmentsSync,
  } = useAppointments();

  const [clientSearch, setClientSearch] = useState("");
  const [dateFilter, setDateFilter] =
    useState<AppointmentDateFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [appointmentSort, setAppointmentSort] =
    useState<AppointmentSort>("date");
  const [clientFilter, setClientFilter] = useState("");
  const [customDateRange, setCustomDateRange] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [editingAppointmentId, setEditingAppointmentId] = useState<
    string | null
  >(null);
  const [appointmentPrefillClientId, setAppointmentPrefillClientId] =
    useState<string | null>(null);
  const [confirm, setConfirm] = useState<
    null | { kind: "client" | "appointment"; id: string }
  >(null);
  const [demoResetOpen, setDemoResetOpen] = useState(false);
  const [demoLoadOpen, setDemoLoadOpen] = useState(false);
  const [demoActive, setDemoActive] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [remindersReviewed, setRemindersReviewed] = useState(false);

  const referenceDate = useMemo(() => new Date(), []);

  // Clear all UI state when teacher changes
  useEffect(() => {
    setEditingClientId(null);
    setEditingAppointmentId(null);
    setAppointmentPrefillClientId(null);
    setConfirm(null);
    setClientSearch("");
    setClientFilter("");
    setCustomDateRange(null);
  }, [dashboardTeacherId]);

  const filteredClients = useMemo(
    () => sortedClients.filter((c) => matchesClientSearch(c, clientSearch)),
    [sortedClients, clientSearch],
  );

  const clientMap = useMemo(
    () => new Map(sortedClients.map((c) => [c.id, c])),
    [sortedClients],
  );

  const filteredAppointments = useMemo(() => {
    let base = filterAppointments(sortedAppointments, {
      dateFilter: dateFilter === "custom" ? "all" : dateFilter,
      paymentFilter,
    });

    // Custom date range filter
    if (dateFilter === "custom" && customDateRange) {
      const startDate = new Date(customDateRange.start);
      const endDate = new Date(customDateRange.end);
      endDate.setHours(23, 59, 59, 999);
      base = base.filter((appt) => {
        const apptDate = new Date(appt.startAt);
        return apptDate >= startDate && apptDate <= endDate;
      });
    }

    // Client filter
    if (clientFilter) {
      base = base.filter((appt) => appt.clientId === clientFilter);
    }

    return sortAppointments(base, appointmentSort, clientMap);
  }, [
    sortedAppointments,
    dateFilter,
    customDateRange,
    paymentFilter,
    clientFilter,
    appointmentSort,
    clientMap,
  ]);

  const editingClient = editingClientId
    ? sortedClients.find((c) => c.id === editingClientId) ?? null
    : null;

  const editingAppointment = editingAppointmentId
    ? sortedAppointments.find((a) => a.id === editingAppointmentId) ?? null
    : null;

  const dataReady =
    clientsReady &&
    appointmentsReady &&
    settingsReady &&
    availabilityReady;
  const hasDataLoadFailure =
    clientsLoadError != null ||
    appointmentsLoadError != null ||
    settingsLoadError != null ||
    availabilityLoadError != null;
  const isStorageEmpty =
    dataReady &&
    !hasDataLoadFailure &&
    sortedClients.length === 0 &&
    sortedAppointments.length === 0;
  const hasAnyData =
    sortedClients.length > 0 || sortedAppointments.length > 0;

  const displayTitle =
    settings.businessName.trim() || appPageTitle(preset);

  useEffect(() => {
    setDemoActive(isDemoModeActive());
    const onboarding = loadFirstRunOnboardingState();
    setOnboardingDismissed(onboarding.dismissed);
    setRemindersReviewed(onboarding.remindersReviewed);
  }, []);

  const onboardingCompleted =
    sortedClients.length > 0 &&
    sortedAppointments.length > 0 &&
    remindersReviewed;
  const needsFirstClient = sortedClients.length === 0;
  const needsFirstAppointment = sortedAppointments.length === 0;

  useEffect(() => {
    if (!dataReady) return;
    if (!onboardingDismissed && onboardingCompleted) {
      const next = { dismissed: true, remindersReviewed: true };
      saveFirstRunOnboardingState(next);
      setOnboardingDismissed(true);
    }
  }, [dataReady, onboardingDismissed, onboardingCompleted]);

  useEffect(() => {
    if (!dataReady) return;
    if (!hasAnyData && demoActive) {
      setDemoModeActive(false);
      setDemoActive(false);
    }
  }, [dataReady, hasAnyData, demoActive]);

  function handleConfirmDelete(): void {
    if (!confirm) return;
    if (confirm.kind === "client") {
      const deletedClientId = confirm.id;
      deleteAppointmentsForClient(confirm.id);
      deleteClient(confirm.id);
      if (editingClientId === confirm.id) setEditingClientId(null);
      if (
        editingAppointmentId &&
        sortedAppointments.some(
          (a) =>
            a.id === editingAppointmentId && a.clientId === deletedClientId,
        )
      ) {
        setEditingAppointmentId(null);
      }
      if (appointmentPrefillClientId === deletedClientId) {
        setAppointmentPrefillClientId(null);
      }
      toast(heUi.toast.clientDeleted);
    } else {
      deleteAppointment(confirm.id);
      if (editingAppointmentId === confirm.id) {
        setEditingAppointmentId(null);
      }
      toast(heUi.toast.lessonDeleted);
    }
    setConfirm(null);
  }

  function handleToggleAppointmentPaid(id: string): void {
    const row = sortedAppointments.find((a) => a.id === id);
    if (!row) return;
    updateAppointment(id, {
      paymentStatus: togglePaymentStatus(row.paymentStatus),
    });
    toast(heUi.toast.paymentToggled);
  }

  function handleCycleAppointmentPayment(id: string): void {
    const row = sortedAppointments.find((a) => a.id === id);
    if (!row) return;
    updateAppointment(id, {
      paymentStatus: cyclePaymentStatusQuick(row.paymentStatus),
    });
    toast(heUi.toast.paymentCycled);
  }

  async function handleApprovePublicBooking(id: string): Promise<void> {
    const row = sortedAppointments.find((a) => a.id === id);
    if (!row) return;
    if (!isPendingPublicApproval(row.customFields)) return;
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: mergeTeacherScopeHeaders(dashboardTeacherId, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ status: "confirmed" }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || data.ok !== true) {
        const msg =
          typeof data.error === "string" && data.error.length > 0
            ? data.error
            : heUi.toast.actionFailed;
        toast(msg, "error");
        return;
      }
      await reloadAppointments();
      toast(heUi.toast.bookingApproved);
    } catch {
      toast(heUi.toast.actionFailed, "error");
    }
  }

  async function handleApproveAndSendPublicBookingWhatsapp(
    id: string,
  ): Promise<void> {
    const row = sortedAppointments.find((a) => a.id === id);
    if (!row) return;
    if (!isPendingPublicApproval(row.customFields)) return;
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: mergeTeacherScopeHeaders(dashboardTeacherId, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ status: "confirmed" }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || data.ok !== true) {
        const msg =
          typeof data.error === "string" && data.error.length > 0
            ? data.error
            : heUi.toast.actionFailed;
        toast(msg, "error");
        return;
      }
      await reloadAppointments();
      openApprovalWhatsapp(row);
      toast(heUi.toast.bookingApproved);
    } catch {
      toast(heUi.toast.actionFailed, "error");
    }
  }

  function handleRejectPublicBooking(id: string): void {
    const row = sortedAppointments.find((a) => a.id === id);
    if (!row) return;
    if (!isPendingPublicApproval(row.customFields)) return;
    updateAppointment(id, {
      status: AppointmentStatus.Cancelled,
      customFields: {
        ...row.customFields,
        bookingApproval: "rejected",
        bookingRequestStatus: "cancelled",
      },
    });
    toast(heUi.toast.bookingRejected);
  }

  function handleChangeAppointmentStatus(
    id: string,
    newStatus: AppointmentStatus,
  ): void {
    const row = sortedAppointments.find((a) => a.id === id);
    if (!row) return;
    updateAppointment(id, { status: newStatus });
    toast(heUi.toast.lessonUpdated);
  }

  function handleClientSubmit(data: NewClientInput): boolean {
    if (editingClientId) {
      updateClient(editingClientId, data);
      setEditingClientId(null);
      toast(heUi.toast.clientUpdated);
      return true;
    }
    const row = addClient(data);
    if (!row) {
      toast(heUi.toast.actionFailed, "error");
      return false;
    }
    toast(heUi.toast.clientCreated);
    return true;
  }

  function loadDemo(): void {
    const { clients, appointments } = buildDemoDataset();
    replaceClients(clients);
    replaceAppointments(appointments);
    replaceSettings(DEMO_SETTINGS);
    setEditingClientId(null);
    setEditingAppointmentId(null);
    setAppointmentPrefillClientId(null);
    setDemoModeActive(true);
    setDemoActive(true);
    toast(heUi.toast.demoLoaded);
  }

  function resetData(): void {
    replaceClients([]);
    replaceAppointments([]);
    setEditingClientId(null);
    setEditingAppointmentId(null);
    setAppointmentPrefillClientId(null);
    setDemoModeActive(false);
    setDemoActive(false);
    toast(heUi.toast.demoReset);
  }

  function handleRequestLoadDemo(): void {
    if (!dataReady) return;
    if (hasAnyData) {
      setDemoLoadOpen(true);
      return;
    }
    loadDemo();
  }

  function openApprovalWhatsapp(row: AppointmentRecord): void {
    const client = sortedClients.find((c) => c.id === row.clientId);
    if (!client) return;
    const message = heUi.appointments.approvalWhatsappText({
      name: client.fullName.trim() || "לקוח",
      dateTime: formatAppointmentDateTime(row.startAt),
    });
    const href = buildWhatsAppHref(client.phone, message);
    if (!href || typeof window === "undefined") return;
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return {
    preset,
    settings,
    settingsReady,
    replaceSettings,
    settingsLoadError,
    settingsSyncError,
    retrySettingsLoad,
    retrySettingsSync,
    availabilitySettings,
    updateAvailabilitySettings,
    resetAvailabilitySettings,
    availabilityReady,
    availabilityLoadError,
    availabilitySyncError,
    retryAvailabilityLoad,
    retryAvailabilitySync,
    sortedClients,
    addClient,
    updateClient,
    deleteClient,
    replaceClients,
    clientsReady,
    clientsLoadError,
    clientsSyncError,
    retryClientsLoad,
    retryClientsSync,
    sortedAppointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    deleteAppointmentsForClient,
    replaceAppointments,
    appointmentsReady,
    appointmentsLoadError,
    appointmentsSyncError,
    retryAppointmentsLoad,
    retryAppointmentsSync,
    hasDataLoadFailure,
    clientSearch,
    setClientSearch,
    dateFilter,
    setDateFilter,
    paymentFilter,
    setPaymentFilter,
    appointmentSort,
    setAppointmentSort,
    clientFilter,
    setClientFilter,
    customDateRange,
    setCustomDateRange,
    editingClientId,
    setEditingClientId,
    editingAppointmentId,
    setEditingAppointmentId,
    appointmentPrefillClientId,
    setAppointmentPrefillClientId,
    confirm,
    setConfirm,
    demoResetOpen,
    setDemoResetOpen,
    demoLoadOpen,
    setDemoLoadOpen,
    demoActive,
    setDemoActive,
    onboardingDismissed,
    setOnboardingDismissed,
    remindersReviewed,
    setRemindersReviewed,
    referenceDate,
    filteredClients,
    filteredAppointments,
    editingClient,
    editingAppointment,
    dataReady,
    isStorageEmpty,
    hasAnyData,
    displayTitle,
    onboardingCompleted,
    needsFirstClient,
    needsFirstAppointment,
    handleConfirmDelete,
    handleToggleAppointmentPaid,
    handleCycleAppointmentPayment,
    handleApprovePublicBooking,
    handleApproveAndSendPublicBookingWhatsapp,
    handleRejectPublicBooking,
    handleChangeAppointmentStatus,
    handleClientSubmit,
    loadDemo,
    resetData,
    handleRequestLoadDemo,
    handleConfirmDemoReset: () => {
      resetData();
      setDemoResetOpen(false);
    },
    handleConfirmDemoLoad: () => {
      setDemoLoadOpen(false);
      loadDemo();
    },
  };
}
