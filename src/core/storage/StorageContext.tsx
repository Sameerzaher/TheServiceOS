"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import type { ServiceStorage } from "@/core/types/serviceStorage";

import { businessDataStubStorage } from "./businessDataStubStorage";

const StorageContext = createContext<ServiceStorage | null>(null);

export function StorageProvider({
  children,
  storage: storageProp,
}: {
  children: ReactNode;
  /** Inject mock or alternate adapter in tests. */
  storage?: ServiceStorage;
}) {
  const [asyncStorage, setAsyncStorage] = useState<ServiceStorage | null>(null);

  useEffect(() => {
    if (storageProp !== undefined) return;

    let cancelled = false;
    void import("./createServiceStorage").then(({ createServiceStorage }) => {
      if (!cancelled) setAsyncStorage(createServiceStorage());
    });
    return () => {
      cancelled = true;
    };
  }, [storageProp]);

  const storage: ServiceStorage =
    storageProp !== undefined
      ? storageProp
      : asyncStorage ?? businessDataStubStorage;

  return (
    <StorageContext.Provider value={storage}>{children}</StorageContext.Provider>
  );
}

export function useServiceStorage(): ServiceStorage {
  const ctx = useContext(StorageContext);
  if (!ctx) {
    throw new Error("useServiceStorage must be used within StorageProvider");
  }
  return ctx;
}
