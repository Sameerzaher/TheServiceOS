'use client';

/**
 * Client Profile Page
 * דף עריכת פרופיל לקוח
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [originalData, setOriginalData] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/client-portal/profile');
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/client-login');
          return;
        }
        throw new Error('שגיאה בטעינת פרופיל');
      }

      const data = await response.json();
      const profile = {
        fullName: data.client.full_name,
        email: data.client.email,
        phone: data.client.phone,
      };

      setOriginalData(profile);
      setFormData({
        ...profile,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    } catch {
      setError('שגיאה בטעינת פרופיל');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate password change
    if (formData.newPassword || formData.confirmNewPassword) {
      if (!formData.currentPassword) {
        setError('נדרשת סיסמה נוכחית לשינוי סיסמה');
        return;
      }

      if (formData.newPassword !== formData.confirmNewPassword) {
        setError('הסיסמאות החדשות אינן תואמות');
        return;
      }
    }

    setSaving(true);

    try {
      const response = await fetch('/api/client-portal/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'שגיאה בעדכון פרופיל');
        return;
      }

      setSuccess(data.message);
      
      // Clear password fields
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });

      // Update original data
      setOriginalData({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
      });

      // If email changed, show warning
      if (data.emailChanged) {
        setSuccess('הפרופיל עודכן! אנא אמת את כתובת האימייל החדשה');
      }
    } catch (err) {
      setError('שגיאת רשת. אנא נסה שוב');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">הפרופיל שלי</h1>
          <button
            onClick={() => router.push('/client-dashboard')}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← חזור לדשבורד
          </button>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Info Section */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                פרטים אישיים
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    שם מלא
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    אימייל
                  </label>
                  <input
                    type="email"
                    dir="ltr"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {formData.email !== originalData.email && (
                    <p className="text-xs text-orange-600 mt-1">
                      ⚠️ שינוי אימייל ידרוש אימות מחדש
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    טלפון
                  </label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                שינוי סיסמה
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    סיסמה נוכחית
                  </label>
                  <input
                    type="password"
                    dir="ltr"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="רק אם רוצה לשנות סיסמה"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    סיסמה חדשה
                  </label>
                  <input
                    type="password"
                    dir="ltr"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="לפחות 8 תווים"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    הסיסמה חייבת להכיל: אות גדולה, אות קטנה, ספרה (באנגלית)
                  </p>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    אימות סיסמה חדשה
                  </label>
                  <input
                    type="password"
                    dir="ltr"
                    value={formData.confirmNewPassword}
                    onChange={(e) => setFormData({ ...formData, confirmNewPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="הזן את הסיסמה החדשה שוב"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'שומר...' : 'שמור שינויים'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
