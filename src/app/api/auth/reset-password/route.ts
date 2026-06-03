import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/adminClient';
import { hashPassword, isValidPassword } from '@/lib/auth/passwordUtils';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { token, password } = body;

    // Validate inputs
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'טוקן לא תקין' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'סיסמה חסרה' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { ok: false, error: passwordValidation.error || 'סיסמה לא תקינה' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Find and validate token
    const { data: tokenData, error: tokenError } = await supabase
      .from('auth_tokens')
      .select('id, user_id, expires_at, used_at')
      .eq('token', token)
      .eq('token_type', 'password_reset')
      .single();

    if (tokenError || !tokenData) {
      console.log('[reset-password] Token not found:', token);
      return NextResponse.json(
        { ok: false, error: 'טוקן לא תקין או שפג תוקפו' },
        { status: 400 }
      );
    }

    // Check if token already used
    if (tokenData.used_at) {
      console.log('[reset-password] Token already used:', token);
      return NextResponse.json(
        { ok: false, error: 'הטוקן כבר נוצל' },
        { status: 400 }
      );
    }

    // Check if token expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    if (now > expiresAt) {
      console.log('[reset-password] Token expired:', token);
      return NextResponse.json(
        { ok: false, error: 'הטוקן פג תוקף. בקש איפוס סיסמה חדש' },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = hashPassword(password);

    // Update password
    const { error: updateError } = await supabase
      .from('teachers')
      .update({ password_hash: passwordHash })
      .eq('id', tokenData.user_id);

    if (updateError) {
      console.error('[reset-password] Password update error:', updateError);
      return NextResponse.json(
        { ok: false, error: 'שגיאה בעדכון הסיסמה' },
        { status: 500 }
      );
    }

    // Mark token as used
    await supabase
      .from('auth_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    console.log('[reset-password] Password reset successful:', {
      teacherId: tokenData.user_id,
    });

    return NextResponse.json({
      ok: true,
      message: 'הסיסמה עודכנה בהצלחה',
    });
  } catch (error) {
    console.error('[reset-password] Unexpected error:', error);
    return NextResponse.json(
      { ok: false, error: 'שגיאה בעיבוד הבקשה' },
      { status: 500 }
    );
  }
}
