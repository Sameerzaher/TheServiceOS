"use client";

import { useCallback, useEffect, useState } from 'react';
import { ui, Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useDashboardTeacherId } from '@/features/app/DashboardTeacherContext';
import { mergeTeacherScopeHeaders } from '@/lib/api/teacherScopeHeaders';

interface ReminderSettings {
  reminders_enabled: boolean;
  reminder_24h_enabled: boolean;
  reminder_24h_type: 'sms' | 'whatsapp';
  reminder_2h_enabled: boolean;
  reminder_2h_type: 'sms' | 'whatsapp';
  reminder_1h_enabled: boolean;
  reminder_1h_type: 'sms' | 'whatsapp';
  payment_reminder_enabled: boolean;
  payment_reminder_days_after: number;
  payment_reminder_type: 'sms' | 'whatsapp';
}

export default function RemindersPage() {
  const teacherId = useDashboardTeacherId();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [settings, setSettings] = useState<ReminderSettings>({
    reminders_enabled: true,
    reminder_24h_enabled: true,
    reminder_24h_type: 'whatsapp',
    reminder_2h_enabled: false,
    reminder_2h_type: 'whatsapp',
    reminder_1h_enabled: false,
    reminder_1h_type: 'sms',
    payment_reminder_enabled: true,
    payment_reminder_days_after: 3,
    payment_reminder_type: 'whatsapp',
  });
  const [message, setMessage] = useState('');

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/api/reminders/settings', {
        headers: mergeTeacherScopeHeaders(teacherId),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setLoadError(data.error || 'שגיאה בטעינת הגדרות');
        return;
      }
      const s = data.settings;
      setSettings({
        reminders_enabled: s.reminders_enabled,
        reminder_24h_enabled: s.reminder_24h_enabled,
        reminder_24h_type: s.reminder_24h_type,
        reminder_2h_enabled: s.reminder_2h_enabled,
        reminder_2h_type: s.reminder_2h_type,
        reminder_1h_enabled: s.reminder_1h_enabled,
        reminder_1h_type: s.reminder_1h_type,
        payment_reminder_enabled: s.payment_reminder_enabled,
        payment_reminder_days_after: s.payment_reminder_days_after,
        payment_reminder_type: s.payment_reminder_type,
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
      setLoadError('שגיאה בטעינת הגדרות');
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/reminders/settings', {
        method: 'PUT',
        headers: mergeTeacherScopeHeaders(teacherId, {
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMessage(data.error || 'שגיאה בשמירת ההגדרות ❌');
        return;
      }
      setMessage('ההגדרות נשמרו בהצלחה! ✅');
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage('שגיאה בשמירת ההגדרות ❌');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className={ui.pageMain}>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2">📲</div>
            <div className="text-sm text-neutral-600">טוען הגדרות...</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={ui.pageMain}>
      <header className={ui.header}>
        <div className="flex items-center gap-3">
          <span className="text-4xl">📲</span>
          <div>
            <h1 className={ui.pageTitle}>תזכורות אוטומטיות</h1>
            <p className={ui.pageSubtitle}>
              הגדר תזכורות SMS ו-WhatsApp ללקוחות
            </p>
          </div>
        </div>
      </header>

      <div className={ui.pageStack}>
        {loadError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
            {loadError}
          </div>
        )}
        {message && (
          <div className={cn(
            "rounded-lg p-4 text-sm font-medium",
            message.includes('✅') 
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          )}>
            {message}
          </div>
        )}

        {/* Main Toggle */}
        <div className={cn(ui.card, "p-6")}>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                הפעל תזכורות אוטומטיות
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                שלח תזכורות אוטומטיות ללקוחות לפני התורים
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.reminders_enabled}
              onChange={(e) => setSettings({ ...settings, reminders_enabled: e.target.checked })}
              className="h-6 w-11 rounded-full transition-colors checked:bg-emerald-600"
            />
          </label>
        </div>

        {settings.reminders_enabled && (
          <>
            {/* 24 Hours Before */}
            <div className={cn(ui.card, "p-6")}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <span>⏰</span>
                    תזכורת 24 שעות לפני
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    שלח תזכורת יום לפני התור
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.reminder_24h_enabled}
                  onChange={(e) => setSettings({ ...settings, reminder_24h_enabled: e.target.checked })}
                  className="h-5 w-5 rounded text-emerald-600"
                />
              </div>

              {settings.reminder_24h_enabled && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setSettings({ ...settings, reminder_24h_type: 'whatsapp' })}
                    className={cn(
                      "flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors",
                      settings.reminder_24h_type === 'whatsapp'
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                    )}
                  >
                    💚 WhatsApp
                  </button>
                  <button
                    onClick={() => setSettings({ ...settings, reminder_24h_type: 'sms' })}
                    className={cn(
                      "flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors",
                      settings.reminder_24h_type === 'sms'
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                    )}
                  >
                    📱 SMS
                  </button>
                </div>
              )}
            </div>

            {/* 2 Hours Before */}
            <div className={cn(ui.card, "p-6")}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <span>⏰</span>
                    תזכורת 2 שעות לפני
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    שלח תזכורת שעתיים לפני התור
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.reminder_2h_enabled}
                  onChange={(e) => setSettings({ ...settings, reminder_2h_enabled: e.target.checked })}
                  className="h-5 w-5 rounded text-emerald-600"
                />
              </div>

              {settings.reminder_2h_enabled && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setSettings({ ...settings, reminder_2h_type: 'whatsapp' })}
                    className={cn(
                      "flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors",
                      settings.reminder_2h_type === 'whatsapp'
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                    )}
                  >
                    💚 WhatsApp
                  </button>
                  <button
                    onClick={() => setSettings({ ...settings, reminder_2h_type: 'sms' })}
                    className={cn(
                      "flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors",
                      settings.reminder_2h_type === 'sms'
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                    )}
                  >
                    📱 SMS
                  </button>
                </div>
              )}
            </div>

            {/* 1 Hour Before */}
            <div className={cn(ui.card, "p-6")}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <span>⏰</span>
                    תזכורת שעה לפני
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    שלח תזכורת שעה לפני התור (מומלץ SMS)
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.reminder_1h_enabled}
                  onChange={(e) => setSettings({ ...settings, reminder_1h_enabled: e.target.checked })}
                  className="h-5 w-5 rounded text-emerald-600"
                />
              </div>

              {settings.reminder_1h_enabled && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setSettings({ ...settings, reminder_1h_type: 'whatsapp' })}
                    className={cn(
                      "flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors",
                      settings.reminder_1h_type === 'whatsapp'
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                    )}
                  >
                    💚 WhatsApp
                  </button>
                  <button
                    onClick={() => setSettings({ ...settings, reminder_1h_type: 'sms' })}
                    className={cn(
                      "flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors",
                      settings.reminder_1h_type === 'sms'
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                    )}
                  >
                    📱 SMS
                  </button>
                </div>
              )}
            </div>

            {/* Payment Reminders */}
            <div className={cn(ui.card, "p-6")}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <span>💰</span>
                    תזכורות תשלום
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    שלח תזכורת לתשלום עבור תורים שלא שולמו
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.payment_reminder_enabled}
                  onChange={(e) => setSettings({ ...settings, payment_reminder_enabled: e.target.checked })}
                  className="h-5 w-5 rounded text-emerald-600"
                />
              </div>

              {settings.payment_reminder_enabled && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      שלח תזכורת אחרי
                    </label>
                    <select
                      value={settings.payment_reminder_days_after}
                      onChange={(e) => setSettings({ ...settings, payment_reminder_days_after: parseInt(e.target.value) })}
                      className={ui.input}
                    >
                      <option value="1">יום אחד</option>
                      <option value="2">יומיים</option>
                      <option value="3">3 ימים</option>
                      <option value="7">שבוע</option>
                      <option value="14">שבועיים</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSettings({ ...settings, payment_reminder_type: 'whatsapp' })}
                      className={cn(
                        "flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors",
                        settings.payment_reminder_type === 'whatsapp'
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                          : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                      )}
                    >
                      💚 WhatsApp
                    </button>
                    <button
                      onClick={() => setSettings({ ...settings, payment_reminder_type: 'sms' })}
                      className={cn(
                        "flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors",
                        settings.payment_reminder_type === 'sms'
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                      )}
                    >
                      📱 SMS
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving}
            className="min-w-[200px]"
          >
            {saving ? 'שומר...' : 'שמור הגדרות'}
          </Button>
        </div>

        {/* Info Box */}
        <div className={cn(ui.card, "p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200")}>
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
            <span>💡</span>
            חשוב לדעת
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li>• התזכורות נשלחות אוטומטית לפני התורים</li>
            <li>• ניתן לשלוח תזכורת ידנית מעמוד התורים</li>
            <li>• WhatsApp זול יותר מ-SMS</li>
            <li>• כל ההודעות נשמרות בלוג למעקב</li>
            <li>• לשליחה אמיתית: הגדר MESSAGING_PROVIDER=twilio ב-Vercel</li>
            <li>• Cron מריץ /api/reminders/process כל 10 דקות</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
