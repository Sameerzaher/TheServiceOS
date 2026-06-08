import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/adminClient';
import { messagingService } from '@/lib/messaging/messagingService';
import { validateSession } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await validateSession(req);
    if (!session.ok) {
      return NextResponse.json(
        { ok: false, error: 'לא מאומת' },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { appointmentId, type = 'whatsapp' } = body;

    if (!appointmentId) {
      return NextResponse.json(
        { ok: false, error: 'חסר appointment ID' },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient();

    const { data: appointment, error: aptError } = await supabase
      .from('appointments')
      .select(`
        id,
        start_at,
        teacher_id,
        clients ( id, full_name, phone )
      `)
      .eq('id', appointmentId)
      .single();

    if (aptError || !appointment) {
      return NextResponse.json(
        { ok: false, error: 'תור לא נמצא' },
        { status: 404 },
      );
    }

    const { data: teacher } = await supabase
      .from('teachers')
      .select('id, business_name, business_id')
      .eq('id', appointment.teacher_id)
      .single();

    if (!teacher) {
      return NextResponse.json(
        { ok: false, error: 'מורה לא נמצא' },
        { status: 404 },
      );
    }

    const client = Array.isArray(appointment.clients)
      ? appointment.clients[0]
      : appointment.clients;

    if (!client?.phone) {
      return NextResponse.json(
        { ok: false, error: 'ללקוח אין מספר טלפון' },
        { status: 400 },
      );
    }

    const result = await messagingService.sendAppointmentReminder(
      client.phone,
      client.full_name ?? 'לקוח',
      new Date(appointment.start_at),
      teacher.business_name ?? 'העסק',
      type,
    );

    await supabase.from('message_logs').insert({
      business_id: teacher.business_id,
      appointment_id: appointmentId,
      client_id: client.id,
      phone_number: client.phone,
      message_type: type,
      message_purpose: 'appointment_reminder',
      message_content: `Manual reminder for appointment at ${appointment.start_at}`,
      status: result.success ? 'sent' : 'failed',
      provider: result.provider,
      provider_message_id: result.messageId,
      error_message: result.error,
      sent_at: result.success ? new Date().toISOString() : null,
    });

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error || 'שגיאה בשליחת ההודעה' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      messageId: result.messageId,
      message: 'התזכורת נשלחה בהצלחה',
    });
  } catch (error) {
    console.error('[reminders/send] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'שגיאה בשליחת תזכורת' },
      { status: 500 },
    );
  }
}
