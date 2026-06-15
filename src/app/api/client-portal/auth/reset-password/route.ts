/**
 * Client Reset Password API
 * איפוס סיסמה ללקוחות
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/adminClient';
import { hashClientPassword } from '@/lib/auth/clientAuth';
import { findAuthToken, markAuthTokenUsed } from '@/lib/auth/authTokens';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'חסרים פרטים נדרשים' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'הסיסמה חייבת להכיל לפחות 8 תווים' },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { error: 'הסיסמה חייבת להכיל לפחות אות גדולה אחת באנגלית' },
        { status: 400 }
      );
    }

    if (!/[a-z]/.test(password)) {
      return NextResponse.json(
        { error: 'הסיסמה חייבת להכיל לפחות אות קטנה אחת באנגלית' },
        { status: 400 }
      );
    }

    if (!/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: 'הסיסמה חייבת להכיל לפחות ספרה אחת' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();
    const authToken = await findAuthToken(supabase, token, 'password_reset');

    if (!authToken) {
      return NextResponse.json(
        { error: 'טוקן איפוס לא תקין או פג תוקפו' },
        { status: 400 }
      );
    }

    if (authToken.usedAt) {
      return NextResponse.json(
        { error: 'הטוקן כבר נעשה בו שימוש' },
        { status: 400 }
      );
    }

    if (new Date(authToken.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'הטוקן פג תוקפו. בקש איפוס חדש' },
        { status: 400 }
      );
    }

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, portal_enabled')
      .eq('id', authToken.userId)
      .maybeSingle();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'לקוח לא נמצא' },
        { status: 404 }
      );
    }

    if (!client.portal_enabled) {
      return NextResponse.json(
        { error: 'גישה לפורטל אינה מאופשרת' },
        { status: 403 }
      );
    }

    // Hash new password
    const passwordHash = hashClientPassword(password);

    // Update password
    const { error: updateError } = await supabase
      .from('clients')
      .update({ password_hash: passwordHash })
      .eq('id', client.id);

    if (updateError) {
      console.error('[client-reset-password] Update error:', updateError);
      return NextResponse.json(
        { error: 'שגיאה בעדכון הסיסמה' },
        { status: 500 }
      );
    }

    await markAuthTokenUsed(supabase, authToken.id);

    return NextResponse.json({
      success: true,
      message: 'הסיסמה עודכנה בהצלחה! כעת תוכל להתחבר',
    });
  } catch (error) {
    console.error('[client-reset-password] Unexpected error:', error);
    return NextResponse.json(
      { error: 'שגיאה לא צפויה' },
      { status: 500 }
    );
  }
}
