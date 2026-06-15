import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/adminClient';
import { attachTeachers } from '@/lib/client-portal/appointmentsWithTeachers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Get client's appointments
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const token = req.cookies.get('client_session')?.value;

    if (!token) {
      return NextResponse.json(
        { ok: false, error: 'לא מחובר' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Find session and get client_id
    const { data: session } = await supabase
      .from('client_sessions')
      .select('client_id, expires_at')
      .eq('token', token)
      .single();

    if (!session || new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { ok: false, error: 'סשן לא תקין' },
        { status: 401 }
      );
    }

    // Get appointments
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('client_id', session.client_id)
      .order('start_at', { ascending: false });

    if (error) {
      console.error('[client-portal/appointments] Error:', error);
      return NextResponse.json(
        { ok: false, error: 'שגיאה בטעינת תורים' },
        { status: 500 }
      );
    }

    const withTeachers = await attachTeachers(supabase, appointments ?? []);

    return NextResponse.json({
      ok: true,
      appointments: withTeachers,
    });
  } catch (error) {
    console.error('[client-portal/appointments] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'שגיאה בטעינת תורים' },
      { status: 500 }
    );
  }
}

// Cancel appointment
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const token = req.cookies.get('client_session')?.value;
    if (!token) {
      return NextResponse.json(
        { ok: false, error: 'לא מחובר' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { appointmentId } = body;

    if (!appointmentId) {
      return NextResponse.json(
        { ok: false, error: 'חסר מזהה תור' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Verify session
    const { data: session } = await supabase
      .from('client_sessions')
      .select('client_id')
      .eq('token', token)
      .single();

    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'סשן לא תקין' },
        { status: 401 }
      );
    }

    // Get appointment to verify ownership
    const { data: appointment } = await supabase
      .from('appointments')
      .select('id, client_id, start_at, status')
      .eq('id', appointmentId)
      .single();

    if (!appointment || appointment.client_id !== session.client_id) {
      return NextResponse.json(
        { ok: false, error: 'תור לא נמצא' },
        { status: 404 }
      );
    }

    // Check if appointment is in the future
    if (new Date(appointment.start_at) < new Date()) {
      return NextResponse.json(
        { ok: false, error: 'לא ניתן לבטל תור שכבר עבר' },
        { status: 400 }
      );
    }

    // Check if already canceled
    if (appointment.status === 'canceled') {
      return NextResponse.json(
        { ok: false, error: 'התור כבר בוטל' },
        { status: 400 }
      );
    }

    // Cancel appointment
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status: 'canceled' })
      .eq('id', appointmentId);

    if (updateError) {
      console.error('[client-portal/appointments] Cancel error:', updateError);
      return NextResponse.json(
        { ok: false, error: 'שגיאה בביטול התור' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'התור בוטל בהצלחה',
    });
  } catch (error) {
    console.error('[client-portal/appointments] DELETE error:', error);
    return NextResponse.json(
      { ok: false, error: 'שגיאה בביטול התור' },
      { status: 500 }
    );
  }
}
