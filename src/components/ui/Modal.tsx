"use client";

import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
} from "react";

import { heUi } from "@/config";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** `lg` — טפסים רחבים יחסית */
  size?: "md" | "lg";
  className?: string;
}

function getFocusable(panel: HTMLElement): HTMLElement[] {
  return Array.from(
    panel.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute("disabled"));
}

const sizeClass = {
  md: "max-w-md",
  lg: "max-w-[min(100%,28rem)] sm:max-w-xl",
} as const;

function focusFirstContentField(panel: HTMLElement | null): void {
  if (!panel) return;
  const content = panel.querySelector<HTMLElement>("[data-modal-body]");
  const root = content ?? panel;
  const first = root.querySelector<HTMLElement>(
    'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])',
  );
  first?.focus({ preventScroll: true });
}

export function Modal({
  open,
  title,
  onClose,
  children,
  size = "lg",
  className,
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => {
      focusFirstContentField(panelRef.current);
      const panel = panelRef.current;
      const active = document.activeElement;
      if (!panel?.contains(active)) {
        panel
          ?.querySelector<HTMLButtonElement>("[data-modal-close]")
          ?.focus({ preventScroll: true });
      }
    }, 0);

    return () => {
      window.clearTimeout(t);
      previousFocusRef.current?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onWindowKeyDown(ev: globalThis.KeyboardEvent): void {
      if (ev.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onWindowKeyDown);
    return () => window.removeEventListener("keydown", onWindowKeyDown);
  }, [open, onClose]);

  const handlePanelKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = getFocusable(panelRef.current);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-5"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 border-0 bg-neutral-900/45 backdrop-blur-[3px] transition-opacity"
        aria-label={heUi.dialog.backdropClose}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handlePanelKeyDown}
        className={cn(
          "relative z-10 flex max-h-[92dvh] w-full flex-col rounded-t-2xl rounded-b-none border border-neutral-200/80 bg-white shadow-2xl ring-1 ring-neutral-950/[0.04] sm:max-h-[min(90dvh,52rem)] sm:rounded-2xl",
          sizeClass[size],
          className,
        )}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200/80 bg-gradient-to-b from-white to-neutral-50/90 px-4 py-3.5 sm:px-5 sm:py-4">
          <h2
            id={titleId}
            className="min-w-0 flex-1 text-base font-semibold leading-snug text-neutral-900 sm:text-lg"
          >
            {title}
          </h2>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="shrink-0 px-3"
            onClick={onClose}
            data-modal-close
            aria-label={heUi.clientsPage.closeAddPanel}
          >
            {heUi.clientsPage.closeAddPanel}
          </Button>
        </header>
        <div
          data-modal-body
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
