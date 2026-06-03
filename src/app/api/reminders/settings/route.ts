import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/adminClient';

// GET - Get reminder settings
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Get teacher ID from session (simplified - you may need to get from auth)
    const teacherId = req.headers.get('x-teacher-id');
    
    if (!teacherId) {
      return NextResponse.json(
        { ok: false, error: 'לא מחובר' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Get or create settings
    let { data: settings, error } = await supabase
      .from('reminder_settings')
      .select('*')
      .eq('teacher_id', teacherId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Settings don't exist, create default
      const { data: newSettings, error: createError } = await supabase
        .from('reminder_settings')
        .insert({
          teacher_id: teacherId,
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
    const teacherId = req.headers.get('x-teacher-id');
    
    if (!teacherId) {
      return NextResponse.json(
        { ok: false, error: 'לא מחובר' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const supabase = getSupabaseAdminClient();

    const { data: settings, error } = await supabase
      .from('reminder_settings')
      .update(body)
      .eq('teacher_id', teacherId)
      .select()
      .single();

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
