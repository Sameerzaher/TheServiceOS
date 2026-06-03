/**
 * Client Signup API
 * הרשמה ללקוחות בפורטל
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/core/config/supabaseClient';
import { hashClientPassword, isValidClientEmail } from '@/lib/auth/clientAuth';
import { randomBytes } from 'crypto';
import { emailService } from '@/lib/email/emailService';

export async function POST(request: NextRequest) {
  try {
    const { fullName, email, phone, password } = await request.json();

    // Validate required fields
    if (!fullName || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'כל השדות חובה' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidClientEmail(email)) {
      return NextResponse.json(
        { error: 'כתובת אימייל לא תקינה' },
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

    // Check if email already exists
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingClient) {
      return NextResponse.json(
        { error: 'כתובת האימייל כבר רשומה במערכת' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = hashClientPassword(password);

    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 24); // 24 hours

    // Create client account
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        full_name: fullName,
        email: email.toLowerCase(),
        phone,
        password_hash: passwordHash,
        email_verified: false,
        portal_enabled: true,
      })
      .select('id, full_name, email')
      .single();

    if (clientError) {
      console.error('[client-signup] Error creating client:', clientError);
      return NextResponse.json(
        { error: 'שגיאה ביצירת חשבון. נסה שוב מאוחר יותר' },
        { status: 500 }
      );
    }

    // Store verification token in auth_tokens table
    const { error: tokenError } = await supabase
      .from('auth_tokens')
      .insert({
        token: verificationToken,
        token_type: 'email_verification',
        user_id: client.id,
        expires_at: tokenExpiresAt.toISOString(),
      });

    if (tokenError) {
      console.error('[client-signup] Error creating verification token:', tokenError);
      // Continue anyway - we can send verification later
    }

    // Send verification email
    try {
      await emailService.sendEmailVerification(
        client.email,
        verificationToken,
        client.full_name
      );
    } catch (emailError) {
      console.error('[client-signup] Error sending verification email:', emailError);
      // Continue anyway - user can request resend
    }

    return NextResponse.json({
      success: true,
      message: 'החשבון נוצר בהצלחה! נשלח אליך אימייל לאימות הכתובת',
      client: {
        id: client.id,
        fullName: client.full_name,
        email: client.email,
      },
    });
  } catch (error) {
    console.error('[client-signup] Unexpected error:', error);
    return NextResponse.json(
      { error: 'שגיאה לא צפויה. נסה שוב מאוחר יותר' },
      { status: 500 }
    );
  }
}
