/**
 * Accept Client Invitation API
 * קבלת הזמנה לפורטל ואיפוס סיסמה
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/adminClient';
import { hashClientPassword } from '@/lib/auth/clientAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    // Find invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('client_invitations')
      .select('*')
      .eq('invitation_token', token)
      .single();

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'הזמנה לא נמצאה או פג תוקפה' },
        { status: 404 }
      );
    }

    // Check if already accepted
    if (invitation.accepted_at) {
      return NextResponse.json(
        { error: 'ההזמנה כבר נעשה בה שימוש' },
        { status: 400 }
      );
    }

    // Check expiration
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'ההזמנה פגה תוקף' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = hashClientPassword(password);

    // Update client with email and password
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        email: invitation.email.toLowerCase(),
        password_hash: passwordHash,
        email_verified: true, // Auto-verify since they received the invitation
        portal_enabled: true,
      })
      .eq('id', invitation.client_id);

    if (updateError) {
      console.error('[accept-invitation] Error updating client:', updateError);
      return NextResponse.json(
        { error: 'שגיאה בעדכון פרטי לקוח' },
        { status: 500 }
      );
    }

    // Mark invitation as accepted
    await supabase
      .from('client_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id);

    return NextResponse.json({
      success: true,
      message: 'ההזמנה התקבלה בהצלחה! כעת תוכל להתחבר',
    });
  } catch (error) {
    console.error('[accept-invitation] Unexpected error:', error);
    return NextResponse.json(
      { error: 'שגיאה לא צפויה' },
      { status: 500 }
    );
  }
}

/**
 * GET - Validate invitation token and get details
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'חסר טוקן' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    const { data: invitation, error } = await supabase
      .from('client_invitations')
      .select(`
        id,
        email,
        expires_at,
        accepted_at,
        clients (
          id,
          full_name
        ),
        teachers (
          full_name
        )
      `)
      .eq('invitation_token', token)
      .single();

    if (error || !invitation) {
      return NextResponse.json(
        { error: 'הזמנה לא נמצאה' },
        { status: 404 }
      );
    }

    // Check if already accepted
    if (invitation.accepted_at) {
      return NextResponse.json(
        { error: 'ההזמנה כבר נעשה בה שימוש', alreadyAccepted: true },
        { status: 400 }
      );
    }

    // Check expiration
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'ההזמנה פגה תוקף', expired: true },
        { status: 400 }
      );
    }

    const client = Array.isArray(invitation.clients)
      ? invitation.clients[0]
      : invitation.clients;
    const teacher = Array.isArray(invitation.teachers)
      ? invitation.teachers[0]
      : invitation.teachers;

    return NextResponse.json({
      valid: true,
      invitation: {
        clientName: client?.full_name ?? null,
        teacherName: teacher?.full_name ?? null,
        email: invitation.email,
      },
    });
  } catch (error) {
    console.error('[accept-invitation] GET error:', error);
    return NextResponse.json(
      { error: 'שגיאה לא צפויה' },
      { status: 500 }
    );
  }
}
