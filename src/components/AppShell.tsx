"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { heUi } from "@/config";
import { useDashboardTeacherOptional } from "@/features/app/DashboardTeacherContext";
import { useToast } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useAuth } from "@/features/auth/AuthContext";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LocaleToggle } from "@/components/LocaleToggle";

const NAV_ITEMS: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/dashboard", label: heUi.nav.dashboard },
  { href: "/analytics", label: "📊 דוחות" },
  { href: "/clients", label: heUi.nav.clients },
  { href: "/appointments", label: heUi.nav.lessons },
  { href: "/payments", label: heUi.nav.payments },
  { href: "/reminders", label: "📲 תזכורות" },
  { href: "/booking", label: heUi.nav.booking },
  { href: "/blocked-dates", label: "חופשות" },
  { href: "/teachers", label: heUi.nav.teachers },
  { href: "/settings", label: heUi.nav.settings },
];

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/" || pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function TeacherScopeSelect() {
  const ctx = useDashboardTeacherOptional();
  const toast = useToast();
  
  if (!ctx || !ctx.teachersReady || ctx.teachers.length <= 1) {
    return null;
  }
  
  const getTeacherIcon = (businessType: string) => {
    switch (businessType) {
      case 'driving_instructor':
        return '🚗';
      case 'cosmetic_clinic':
        return '💉';
      default:
        return '👤';
    }
  };
  
  return (
    <div className="flex min-w-0 max-w-full flex-col gap-0.5">
      <label
        htmlFor="dashboard-teacher-scope"
        className="sr-only xl:not-sr-only xl:mb-0 xl:block xl:text-[10px] xl:font-medium xl:text-neutral-500 dark:xl:text-neutral-400"
      >
        {heUi.nav.teacherContext}
      </label>
      <select
        id="dashboard-teacher-scope"
        aria-label={heUi.nav.teacherContext}
        className="max-w-[9.5rem] min-h-9 truncate rounded-xl border border-neutral-200/90 bg-white px-2 py-1.5 text-xs leading-tight text-neutral-900 shadow-sm transition-colors hover:border-neutral-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:border-neutral-500 sm:max-w-[11rem] sm:text-sm lg:max-w-[13rem]"
        dir="ltr"
        value={ctx.teacherId}
        onChange={(e) => {
          const newTeacherId = e.target.value;
          const teacher = ctx.teachers.find(t => t.id === newTeacherId);
          ctx.setTeacherId(newTeacherId);
          
          // Show toast notification
          if (teacher) {
            const icon = getTeacherIcon(teacher.businessType);
            const businessName = teacher.businessName.trim() || teacher.fullName.trim();
            toast(`${icon} עברת ל-${businessName}`);
          }
        }}
      >
        {ctx.teachers.map((t) => {
          const label =
            t.businessName.trim() || t.fullName.trim() || t.slug || t.id;
          const icon = getTeacherIcon(t.businessType);
          return (
            <option key={t.id} value={t.id}>
              {icon} {label}
            </option>
          );
        })}
      </select>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, teacher, isAdmin } = useAuth();
  const toast = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setCanGoBack(window.history.length > 1);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const onPopState = (): void => {
      setCanGoBack(window.history.length > 1);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [isMounted]);

  function handleBack(): void {
    if (!canGoBack) return;
    router.back();
  }

  async function handleLogout(): Promise<void> {
    if (!confirm("האם אתה בטוח שברצונך להתנתק?")) return;
    
    try {
      await logout();
      toast("התנתקת בהצלחה 👋");
      router.push("/login");
    } catch (error) {
      console.error("[AppShell] Logout error:", error);
      toast("שגיאה בהתנתקות");
    }
  }

  const linkBase =
    "inline-flex min-h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors duration-150 sm:rounded-xl sm:px-3 sm:text-sm";
  const linkActive =
    "bg-emerald-600 text-white shadow-sm shadow-emerald-900/15 dark:bg-emerald-500 dark:text-white";
  const linkInactive =
    "text-neutral-600 hover:bg-white/90 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700/50 dark:hover:text-neutral-100";

  const shellIconBtn =
    "size-9 border-0 bg-transparent shadow-none hover:bg-neutral-200/70 dark:hover:bg-neutral-600/40";

  // Filter nav items based on role
  const visibleNavItems = NAV_ITEMS.filter(item => {
    if (item.href === "/teachers") {
      return isAdmin; // Only admins see Teachers link
    }
    return true;
  });

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/90 shadow-sm shadow-neutral-900/[0.04] backdrop-blur-lg dark:border-neutral-700/80 dark:bg-neutral-900/92 dark:shadow-none">
        <nav className="mx-auto max-w-6xl" aria-label="ניווט ראשי">
          <div className="flex min-h-[3.25rem] items-center gap-2 px-3 py-2 sm:min-h-[3.5rem] sm:gap-3 sm:px-4 md:px-5 lg:px-6 lg:py-2.5">
            <Link
              href="/dashboard"
              className="group flex shrink-0 items-center gap-2 rounded-xl py-1.5 pe-1 ps-1 transition hover:bg-neutral-100/90 dark:hover:bg-neutral-800/80"
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-lg shadow-md shadow-emerald-900/20 sm:h-10 sm:w-10 sm:text-xl"
                aria-hidden
              >
                📅
              </span>
              <span className="hidden text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-50 sm:inline sm:text-[1.05rem]">
                {heUi.nav.brand}
              </span>
            </Link>

            <div
              className="mx-auto hidden min-h-11 min-w-0 max-w-full flex-1 items-center justify-center lg:flex"
              role="presentation"
            >
              <div className="inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-2xl border border-neutral-200/90 bg-neutral-100/80 p-1 [scrollbar-width:thin] dark:border-neutral-600/80 dark:bg-neutral-800/70">
                {visibleNavItems.map((item) => {
                  const active = isNavActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        linkBase,
                        active ? linkActive : linkInactive,
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="ms-auto flex min-w-0 max-w-[min(100%,calc(100vw-8rem))] flex-wrap items-center justify-end gap-2 sm:max-w-none">
              <div className="flex items-center divide-x divide-neutral-200/90 rounded-2xl border border-neutral-200/90 bg-neutral-50/95 p-0.5 shadow-sm dark:divide-neutral-600/60 dark:border-neutral-600/70 dark:bg-neutral-800/60 rtl:divide-x-reverse">
                <LocaleToggle className={shellIconBtn} />
                <ThemeToggle className={shellIconBtn} />
                <NotificationBell triggerClassName={shellIconBtn} />
              </div>
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                <TeacherScopeSelect />

                {teacher && (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="hidden min-h-10 shrink-0 items-center gap-1 rounded-xl border border-red-200/90 bg-white px-2.5 py-2 text-xs font-semibold text-red-700 shadow-sm transition hover:border-red-300 hover:bg-red-50 dark:border-red-900/50 dark:bg-neutral-800 dark:text-red-400 dark:hover:bg-red-950/30 lg:inline-flex lg:text-sm"
                    title="התנתק מהמערכת"
                  >
                    <span aria-hidden>🚪</span>
                    <span className="hidden min-[1180px]:inline">התנתק</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleBack}
                  disabled={!isMounted || !canGoBack}
                  className={cn(
                    "hidden min-h-10 items-center gap-1 rounded-xl border border-transparent px-2.5 py-2 text-xs font-medium text-neutral-700 transition hover:border-neutral-200 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:bg-neutral-800 md:inline-flex md:text-sm",
                    !isMounted || !canGoBack
                      ? "pointer-events-none invisible"
                      : "",
                  )}
                >
                  <span aria-hidden className="rtl:rotate-180">
                    ←
                  </span>
                  <span className="hidden lg:inline">{heUi.nav.back}</span>
                </button>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <div className="flex flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom,0px))] sm:pb-0">
        {children}
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200/90 bg-white/95 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.08)] backdrop-blur-md dark:border-neutral-700 dark:bg-neutral-900/95 dark:shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.35)] sm:hidden"
        aria-label="ניווט מהיר"
      >
        <ul
          className={cn(
            "mx-auto grid max-w-full gap-1 px-2 pb-1.5 pt-2",
            isAdmin ? "grid-cols-7" : "grid-cols-6",
          )}
        >
          {visibleNavItems.map((item) => {
            const active = isNavActive(pathname, item.href);
            const shortLabel = item.label.split(" ")[0];
            return (
              <li key={item.href} className="flex min-w-0 justify-center">
                <Link
                  href={item.href}
                  className={cn(
                    "flex min-h-12 w-full min-w-0 flex-col items-center justify-center rounded-xl px-0.5 py-1.5 text-center text-[10px] font-semibold leading-tight transition",
                    active
                      ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/90 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-800/80"
                      : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="max-w-full truncate">{shortLabel}</span>
                </Link>
              </li>
            );
          })}
          <li className="flex min-w-0 justify-center">
            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-[3.25rem] w-full min-w-0 flex-col items-center justify-center rounded-xl px-0.5 py-1.5 text-center text-[10px] font-semibold leading-tight text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              <span aria-hidden>🚪</span>
              <span className="mt-0.5 max-w-full truncate">יציאה</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
