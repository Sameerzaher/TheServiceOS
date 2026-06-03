"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/lib/cn";

export type ToastVariant = "success" | "error" | "info";

type ToastItem = { id: string; message: string; variant: ToastVariant };

const ToastContext = createContext<{
  show: (message: string, variant?: ToastVariant) => void;
} | null>(null);

export function useToast(): (message: string, variant?: ToastVariant) => void {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx.show;
}

function makeId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [items, setItems] = useState<ToastItem[]>([]);

  const skipMobileBottomNavOffset =
    pathname === "/book" ||
    pathname?.startsWith("/book/") ||
    pathname === "/offline" ||
    pathname?.startsWith("/offline");

  const show = useCallback((message: string, variant: ToastVariant = "success") => {
    const id = makeId();
    setItems((prev) => [...prev, { id, message, variant }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-5",
          skipMobileBottomNavOffset
            ? "pb-4 sm:pb-5"
            : "pb-[calc(3.75rem+env(safe-area-inset-bottom,0px)+0.5rem)] sm:pb-5",
        )}
        aria-live="polite"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto w-full max-w-md rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg shadow-black/10 sm:text-base dark:shadow-black/40",
              t.variant === "success" &&
                "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800/80 dark:bg-emerald-950/80 dark:text-emerald-100",
              t.variant === "error" &&
                "border-red-200 bg-red-50 text-red-950 dark:border-red-900/70 dark:bg-red-950/70 dark:text-red-100",
              t.variant === "info" &&
                "border-neutral-200 bg-white text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100",
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
