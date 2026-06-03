"use client";

import type { ReactNode } from "react";

import { ToastProvider } from "@/components/ui/Toast";
import { StorageProvider, StorageBootstrapNotifier } from "@/core/storage";
import { ThemeProvider } from "@/features/theme/ThemeProvider";
import { LocaleProvider } from "@/features/locale/LocaleProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <ThemeProvider>
        <ToastProvider>
          <StorageProvider>
            <StorageBootstrapNotifier />
            {children}
          </StorageProvider>
        </ToastProvider>
      </ThemeProvider>
    </LocaleProvider>
  );
}
