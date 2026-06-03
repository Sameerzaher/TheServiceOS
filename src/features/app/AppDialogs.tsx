"use client";

import { ConfirmDialog } from "@/components/ui";
import { heUi } from "@/config";
import { useServiceApp } from "@/features/app/ServiceAppProvider";

export function AppDialogs() {
  const {
    confirm,
    setConfirm,
    demoResetOpen,
    setDemoResetOpen,
    demoLoadOpen,
    setDemoLoadOpen,
    handleConfirmDelete,
    handleConfirmDemoReset,
    handleConfirmDemoLoad,
  } = useServiceApp();

  return (
    <>
      <ConfirmDialog
        open={confirm !== null}
        title={
          confirm?.kind === "client"
            ? heUi.dialog.deleteClientTitle
            : heUi.dialog.deleteAppointmentTitle
        }
        message={
          confirm?.kind === "client"
            ? heUi.dialog.deleteClientMessage
            : heUi.dialog.deleteAppointmentMessage
        }
        confirmLabel={
          confirm?.kind === "client"
            ? heUi.dialog.confirmDeleteClient
            : heUi.dialog.confirmDeleteAppointment
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirm(null)}
      />

      <ConfirmDialog
        open={demoResetOpen}
        title={heUi.dialog.resetDemoTitle}
        message={heUi.dialog.resetDemoMessage}
        confirmLabel={heUi.dialog.confirmResetDemo}
        confirmVariant="danger"
        onConfirm={handleConfirmDemoReset}
        onCancel={() => setDemoResetOpen(false)}
      />

      <ConfirmDialog
        open={demoLoadOpen}
        title={heUi.dialog.loadDemoTitle}
        message={heUi.dialog.loadDemoMessage}
        confirmLabel={heUi.demo.load}
        confirmVariant="primary"
        onConfirm={handleConfirmDemoLoad}
        onCancel={() => setDemoLoadOpen(false)}
      />
    </>
  );
}
