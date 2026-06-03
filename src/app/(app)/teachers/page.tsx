"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { heUi } from "@/config";
import { Button, ui, useToast } from "@/components/ui";
import { useDashboardTeacherOptional } from "@/features/app/DashboardTeacherContext";
import { useRequireAdmin } from "@/features/auth/AuthContext";
import type { BusinessType } from "@/core/types/teacher";
import { mergeTeacherScopeHeaders } from "@/lib/api/teacherScopeHeaders";
import { cn } from "@/lib/cn";

interface TeacherFormData {
  fullName: string;
  businessName: string;
  phone: string;
  slug: string;
  businessType: BusinessType;
  email: string;
  password: string;
  role: "admin" | "user";
}

export default function TeachersManagementPage() {
  // Require admin role - will redirect if not admin
  const auth = useRequireAdmin();
  const toast = useToast();
  const router = useRouter();
  const ctx = useDashboardTeacherOptional();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);
  
  const [formData, setFormData] = useState<TeacherFormData>({
    fullName: "",
    businessName: "",
    phone: "",
    slug: "",
    businessType: "driving_instructor",
    email: "",
    password: "",
    role: "user",
  });

  const teachers = ctx?.teachers ?? [];

  // Show loading while checking auth
  if (auth.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-4xl">📅</div>
          <div className="mt-2 text-sm text-neutral-600">טוען...</div>
        </div>
      </div>
    );
  }

  function openCreateForm() {
    setFormData({
      fullName: "",
      businessName: "",
      phone: "",
      slug: "",
      businessType: "driving_instructor",
      email: "",
      password: "",
      role: "user",
    });
    setEditingId(null);
    setIsCreating(true);
  }

  function openEditForm(teacherId: string) {
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) return;
    
    setFormData({
      fullName: teacher.fullName,
      businessName: teacher.businessName,
      phone: "",
      slug: teacher.slug,
      businessType: teacher.businessType,
      email: "",
      password: "",
      role: "user",
    });
    setEditingId(teacherId);
    setIsCreating(true);
  }

  function closeForm() {
    setIsCreating(false);
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    try {
      if (editingId) {
        // Update existing teacher - use PUT
        const res = await fetch(`/api/teachers/${encodeURIComponent(editingId)}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        const data = await res.json();
        
        if (!res.ok || data.ok !== true) {
          toast(data.error || "שגיאה בשמירה", "error");
          return;
        }
      } else {
        // Create new teacher - use POST to /api/teachers
        const res = await fetch("/api/teachers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        const data = await res.json();
        
        if (!res.ok || data.ok !== true) {
          toast(data.error || "שגיאה ביצירת מורה", "error");
          return;
        }
      }

      await ctx?.reloadTeachers();
      closeForm();
      toast(editingId ? "המורה עודכן בהצלחה" : "המורה נוסף בהצלחה");
    } catch (e) {
      console.error("[TeachersManagement] save error:", e);
      toast("שגיאה בשמירה", "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRepairLegacyData() {
    if (isRepairing) return;
    const ok = window.confirm(
      "לתקן קישורי עסק והגדרות הזמנה לנתונים ישנים? מומלץ אם קישורי /book לא עובדים.",
    );
    if (!ok) return;
    setIsRepairing(true);
    try {
      const res = await fetch("/api/admin/repair-teacher-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun: false }),
      });
      const data = await res.json();
      if (!res.ok || data.ok !== true) {
        toast(data.error || "תיקון נכשל", "error");
        return;
      }
      const r = data.report as {
        businessesInserted?: number;
        teachersFixedBusinessId?: number;
        bookingSettingsInserted?: number;
        errors?: string[];
      };
      const errs = r.errors?.length ? ` שגיאות: ${r.errors.length}` : "";
      toast(
        `תיקון הושלם: עסקים +${r.businessesInserted ?? 0}, מורים +${r.teachersFixedBusinessId ?? 0}, הגדרות +${r.bookingSettingsInserted ?? 0}.${errs}`,
        r.errors?.length ? "error" : "success",
      );
      await ctx?.reloadTeachers();
    } catch (e) {
      console.error("[TeachersManagement] repair error:", e);
      toast("שגיאה בתיקון", "error");
    } finally {
      setIsRepairing(false);
    }
  }

  async function handleDelete(teacherId: string) {
    if (isDeleting) return;
    
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) return;

    const confirmed = window.confirm(
      `האם למחוק את ${teacher.businessName}?\n\nכל הלקוחות והתורים שלו יימחקו גם כן!`
    );
    
    if (!confirmed) return;

    setIsDeleting(teacherId);
    try {
      const res = await fetch(`/api/teachers/${encodeURIComponent(teacherId)}`, {
        method: "DELETE",
        headers: mergeTeacherScopeHeaders(ctx?.teacherId ?? ""),
      });

      const data = await res.json();
      
      if (!res.ok || data.ok !== true) {
        toast(data.error || "שגיאה במחיקה", "error");
        return;
      }

      await ctx?.reloadTeachers();
      
      // If we deleted the current teacher, switch to another one
      if (teacherId === ctx?.teacherId && teachers.length > 1) {
        const nextTeacher = teachers.find((t) => t.id !== teacherId);
        if (nextTeacher) {
          ctx.setTeacherId(nextTeacher.id);
        }
      }
      
      toast("המורה נמחק בהצלחה");
    } catch (e) {
      console.error("[TeachersManagement] delete error:", e);
      toast("שגיאה במחיקה", "error");
    } finally {
      setIsDeleting(null);
    }
  }

  const getTeacherIcon = (businessType: BusinessType) => {
    return businessType === 'driving_instructor' ? '🚗' : '💉';
  };

  return (
    <main className="mx-auto min-h-dvh w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10 sm:pb-10">
      <header className={cn(ui.header, "border-neutral-200/80 dark:border-neutral-700/80")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-4">
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 text-3xl shadow-sm dark:from-emerald-900/40 dark:to-teal-900/30"
              aria-hidden
            >
              👥
            </span>
            <div>
              <h1 className={ui.pageTitle}>ניהול מורים ועסקים</h1>
              <p className={ui.pageSubtitle}>
                הוסף, ערוך או מחק מורים ועסקים
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className={cn(ui.pageStack, "gap-8 sm:gap-10")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="inline-flex w-fit items-center rounded-full border border-emerald-200/80 bg-emerald-50/90 px-4 py-2 text-sm font-bold text-emerald-800 shadow-sm dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-200">
            {teachers.length}{" "}
            {teachers.length === 1 ? "מורה" : "מורים"}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={handleRepairLegacyData}
              disabled={isRepairing}
              className="min-h-12 w-full justify-center px-4 py-2.5 text-sm sm:w-auto"
            >
              {isRepairing ? "⏳ מתקן…" : "🩹 תיקון נתונים ישנים"}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={openCreateForm}
              className="min-h-12 w-full justify-center px-6 py-3 font-bold shadow-md shadow-emerald-900/10 sm:w-auto"
            >
              ✨ הוסף מורה/עסק חדש
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {teachers.map((teacher) => (
            <div
              key={teacher.id}
              className={cn(
                ui.card,
                "group relative overflow-hidden rounded-2xl border-neutral-200/90 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-xl dark:border-neutral-700/90",
                teacher.id === ctx?.teacherId &&
                  "ring-2 ring-emerald-500/80 ring-offset-2 ring-offset-white dark:ring-offset-neutral-900",
              )}
            >
              {teacher.id === ctx?.teacherId && (
                <div className="absolute end-3 top-3 z-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-md">
                  ✨ פעיל
                </div>
              )}
              <div className="flex items-start gap-4 p-5 pt-6 sm:p-6">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-100 text-3xl shadow-inner dark:from-emerald-950/50 dark:to-teal-950/40">
                  {getTeacherIcon(teacher.businessType)}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <h3 className="text-lg font-bold leading-snug text-neutral-900 dark:text-neutral-50">
                      {teacher.businessName}
                    </h3>
                    <p className="mt-0.5 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                      {teacher.fullName}
                    </p>
                  </div>
                  <div
                    className="rounded-xl border border-neutral-200/80 bg-neutral-50/80 px-3 py-2 dark:border-neutral-600/60 dark:bg-neutral-800/50"
                    dir="ltr"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      קישור הזמנה
                    </p>
                    <p className="mt-0.5 break-all font-mono text-[11px] leading-relaxed text-neutral-800 dark:text-neutral-200 sm:text-xs">
                      /book/{teacher.slug}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                    {teacher.businessType === "driving_instructor"
                      ? "מורה נהיגה"
                      : "מרפאה קוסמטית"}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 border-t border-neutral-200/80 bg-neutral-50/70 p-3 dark:border-neutral-700/80 dark:bg-neutral-900/40">
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-12 flex-1 text-sm font-semibold"
                  onClick={() => openEditForm(teacher.id)}
                >
                  ✏️ ערוך
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  className="min-h-12 flex-1 text-sm font-semibold"
                  onClick={() => handleDelete(teacher.id)}
                  disabled={isDeleting === teacher.id || teachers.length === 1}
                >
                  {isDeleting === teacher.id ? "⏳ מוחק..." : "🗑️ מחק"}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">
                    {editingId ? "ערוך מורה/עסק" : "הוסף מורה/עסק חדש"}
                  </h2>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="text-2xl font-bold text-white/80 transition hover:text-white"
                    disabled={isSaving}
                  >
                    ×
                  </button>
                </div>
                <p className="mt-1 text-sm text-emerald-50">
                  {editingId ? "עדכן את פרטי המורה" : "מלא את הפרטים ליצירת מורה חדש"}
                </p>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="max-h-[calc(100vh-12rem)] overflow-y-auto p-6">
                <div className="space-y-5">
                  {/* Business Info Section */}
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-neutral-700">
                      <span className="text-lg">🏢</span>
                      פרטי העסק
                    </h3>

                    <div>
                      <label htmlFor="teacher-business-name" className={ui.label}>
                        שם העסק *
                      </label>
                      <input
                        id="teacher-business-name"
                        type="text"
                        required
                        value={formData.businessName}
                        onChange={(e) =>
                          setFormData((d) => ({ ...d, businessName: e.target.value }))
                        }
                        className={ui.input}
                        placeholder="בית ספר לנהיגה..."
                        disabled={isSaving}
                      />
                    </div>

                    <div>
                      <label htmlFor="teacher-type" className={ui.label}>
                        סוג העסק *
                      </label>
                      <select
                        id="teacher-type"
                        required
                        value={formData.businessType}
                        onChange={(e) =>
                          setFormData((d) => ({
                            ...d,
                            businessType: e.target.value as BusinessType,
                          }))
                        }
                        className={ui.select}
                        disabled={isSaving}
                      >
                        <option value="driving_instructor">🚗 מורה נהיגה</option>
                        <option value="cosmetic_clinic">💉 מרפאה קוסמטית</option>
                      </select>
                    </div>
                  </div>

                  {/* Owner Info Section */}
                  <div className="space-y-4 border-t border-neutral-200 pt-5">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-neutral-700">
                      <span className="text-lg">👤</span>
                      פרטי המורה
                    </h3>

                    <div>
                      <label htmlFor="teacher-full-name" className={ui.label}>
                        שם המורה *
                      </label>
                      <input
                        id="teacher-full-name"
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData((d) => ({ ...d, fullName: e.target.value }))
                        }
                        className={ui.input}
                        placeholder="שם מלא..."
                        disabled={isSaving}
                      />
                    </div>

                    <div>
                      <label htmlFor="teacher-phone" className={ui.label}>
                        טלפון
                      </label>
                      <input
                        id="teacher-phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData((d) => ({ ...d, phone: e.target.value }))
                        }
                        className={ui.input}
                        placeholder="050-0000000"
                        disabled={isSaving}
                      />
                    </div>
                  </div>

                  {/* Auth Info Section - Only for new teachers */}
                  {!editingId && (
                    <div className="space-y-4 border-t border-neutral-200 pt-5">
                      <h3 className="flex items-center gap-2 text-sm font-bold text-neutral-700">
                        <span className="text-lg">🔐</span>
                        פרטי התחברות
                      </h3>

                      <div>
                        <label htmlFor="teacher-email" className={ui.label}>
                          אימייל להתחברות *
                        </label>
                        <input
                          id="teacher-email"
                          type="email"
                          required
                          dir="ltr"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData((d) => ({ ...d, email: e.target.value }))
                          }
                          className={ui.input}
                          placeholder="teacher@example.com"
                          disabled={isSaving}
                        />
                      </div>

                      <div>
                        <label htmlFor="teacher-password" className={ui.label}>
                          סיסמה *
                        </label>
                        <input
                          id="teacher-password"
                          type="password"
                          required
                          dir="ltr"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData((d) => ({ ...d, password: e.target.value }))
                          }
                          className={ui.input}
                          placeholder="לפחות 8 תווים"
                          disabled={isSaving}
                        />
                        <p className="mt-1.5 text-xs text-neutral-500">
                          8+ תווים, אות גדולה, קטנה ומספר
                        </p>
                      </div>

                      <div>
                        <label htmlFor="teacher-role" className={ui.label}>
                          תפקיד *
                        </label>
                        <select
                          id="teacher-role"
                          required
                          value={formData.role}
                          onChange={(e) =>
                            setFormData((d) => ({
                              ...d,
                              role: e.target.value as "admin" | "user",
                            }))
                          }
                          className={ui.select}
                          disabled={isSaving}
                        >
                          <option value="user">👤 משתמש רגיל</option>
                          <option value="admin">👑 אדמין (יכול לנהל מורים)</option>
                        </select>
                        <p className="mt-1.5 text-xs text-neutral-500">
                          אדמין יכול להוסיף ולערוך מורים אחרים
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Booking URL Section */}
                  <div className="space-y-4 border-t border-neutral-200 pt-5">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-neutral-700">
                      <span className="text-lg">🔗</span>
                      כתובת הזמנה
                    </h3>

                    <div>
                      <label htmlFor="teacher-slug" className={ui.label}>
                        Slug (כתובת ייחודית) *
                      </label>
                      <input
                        id="teacher-slug"
                        type="text"
                        required
                        dir="ltr"
                        value={formData.slug}
                        onChange={(e) =>
                          setFormData((d) => ({ 
                            ...d, 
                            slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') 
                          }))
                        }
                        className={ui.input}
                        placeholder="my-business"
                        disabled={!!editingId || isSaving}
                      />
                      <div className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-50 p-3">
                        <span className="text-sm text-emerald-700">🔗 קישור הזמנה:</span>
                        <code className="text-xs font-mono text-emerald-900" dir="ltr">
                          /book/{formData.slug || "..."}
                        </code>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 border-t border-neutral-200 pt-6">
                    <Button
                      type="button"
                      variant="secondary"
                      className="flex-1 py-3"
                      onClick={closeForm}
                      disabled={isSaving}
                    >
                      ביטול
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      className="flex-1 py-3 font-bold"
                      disabled={isSaving}
                    >
                      {isSaving ? "⏳ שומר..." : editingId ? "💾 שמור שינויים" : "✨ צור מורה"}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
