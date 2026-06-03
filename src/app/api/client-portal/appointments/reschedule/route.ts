/**
 * Reschedule Appointment API (for clients)
 * שינוי מועד תור ללקוחות
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/core/config/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('client_session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'לא מחובר' },
        { status: 401 }
      );
    }

    const { appointmentId, newStartAt, newEndAt } = await request.json();

    if (!appointmentId || !newStartAt || !newEndAt) {
      return NextResponse.json(
        { error: 'חסרים פרטים נדרשים' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Verify session
    const { data: session } = await supabase
      .from('client_sessions')
      .select('client_id, expires_at')
      .eq('token', sessionToken)
      .single();

    if (!session || new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'סשן לא תקין' },
        { status: 401 }
      );
    }

    // Get appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('id, client_id, teacher_id, start_at, status')
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: 'תור לא נמצא' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (appointment.client_id !== session.client_id) {
      return NextResponse.json(
        { error: 'אין לך הרשאה לשנות תור זה' },
        { status: 403 }
      );
    }

    // Check if appointment is in the future
    if (new Date(appointment.start_at) < new Date()) {
      return NextResponse.json(
        { error: 'לא ניתן לשנות תור שכבר התרחש' },
        { status: 400 }
      );
    }

    // Check if appointment is already canceled
    if (appointment.status === 'canceled') {
      return NextResponse.json(
        { error: 'לא ניתן לשנות תור מבוטל' },
        { status: 400 }
      );
    }

    // Check for conflicts with the new time
    const { data: conflicts } = await supabase
      .from('appointments')
      .select('id')
      .eq('teacher_id', appointment.teacher_id)
      .neq('id', appointmentId)
      .neq('status', 'canceled')
      .or(`and(start_at.lte.${newStartAt},end_at.gt.${newStartAt}),and(start_at.lt.${newEndAt},end_at.gte.${newEndAt})`)
      .limit(1);

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        { error: 'השעה החדשה תפוסה. אנא בחר שעה אחרת' },
        { status: 409 }
      );
    }

    // Update appointment
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        start_at: newStartAt,
        end_at: newEndAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointmentId);

    if (updateError) {
      console.error('[reschedule] Error:', updateError);
      return NextResponse.json(
        { error: 'שגיאה בשינוי התור' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'התור שונה בהצלחה!',
    });
  } catch (error) {
    console.error('[reschedule] Unexpected error:', error);
    return NextResponse.json(
      { error: 'שגיאה לא צפויה' },
      { status: 500 }
    );
  }
}
