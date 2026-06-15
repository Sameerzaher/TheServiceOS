/**
 * Client Signup API
 * הרשמה ללקוחות בפורטל
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, randomUUID } from 'crypto';
import { getSupabaseAdminClient } from '@/lib/supabase/adminClient';
import { hashClientPassword, isValidClientEmail } from '@/lib/auth/clientAuth';
import { emailService } from '@/lib/email/emailService';
import { insertAuthToken } from '@/lib/auth/authTokens';
import {
  getSupabaseBusinessId,
  getSupabaseDefaultTeacherId,
} from '@/core/config/supabaseEnv';

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
      .maybeSingle();

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

    const now = new Date().toISOString();

    // Create client account (scoped to default business/teacher for MVP portal signup)
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        id: randomUUID(),
        business_id: getSupabaseBusinessId(),
        teacher_id: getSupabaseDefaultTeacherId(),
        full_name: fullName,
        email: email.toLowerCase(),
        phone,
        password_hash: passwordHash,
        email_verified: false,
        portal_enabled: true,
        notes: '',
        custom_fields: {},
        created_at: now,
        updated_at: now,
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

    const tokenResult = await insertAuthToken(supabase, {
      userId: client.id,
      token: verificationToken,
      tokenType: 'email_verification',
      expiresAt: tokenExpiresAt.toISOString(),
    });

    if (!tokenResult.ok) {
      console.error('[client-signup] Error creating verification token:', tokenResult.error);
      return NextResponse.json(
        {
          error:
            'החשבון נוצר אך אימות האימייל נכשל. הרץ migration 019_auth_tokens_user_id ב-Supabase ונסה שוב.',
        },
        { status: 500 }
      );
    }

    // Send verification email
    try {
      await emailService.sendClientEmailVerification(
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
