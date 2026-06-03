"use client";

import {
  createContext,
  type ReactNode,
  useContext,
} from "react";

import { useServiceAppState } from "@/features/app/useServiceAppState";

type ServiceAppContextValue = ReturnType<typeof useServiceAppState>;

const ServiceAppContext = createContext<ServiceAppContextValue | null>(null);

export function ServiceAppProvider({ children }: { children: ReactNode }) {
  const value = useServiceAppState();
  return (
    <ServiceAppContext.Provider value={value}>
      {children}
    </ServiceAppContext.Provider>
  );
}

export function useServiceApp(): ServiceAppContextValue {
  const ctx = useContext(ServiceAppContext);
  if (!ctx) {
    throw new Error("useServiceApp must be used within ServiceAppProvider");
  }
  return ctx;
}
