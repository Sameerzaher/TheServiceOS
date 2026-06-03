import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/adminClient';
import { emailService } from '@/lib/email/emailService';
import { isValidEmail } from '@/lib/auth/passwordUtils';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { email } = body;

    // Validate email
    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: 'כתובת אימייל לא תקינה' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Find teacher by email
    const { data: teacher, error: findError } = await supabase
      .from('teachers')
      .select('id, email, full_name')
      .eq('email', email.toLowerCase().trim())
      .single();

    // Always return success to prevent email enumeration
    // (don't reveal if email exists or not)
    if (findError || !teacher) {
      console.log('[forgot-password] Teacher not found:', email);
      return NextResponse.json({
        ok: true,
        message: 'אם האימייל קיים במערכת, נשלח אליו קישור לאיפוס סיסמה',
      });
    }

    // Generate secure reset token
    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Valid for 1 hour

    // Store token in database
    const { error: tokenError } = await supabase
      .from('auth_tokens')
      .insert({
        user_id: teacher.id,
        token: resetToken,
        token_type: 'password_reset',
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error('[forgot-password] Token creation error:', tokenError);
      return NextResponse.json(
        { ok: false, error: 'שגיאה ביצירת טוקן איפוס' },
        { status: 500 }
      );
    }

    // Send email
    const emailSent = await emailService.sendPasswordReset(
      teacher.email,
      resetToken,
      teacher.full_name
    );

    if (!emailSent) {
      console.error('[forgot-password] Failed to send email to:', teacher.email);
      // Don't fail the request if email fails - token is still valid
    }

    console.log('[forgot-password] Password reset requested:', {
      email: teacher.email,
      tokenCreated: true,
      emailSent,
    });

    return NextResponse.json({
      ok: true,
      message: 'אם האימייל קיים במערכת, נשלח אליו קישור לאיפוס סיסמה',
    });
  } catch (error) {
    console.error('[forgot-password] Unexpected error:', error);
    return NextResponse.json(
      { ok: false, error: 'שגיאה בעיבוד הבקשה' },
      { status: 500 }
    );
  }
}
