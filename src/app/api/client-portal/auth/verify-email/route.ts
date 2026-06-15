/**
 * Client Email Verification API
 * אימות אימייל ללקוחות
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { getSupabaseAdminClient } from '@/lib/supabase/adminClient';
import { emailService } from '@/lib/email/emailService';
import {
  findAuthToken,
  insertAuthToken,
  markAuthTokenUsed,
} from '@/lib/auth/authTokens';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'חסר טוקן אימות' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();
    const authToken = await findAuthToken(supabase, token, 'email_verification');

    if (!authToken) {
      return NextResponse.json(
        { error: 'טוקן אימות לא תקין או פג תוקפו' },
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
        { error: 'הטוקן פג תוקפו. בקש אימות חדש' },
        { status: 400 }
      );
    }

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, full_name, email, email_verified')
      .eq('id', authToken.userId)
      .maybeSingle();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'לקוח לא נמצא' },
        { status: 404 }
      );
    }

    if (client.email_verified) {
      return NextResponse.json({
        success: true,
        message: 'האימייל כבר מאומת',
        alreadyVerified: true,
      });
    }

    const { error: updateError } = await supabase
      .from('clients')
      .update({ email_verified: true })
      .eq('id', client.id);

    if (updateError) {
      console.error('[verify-email] Error updating client:', updateError);
      return NextResponse.json(
        { error: 'שגיאה באימות האימייל' },
        { status: 500 }
      );
    }

    await markAuthTokenUsed(supabase, authToken.id);

    try {
      await emailService.sendWelcome(client.email, client.full_name);
    } catch (emailError) {
      console.error('[verify-email] Error sending welcome email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'האימייל אומת בהצלחה! כעת תוכל להתחבר לפורטל',
    });
  } catch (error) {
    console.error('[verify-email] Unexpected error:', error);
    return NextResponse.json(
      { error: 'שגיאה לא צפויה. נסה שוב מאוחר יותר' },
      { status: 500 }
    );
  }
}

/**
 * Resend verification email
 */
export async function PUT(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'חסרה כתובת אימייל' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    const { data: client } = await supabase
      .from('clients')
      .select('id, full_name, email, email_verified')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (!client) {
      return NextResponse.json({
        success: true,
        message: 'אם האימייל קיים במערכת, נשלח אליך אימייל חדש',
      });
    }

    if (client.email_verified) {
      return NextResponse.json({
        success: true,
        message: 'האימייל כבר מאומת',
      });
    }

    const verificationToken = randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 24);

    const tokenResult = await insertAuthToken(supabase, {
      userId: client.id,
      token: verificationToken,
      tokenType: 'email_verification',
      expiresAt: tokenExpiresAt.toISOString(),
    });

    if (!tokenResult.ok) {
      console.error('[verify-email] Error creating token:', tokenResult.error);
      return NextResponse.json(
        { error: 'שגיאה ביצירת טוקן אימות' },
        { status: 500 }
      );
    }

    await emailService.sendClientEmailVerification(
      client.email,
      verificationToken,
      client.full_name
    );

    return NextResponse.json({
      success: true,
      message: 'אימייל אימות נשלח בהצלחה',
    });
  } catch (error) {
    console.error('[verify-email] Resend error:', error);
    return NextResponse.json(
      { error: 'שגיאה לא צפויה' },
      { status: 500 }
    );
  }
}
