"use client";

import { useEffect, useState } from "react";
import { useDashboardTeacherId } from "@/features/app/DashboardTeacherContext";
import { mergeTeacherScopeHeaders } from "@/lib/api/teacherScopeHeaders";
import { Button, ui, useToast } from "@/components/ui";
import { InlineLoading } from "@/components/ui";
import { cn } from "@/lib/cn";

interface BlockedDate {
  id: string;
  date: string;
  reason: string;
  isRecurring: boolean;
}

export default function BlockedDatesPage() {
  const teacherId = useDashboardTeacherId();
  const toast = useToast();
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");
  const [newIsRecurring, setNewIsRecurring] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadBlockedDates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/blocked-dates", {
        headers: mergeTeacherScopeHeaders(teacherId),
      });

      if (!res.ok) {
        toast("שגיאה בטעינת תאריכים חסומים", "error");
        return;
      }

      const data = await res.json();
      if (data.ok && data.blockedDates) {
        setBlockedDates(data.blockedDates);
      }
    } catch (e) {
      console.error("[BlockedDatesPage] Load error:", e);
      toast("שגיאה בטעינת נתונים", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlockedDates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId]);

  async function handleAddBlock(e: React.FormEvent) {
    e.preventDefault();
    if (!newDate) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/blocked-dates", {
        method: "POST",
        headers: mergeTeacherScopeHeaders(teacherId, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          date: newDate,
          reason: newReason,
          isRecurring: newIsRecurring,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast(data.error || "שגיאה בהוספת חסימה", "error");
        return;
      }

      setBlockedDates([...blockedDates, data.blockedDate]);
      setNewDate("");
      setNewReason("");
      setNewIsRecurring(false);
      toast("תאריך נחסם בהצלחה");
    } catch (e) {
      console.error("[BlockedDatesPage] Add error:", e);
      toast("שגיאה בהוספת חסימה", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("האם למחוק חסימה זו?")) return;

    try {
      const res = await fetch(`/api/blocked-dates/${id}`, {
        method: "DELETE",
        headers: mergeTeacherScopeHeaders(teacherId),
      });

      if (!res.ok) {
        toast("שגיאה במחיקת חסימה", "error");
        return;
      }

      setBlockedDates(blockedDates.filter((b) => b.id !== id));
      toast("חסימה נמחקה");
    } catch (e) {
      console.error("[BlockedDatesPage] Delete error:", e);
      toast("שגיאה במחיקה", "error");
    }
  }

  return (
    <main className={ui.pageMain}>
      <header className={ui.header}>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-2xl">ניהול חופשות וחסימות</h1>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 sm:text-sm">חסום תאריכים שבהם אינך זמין</p>
      </header>

      <div className={ui.pageStack}>
        <section className={ui.section}>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 sm:text-lg">הוסף חסימה חדשה</h2>
          <form
            onSubmit={handleAddBlock}
            className={`${ui.card} ${ui.cardPadding} space-y-3 sm:space-y-4`}
          >
            <div>
              <label htmlFor="new-blocked-date" className={cn(ui.label, "text-xs sm:text-sm")}>
                תאריך
              </label>
              <input
                id="new-blocked-date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
                disabled={submitting}
                className={cn(ui.input, "text-xs sm:text-sm")}
              />
            </div>

            <div>
              <label htmlFor="new-blocked-reason" className={cn(ui.label, "text-xs sm:text-sm")}>
                סיבה (אופציונלי)
              </label>
              <input
                id="new-blocked-reason"
                type="text"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="חופש, חג, אירוע..."
                disabled={submitting}
                className={cn(ui.input, "text-xs sm:text-sm")}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="new-is-recurring"
                type="checkbox"
                checked={newIsRecurring}
                onChange={(e) => setNewIsRecurring(e.target.checked)}
                disabled={submitting}
                className="size-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-400"
              />
              <label htmlFor="new-is-recurring" className="text-xs text-neutral-700 dark:text-neutral-300 sm:text-sm">
                חוזר מדי שנה (לדוגמה, חג)
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={!newDate || submitting}
            >
              {submitting ? "מוסיף..." : "הוסף חסימה"}
            </Button>
          </form>
        </section>

        <section className={ui.section}>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 sm:text-lg">תאריכים חסומים</h2>
          {loading ? (
            <InlineLoading className="py-6" />
          ) : blockedDates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center dark:border-neutral-700 dark:bg-neutral-800 sm:p-8">
              <p className="text-xs text-neutral-600 dark:text-neutral-400 sm:text-sm">אין תאריכים חסומים</p>
            </div>
          ) : (
            <ul className={ui.list}>
              {blockedDates.map((block) => (
                <li key={block.id}>
                  <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {new Date(block.date).toLocaleDateString("he-IL", {
                          dateStyle: "long",
                        })}
                        {block.isRecurring && (
                          <span className="mr-2 text-[10px] text-violet-600 dark:text-violet-400 sm:text-xs">
                            (חוזר שנתי)
                          </span>
                        )}
                      </p>
                      {block.reason && (
                        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 sm:text-sm">
                          {block.reason}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(block.id)}
                      className="shrink-0"
                    >
                      מחק
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
