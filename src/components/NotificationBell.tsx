"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { mergeTeacherScopeHeaders } from "@/lib/api/teacherScopeHeaders";
import { useDashboardTeacherId } from "@/features/app/DashboardTeacherContext";

type Notification = {
  id: string;
  type: string;
  title: string;
  message?: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
};

export function NotificationBell({
  triggerClassName,
}: {
  triggerClassName?: string;
} = {}) {
  const router = useRouter();
  const teacherId = useDashboardTeacherId();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previousUnreadCount, setPreviousUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [teacherId]);

  // Play sound when new notification arrives
  useEffect(() => {
    if (unreadCount > previousUnreadCount && previousUnreadCount > 0) {
      playNotificationSound();
      showBrowserNotification();
    }
    setPreviousUnreadCount(unreadCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadCount]);

  async function loadNotifications() {
    try {
      const res = await fetch("/api/notifications", {
        headers: mergeTeacherScopeHeaders(teacherId),
      });
      if (!res.ok) return;
      
      const data = await res.json();
      if (data.ok && data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.notifications.filter((n: Notification) => !n.isRead).length);
      }
    } catch (e) {
      console.error("[NotificationBell] Load error:", e);
    }
  }

  function playNotificationSound() {
    try {
      const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGe77OedTRANUKfj8LZjHAU7k9nzxnYpBSd+zPLaizsKGGS56+mjUxILTKXh8bllHgU+l9vzwnQnBSh8yvHaizYJGWW46+mjUhIKS6Xh8bllHgU+ltvzw3QnBSh8yvHaizYJGWS46+mjUhIKTKXh8bllHgU+l9vzwnQnBSh8yvHaizYJGWS46+mjUhIKTKXh8bllHgU+l9vzwnQnBSh8yvHaizYJGWS46+mjUhIKTKXh8bllHgU+l9vzwnQnBSh8yvHaizYJGWS46+mjUhIKTKXh8bllHgU+l9vzwnQnBSh8yvHaizYJGWS46+mjUhIKTKXh8bllHgU+l9vzwnQnBSh8yvHaizYJGWS46+mjUhIKTKXh8bllHgU+l9vzwnQnBSh8yvHaizYJGWS46+mjUhIKTKXh8bllHgU+l9vzwnQnBSh8yvHaizYJGWS46+mjUhIKTKXh8bllHgU+l9vzwnQnBSh8yvHaizYJGWS46+mjUhIKTKXh8bllHgU+l9vzwnQnBSh8yvHaizYJGWS46+mjUhIKTKXh8bllHgU+l9vzwnQnBSh8yvHaizYJGWS46+mjUhIKTKXh8bllHgU+l9vzwnQnBSh8yvHaizYJGWS46+mjUhIKTKXh8bllHgU+l9vzwnQnBSh8yvHaizYJGWS46+mjUhIKTKXh8bllHgU+l9vzwnQnBSh8yvHaizYJGWS46+mjUhIKTKXh8bllHgU+l9vzwnQnBSh8yvHaizYJGWS46+mjUhIKTKXh8bllHgU+l9vzwnQnBSh8yvHaizYJGWS46+mjUhIKTKXh8bllHgU+l9vzwnQnBSh8yvHaizYJGWS46+mjUhIKTKXh8bllHgU+l9vzwnQnBSh8yvHaizYJGWS46+mjUhIKTKXh8bllHgU+l9vzwnQnBSh8yvHaizYJGWS46+mjUhIKTKXh8bllHgU+l9vzwnQnBSh8yvHaizYJGWS46+mjUhIKTKXh8bllHgU+l9vzwnQnBSh8yvHaizYJGWS46+mjUhIKTKXh8bllHgU+l9vzwnQnBSh8yvHaizYJGWS46+mjUhIKTKXh8bllHgU+l9vzwnQnBSh8yvHaizYJGWS46+mjUg==");
      audio.play().catch((e) => console.log("[NotificationBell] Sound play failed:", e));
    } catch (e) {
      console.log("[NotificationBell] Sound error:", e);
    }
  }

  function showBrowserNotification() {
    if (!("Notification" in window)) return;
    
    if (Notification.permission === "granted") {
      const latestUnread = notifications.find(n => !n.isRead);
      if (latestUnread) {
        new Notification(latestUnread.title, {
          body: latestUnread.message,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
        });
      }
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          showBrowserNotification();
        }
      });
    }
  }

  async function markAsRead(notificationIds: string[]) {
    try {
      setIsLoading(true);
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: mergeTeacherScopeHeaders(teacherId, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ notificationIds }),
      });
      
      if (res.ok) {
        await loadNotifications();
      }
    } catch (e) {
      console.error("[NotificationBell] Mark as read error:", e);
    } finally {
      setIsLoading(false);
    }
  }

  async function markAllAsRead() {
    try {
      setIsLoading(true);
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: mergeTeacherScopeHeaders(teacherId, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ notificationIds: [] }),
      });
      
      if (res.ok) {
        await loadNotifications();
        setIsOpen(false);
      }
    } catch (e) {
      console.error("[NotificationBell] Mark all as read error:", e);
    } finally {
      setIsLoading(false);
    }
  }

  function handleNotificationClick(notification: Notification) {
    if (!notification.isRead) {
      markAsRead([notification.id]);
    }
    
    setIsOpen(false);
    
    if (notification.entityType === "appointment" && notification.entityId) {
      router.push("/booking");
    }
  }

  return (
    <div className="relative flex items-center justify-center">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-base transition-colors",
          unreadCount > 0
            ? "text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
            : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800",
          triggerClassName,
        )}
        title={unreadCount > 0 ? `${unreadCount} הודעות חדשות` : "הודעות"}
      >
        <span className="text-lg leading-none">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white ring-2 ring-white dark:ring-neutral-900">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute end-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-neutral-950/60">
            <div className="flex items-center justify-between border-b border-neutral-200 p-3 dark:border-neutral-700">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                הודעות
              </h3>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  disabled={isLoading}
                  className="text-xs text-emerald-600 hover:text-emerald-700 disabled:opacity-50 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  סמן הכל כנקרא
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                  אין הודעות חדשות
                </div>
              ) : (
                notifications.map((notif) => (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => handleNotificationClick(notif)}
                    className={cn(
                      "w-full border-b border-neutral-100 p-3 text-right transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/80",
                      !notif.isRead &&
                        "bg-emerald-50/50 dark:bg-emerald-950/35",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">
                        {notif.type === "new_booking" ? "📅" : "ℹ️"}
                      </span>
                      <div className="flex-1">
                        <p
                          className={cn(
                            "text-sm",
                            !notif.isRead
                              ? "font-semibold text-neutral-900 dark:text-neutral-100"
                              : "text-neutral-700 dark:text-neutral-300",
                          )}
                        >
                          {notif.title}
                        </p>
                        {notif.message && (
                          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                            {notif.message}
                          </p>
                        )}
                        <p className="mt-1 text-[10px] text-neutral-400 dark:text-neutral-500">
                          {new Date(notif.createdAt).toLocaleString("he-IL", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
