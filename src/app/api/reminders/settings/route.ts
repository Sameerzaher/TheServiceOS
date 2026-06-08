import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/adminClient';
import { validateSession } from '@/lib/auth/session';
import { resolveTeacherScopeFromSession } from '@/lib/api/resolveTeacherId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_SETTINGS = {
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
};

const UPDATABLE_FIELDS = new Set([
  'reminders_enabled',
  'reminder_24h_enabled',
  'reminder_24h_type',
  'reminder_2h_enabled',
  'reminder_2h_type',
  'reminder_1h_enabled',
  'reminder_1h_type',
  'payment_reminder_enabled',
  'payment_reminder_days_after',
  'payment_reminder_type',
  'appointment_reminder_template',
  'payment_reminder_template',
]);

function pickUpdatableFields(body: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (UPDATABLE_FIELDS.has(key)) payload[key] = value;
  }
  return payload;
}

async function resolveTeacherId(req: NextRequest, body?: unknown): Promise<string | null> {
  const session = await validateSession(req);
  if (!session.ok || !session.teacherId) return null;
  return resolveTeacherScopeFromSession(req, session.teacherId, session.role, body);
}

// GET - Get reminder settings
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const teacherId = await resolveTeacherId(req);
    if (!teacherId) {
      return NextResponse.json(
        { ok: false, error: 'לא מחובר' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseAdminClient();

    let { data: settings, error } = await supabase
      .from('reminder_settings')
      .select('*')
      .eq('teacher_id', teacherId)
      .single();

    if (error && error.code === 'PGRST116') {
      const { data: newSettings, error: createError } = await supabase
        .from('reminder_settings')
        .insert({
          teacher_id: teacherId,
          ...DEFAULT_SETTINGS,
        })
        .select()
        .single();

      if (createError) {
        console.error('[reminders/settings] Create error:', createError);
        return NextResponse.json(
          { ok: false, error: 'שגיאה ביצירת הגדרות' },
          { status: 500 }
        );
      }

      settings = newSettings;
    } else if (error) {
      console.error('[reminders/settings] GET error:', error);
      return NextResponse.json(
        { ok: false, error: 'שגיאה בטעינת הגדרות' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      settings,
    });
  } catch (error) {
    console.error('[reminders/settings] GET error:', error);
    return NextResponse.json(
      { ok: false, error: 'שגיאה בטעינת הגדרות' },
      { status: 500 }
    );
  }
}

// PUT - Update reminder settings
export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const teacherId = await resolveTeacherId(req, body);
    if (!teacherId) {
      return NextResponse.json(
        { ok: false, error: 'לא מחובר' },
        { status: 401 }
      );
    }

    const payload = pickUpdatableFields(body as Record<string, unknown>);
    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { ok: false, error: 'אין שדות לעדכון' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    const { data: existing } = await supabase
      .from('reminder_settings')
      .select('id')
      .eq('teacher_id', teacherId)
      .maybeSingle();

    let settings;
    let error;

    if (existing) {
      ({ data: settings, error } = await supabase
        .from('reminder_settings')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('teacher_id', teacherId)
        .select()
        .single());
    } else {
      ({ data: settings, error } = await supabase
        .from('reminder_settings')
        .insert({
          teacher_id: teacherId,
          ...DEFAULT_SETTINGS,
          ...payload,
        })
        .select()
        .single());
    }

    if (error) {
      console.error('[reminders/settings] Update error:', error);
      return NextResponse.json(
        { ok: false, error: 'שגיאה בעדכון הגדרות' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      settings,
      message: 'ההגדרות עודכנו בהצלחה',
    });
  } catch (error) {
    console.error('[reminders/settings] PUT error:', error);
    return NextResponse.json(
      { ok: false, error: 'שגיאה בעדכון הגדרות' },
      { status: 500 }
    );
  }
}
