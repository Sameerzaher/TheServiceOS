/**
 * Client Email Verification API
 * אימות אימייל ללקוחות
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/core/config/supabaseClient';
import { emailService } from '@/lib/email/emailService';

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

    // Find the token
    const { data: authToken, error: tokenError } = await supabase
      .from('auth_tokens')
      .select('*')
      .eq('token', token)
      .eq('token_type', 'email_verification')
      .single();

    if (tokenError || !authToken) {
      return NextResponse.json(
        { error: 'טוקן אימות לא תקין או פג תוקפו' },
        { status: 400 }
      );
    }

    // Check if already used
    if (authToken.used_at) {
      return NextResponse.json(
        { error: 'הטוקן כבר נעשה בו שימוש' },
        { status: 400 }
      );
    }

    // Check expiration
    if (new Date(authToken.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'הטוקן פג תוקפו. בקש אימות חדש' },
        { status: 400 }
      );
    }

    // Get client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, full_name, email, email_verified')
      .eq('id', authToken.user_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'לקוח לא נמצא' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (client.email_verified) {
      return NextResponse.json({
        success: true,
        message: 'האימייל כבר מאומת',
        alreadyVerified: true,
      });
    }

    // Mark email as verified
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        email_verified: true,
      })
      .eq('id', client.id);

    if (updateError) {
      console.error('[verify-email] Error updating client:', updateError);
      return NextResponse.json(
        { error: 'שגיאה באימות האימייל' },
        { status: 500 }
      );
    }

    // Mark token as used
    await supabase
      .from('auth_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', authToken.id);

    // Send welcome email
    try {
      await emailService.sendWelcome(client.email, client.full_name);
    } catch (emailError) {
      console.error('[verify-email] Error sending welcome email:', emailError);
      // Continue anyway
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

    // Find client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, full_name, email, email_verified')
      .eq('email', email.toLowerCase())
      .single();

    if (clientError || !client) {
      // Don't reveal if email exists
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

    // Generate new token
    const { randomBytes } = await import('crypto');
    const verificationToken = randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 24);

    // Store new token
    const { error: tokenError } = await supabase
      .from('auth_tokens')
      .insert({
        token: verificationToken,
        token_type: 'email_verification',
        user_id: client.id,
        expires_at: tokenExpiresAt.toISOString(),
      });

    if (tokenError) {
      console.error('[verify-email] Error creating token:', tokenError);
      return NextResponse.json(
        { error: 'שגיאה ביצירת טוקן אימות' },
        { status: 500 }
      );
    }

    // Send email
    await emailService.sendEmailVerification(
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
