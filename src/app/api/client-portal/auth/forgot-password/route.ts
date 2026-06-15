/**
 * Client Forgot Password API
 * שכחת סיסמה ללקוחות
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/adminClient';
import { randomBytes } from 'crypto';
import { emailService } from '@/lib/email/emailService';
import { insertAuthToken } from '@/lib/auth/authTokens';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'חסרה כתובת אימייל' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Find client by email
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, full_name, email, portal_enabled')
      .eq('email', email.toLowerCase())
      .single();

    // Always return success to prevent email enumeration
    if (clientError || !client) {
      return NextResponse.json({
        success: true,
        message: 'אם האימייל קיים במערכת, נשלח אליך קישור לאיפוס סיסמה',
      });
    }

    // Check if portal is enabled
    if (!client.portal_enabled) {
      return NextResponse.json({
        success: true,
        message: 'אם האימייל קיים במערכת, נשלח אליך קישור לאיפוס סיסמה',
      });
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour

    const tokenResult = await insertAuthToken(supabase, {
      userId: client.id,
      token: resetToken,
      tokenType: 'password_reset',
      expiresAt: expiresAt.toISOString(),
    });

    if (!tokenResult.ok) {
      console.error('[client-forgot-password] Token error:', tokenResult.error);
      return NextResponse.json(
        { error: 'שגיאה ביצירת קישור איפוס' },
        { status: 500 }
      );
    }

    // Send password reset email
    try {
      await emailService.sendClientPasswordReset(
        client.email,
        resetToken,
        client.full_name
      );
    } catch (emailError) {
      console.error('[client-forgot-password] Email error:', emailError);
      // Continue anyway - don't reveal if email failed
    }

    return NextResponse.json({
      success: true,
      message: 'אם האימייל קיים במערכת, נשלח אליך קישור לאיפוס סיסמה',
    });
  } catch (error) {
    console.error('[client-forgot-password] Unexpected error:', error);
    return NextResponse.json(
      { error: 'שגיאה לא צפויה' },
      { status: 500 }
    );
  }
}
