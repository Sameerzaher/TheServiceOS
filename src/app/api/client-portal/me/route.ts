import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/adminClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Get current client info from session
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

    // Find session
    const { data: session, error: sessionError } = await supabase
      .from('client_sessions')
      .select('client_id, expires_at')
      .eq('token', token)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { ok: false, error: 'סשן לא תקין' },
        { status: 401 }
      );
    }

    // Check if session expired
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { ok: false, error: 'הסשן פג תוקף' },
        { status: 401 }
      );
    }

    // Get client data
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, full_name, email, phone, notes, created_at, email_verified')
      .eq('id', session.client_id)
      .single();

    if (clientError || !client) {
      await supabase.from('client_sessions').delete().eq('token', token);
      return NextResponse.json(
        { ok: false, error: 'סשן לא תקין' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      client,
    });
  } catch (error) {
    console.error('[client-portal/me] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'שגיאה בשליפת פרטים' },
      { status: 500 }
    );
  }
}
