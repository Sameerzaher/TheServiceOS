/**
 * Client Book Appointment API
 * קביעת תור חדש ללקוחות
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getSupabaseAdminClient } from '@/lib/supabase/adminClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET - Get available teachers for booking
 */
export async function GET(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('client_session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'לא מחובר' },
        { status: 401 }
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

    // Get client info to find their teacher (from past appointments)
    const { data: pastAppointments } = await supabase
      .from('appointments')
      .select('teacher_id')
      .eq('client_id', session.client_id)
      .limit(1);

    type TeacherOption = {
      id: string;
      full_name: string;
      business_name: string | null;
      phone: string | null;
      business_type: string | null;
    };

    let teachers: TeacherOption[] = [];

    if (pastAppointments?.[0]?.teacher_id) {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id, full_name, business_name, phone, business_type')
        .eq('id', pastAppointments[0].teacher_id)
        .maybeSingle();

      if (teacher) {
        teachers = [teacher];
      }
    } else {
      // For new clients, return all active teachers
      const { data: allTeachers, error: teachersError } = await supabase
        .from('teachers')
        .select('id, full_name, business_name, phone, business_type')
        .limit(10);

      if (teachersError) {
        console.error('[book-appointment] teachers list error:', teachersError);
      }

      teachers = allTeachers || [];
    }

    return NextResponse.json({ teachers });
  } catch (error) {
    console.error('[book-appointment] GET error:', error);
    return NextResponse.json(
      { error: 'שגיאה לא צפויה' },
      { status: 500 }
    );
  }
}

/**
 * POST - Book a new appointment
 */
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

    const { teacherId, startAt, endAt, notes } = await request.json();

    if (!teacherId || !startAt || !endAt) {
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

    // Verify teacher exists
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id, business_id')
      .eq('id', teacherId)
      .single();

    if (!teacher) {
      return NextResponse.json(
        { error: 'מורה לא נמצא' },
        { status: 404 }
      );
    }

    // Check for conflicts
    const { data: conflicts } = await supabase
      .from('appointments')
      .select('id')
      .eq('teacher_id', teacherId)
      .neq('status', 'canceled')
      .or(`and(start_at.lte.${startAt},end_at.gt.${startAt}),and(start_at.lt.${endAt},end_at.gte.${endAt})`)
      .limit(1);

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        { error: 'השעה תפוסה. אנא בחר שעה אחרת' },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const noteText = typeof notes === 'string' ? notes.trim() : '';

    // Create appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        id: randomUUID(),
        business_id: teacher.business_id,
        teacher_id: teacherId,
        client_id: session.client_id,
        start_at: startAt,
        end_at: endAt,
        status: 'scheduled',
        payment_status: 'unpaid',
        amount: 0,
        custom_fields: noteText ? { notes: noteText } : {},
        created_at: now,
        updated_at: now,
      })
      .select('id')
      .single();

    if (appointmentError) {
      console.error('[book-appointment] Error:', appointmentError);
      return NextResponse.json(
        { error: 'שגיאה ביצירת תור' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'התור נקבע בהצלחה!',
      appointmentId: appointment.id,
    });
  } catch (error) {
    console.error('[book-appointment] POST error:', error);
    return NextResponse.json(
      { error: 'שגיאה לא צפויה' },
      { status: 500 }
    );
  }
}
