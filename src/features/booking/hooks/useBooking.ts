"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { heUi } from "@/config";
import { isSupabaseConfigured } from "@/core/config/supabaseEnv";

export interface BookingSubmitInput {
  fullName: string;
  phone: string;
  notes: string;
  slotStart: string;
  slotEnd: string;
  bookingCustomFields: Record<string, string>;
  /** Optional label for confirmation UI (e.g. selected service name). */
  serviceName?: string;
}

export interface UseBookingOptions {
  /** Called after a successful server booking (e.g. refresh local appointment list for slot UI). */
  onPublicBookingSuccess?: () => void;
  /** Required for `/book/[slug]` — persisted on `teacher_id` for the booking request. */
  teacherId?: string;
}

export interface BookingSuccessSnapshot {
  slotStart: string;
  slotEnd: string;
  serviceName?: string;
}

export interface UseBookingResult {
  isReady: boolean;
  isSubmitting: boolean;
  isSuccess: boolean;
  error: string | null;
  /** Set after a successful POST for WhatsApp / confirmation UI. */
  successSnapshot: BookingSuccessSnapshot | null;
  submitBooking: (input: BookingSubmitInput) => Promise<boolean>;
  resetState: () => void;
}

interface PublicBookingResponse {
  ok: boolean;
  error?: string;
  bookingId?: string;
  message?: string;
}

function toLocalDate(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toLocalTime(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function useBooking(options?: UseBookingOptions): UseBookingResult {
  const onSuccessRef = useRef(options?.onPublicBookingSuccess);
  const teacherIdRef = useRef(options?.teacherId);
  useEffect(() => {
    onSuccessRef.current = options?.onPublicBookingSuccess;
  }, [options?.onPublicBookingSuccess]);
  useEffect(() => {
    teacherIdRef.current = options?.teacherId;
  }, [options?.teacherId]);

  const submitInFlightRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successSnapshot, setSuccessSnapshot] = useState<BookingSuccessSnapshot | null>(
    null,
  );

  const isReady = isSupabaseConfigured();

  const submitBooking = useCallback(
    async (input: BookingSubmitInput): Promise<boolean> => {
      if (submitInFlightRef.current) return false;
      submitInFlightRef.current = true;
      setError(null);
      setIsSuccess(false);
      setSuccessSnapshot(null);

      if (!isSupabaseConfigured()) {
        setError(heUi.publicBooking.errUnavailable);
        submitInFlightRef.current = false;
        return false;
      }

      setIsSubmitting(true);
      try {
        const tid = teacherIdRef.current?.trim();
        const res = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(tid ? { teacherId: tid } : {}),
            fullName: input.fullName,
            phone: input.phone,
            bookingCustomFields: input.bookingCustomFields,
            preferredDate: toLocalDate(input.slotStart),
            preferredTime: toLocalTime(input.slotStart),
            notes: input.notes,
            status: "pending",
            createdAt: new Date().toISOString(),
            slotStart: input.slotStart,
            slotEnd: input.slotEnd,
          }),
        });

        let body: PublicBookingResponse | null = null;
        try {
          body = (await res.json()) as PublicBookingResponse;
        } catch {
          body = null;
        }

        if (!res.ok || !body || body.ok !== true) {
          const fromServer =
            typeof body?.error === "string" && body.error.length > 0
              ? body.error
              : null;
          const fallback =
            res.status === 503
              ? heUi.publicBooking.errUnavailable
              : res.status === 409
                ? heUi.publicBooking.errSlotTaken
                : res.status === 400
                  ? heUi.publicBooking.errInvalidPayload
                  : heUi.publicBooking.errSaveFailed;
          setError(fromServer ?? fallback);
          return false;
        }

        setIsSuccess(true);
        setSuccessSnapshot({
          slotStart: input.slotStart,
          slotEnd: input.slotEnd,
          serviceName: input.serviceName,
        });
        onSuccessRef.current?.();
        return true;
      } catch {
        setError(heUi.publicBooking.errNetwork);
        return false;
      } finally {
        submitInFlightRef.current = false;
        setIsSubmitting(false);
      }
    },
    [],
  );

  const resetState = useCallback(() => {
    setError(null);
    setIsSuccess(false);
    setSuccessSnapshot(null);
  }, []);

  return {
    isReady,
    isSubmitting,
    isSuccess,
    error,
    successSnapshot,
    submitBooking,
    resetState,
  };
}
