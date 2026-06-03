/**
 * Client Profile API
 * עדכון פרופיל לקוח
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/core/config/supabaseClient';
import { hashClientPassword, verifyClientPassword, isValidClientEmail } from '@/lib/auth/clientAuth';

/**
 * GET - Get client profile
 */
export async function GET(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('client_session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'לא מחובר' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Find active session
    const { data: session, error: sessionError } = await supabase
      .from('client_sessions')
      .select('client_id, expires_at')
      .eq('token', sessionToken)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'סשן לא תקין' },
        { status: 401 }
      );
    }

    // Check expiration
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'הסשן פג תוקף' },
        { status: 401 }
      );
    }

    // Get client profile
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, full_name, email, phone, email_verified, portal_enabled')
      .eq('id', session.client_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'לקוח לא נמצא' },
        { status: 404 }
      );
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error('[client-profile] GET error:', error);
    return NextResponse.json(
      { error: 'שגיאה לא צפויה' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update client profile
 */
export async function PUT(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('client_session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'לא מחובר' },
        { status: 401 }
      );
    }

    const { fullName, email, phone, currentPassword, newPassword } = await request.json();

    const supabase = getSupabaseAdminClient();

    // Find active session
    const { data: session, error: sessionError } = await supabase
      .from('client_sessions')
      .select('client_id, expires_at')
      .eq('token', sessionToken)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'סשן לא תקין' },
        { status: 401 }
      );
    }

    // Check expiration
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'הסשן פג תוקף' },
        { status: 401 }
      );
    }

    // Get current client data
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, email, password_hash')
      .eq('id', session.client_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'לקוח לא נמצא' },
        { status: 404 }
      );
    }

    // Prepare update object
    const updates: any = {};

    // Update full name
    if (fullName && fullName !== '') {
      updates.full_name = fullName;
    }

    // Update email
    if (email && email !== client.email) {
      if (!isValidClientEmail(email)) {
        return NextResponse.json(
          { error: 'כתובת אימייל לא תקינה' },
          { status: 400 }
        );
      }

      // Check if email already exists
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('email', email.toLowerCase())
        .neq('id', client.id)
        .single();

      if (existingClient) {
        return NextResponse.json(
          { error: 'האימייל כבר קיים במערכת' },
          { status: 409 }
        );
      }

      updates.email = email.toLowerCase();
      updates.email_verified = false; // Need to re-verify
    }

    // Update phone
    if (phone && phone !== '') {
      updates.phone = phone;
    }

    // Update password
    if (newPassword) {
      // Verify current password
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'נדרשת סיסמה נוכחית לשינוי סיסמה' },
          { status: 400 }
        );
      }

      const isPasswordValid = verifyClientPassword(currentPassword, client.password_hash);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'הסיסמה הנוכחית שגויה' },
          { status: 400 }
        );
      }

      // Validate new password
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: 'הסיסמה החדשה חייבת להכיל לפחות 8 תווים' },
          { status: 400 }
        );
      }

      if (!/[A-Z]/.test(newPassword)) {
        return NextResponse.json(
          { error: 'הסיסמה חייבת להכיל לפחות אות גדולה אחת באנגלית' },
          { status: 400 }
        );
      }

      if (!/[a-z]/.test(newPassword)) {
        return NextResponse.json(
          { error: 'הסיסמה חייבת להכיל לפחות אות קטנה אחת באנגלית' },
          { status: 400 }
        );
      }

      if (!/[0-9]/.test(newPassword)) {
        return NextResponse.json(
          { error: 'הסיסמה חייבת להכיל לפחות ספרה אחת' },
          { status: 400 }
        );
      }

      updates.password_hash = hashClientPassword(newPassword);
    }

    // Check if there are any updates
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({
        success: true,
        message: 'אין שינויים לעדכון',
      });
    }

    // Update client
    const { error: updateError } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', client.id);

    if (updateError) {
      console.error('[client-profile] Update error:', updateError);
      return NextResponse.json(
        { error: 'שגיאה בעדכון פרופיל' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'הפרופיל עודכן בהצלחה',
      emailChanged: !!updates.email,
    });
  } catch (error) {
    console.error('[client-profile] PUT error:', error);
    return NextResponse.json(
      { error: 'שגיאה לא צפויה' },
      { status: 500 }
    );
  }
}
