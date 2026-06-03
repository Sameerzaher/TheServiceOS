"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import type { AuthTeacher, Teacher } from "@/core/types/teacher";

interface AuthContextValue {
  teacher: Teacher | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshTeacher: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = teacher !== null;
  const isAdmin = teacher?.role === "admin";

  async function refreshTeacher() {
    console.log("[AuthContext] Refreshing teacher auth state");
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();

      if (res.ok && data.ok && data.data) {
        console.log("[AuthContext] Teacher authenticated:", { id: data.data.teacher.id, email: data.data.teacher.email });
        setTeacher(data.data.teacher);
      } else {
        console.log("[AuthContext] Not authenticated:", data.error);
        setTeacher(null);
      }
    } catch (e) {
      console.error("[AuthContext] Refresh error:", e);
      setTeacher(null);
    }
  }

  async function login(email: string, password: string) {
    console.log("[AuthContext] Login attempt:", email);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = (await res.json()) as {
      ok?: boolean;
      error?: string;
      _debug?: string;
      data?: AuthTeacher;
    };

    if (!res.ok || !data.ok) {
      console.error("[AuthContext] Login failed:", {
        httpStatus: res.status,
        message: data.error,
        _debug: data._debug ?? "(not set — use npm run dev, or set AUTH_LOGIN_DEBUG=1 on the server)",
        raw: data,
      });
      throw new Error(data.error || "Login failed");
    }

    const authTeacher = data.data as AuthTeacher;
    console.log("[AuthContext] Login successful, redirecting to dashboard");
    setTeacher(authTeacher.teacher);

    router.push("/dashboard");
  }

  async function logout() {
    console.log("[AuthContext] Logging out");
    await fetch("/api/auth/logout", { method: "POST" });
    setTeacher(null);
    router.push("/login");
  }

  useEffect(() => {
    void (async () => {
      await refreshTeacher();
      setIsLoading(false);
    })();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        teacher,
        isLoading,
        isAuthenticated,
        isAdmin,
        login,
        logout,
        refreshTeacher,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

export function useRequireAuth(redirectTo = "/login"): AuthContextValue {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      router.push(redirectTo);
    }
  }, [auth.isLoading, auth.isAuthenticated, redirectTo, router]);

  return auth;
}

export function useRequireAdmin(redirectTo = "/dashboard"): AuthContextValue {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoading && (!auth.isAuthenticated || !auth.isAdmin)) {
      router.push(redirectTo);
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.isAdmin, redirectTo, router]);

  return auth;
}
