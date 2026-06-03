import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/adminClient';
import { verifyClientPassword, createSessionToken } from '@/lib/auth/clientAuth';
import { isValidEmail } from '@/lib/auth/passwordUtils';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: 'אימייל וסיסמה נדרשים' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: 'אימייל לא תקין' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Find client by email
    const { data: client, error: findError } = await supabase
      .from('clients')
      .select('id, full_name, email, phone, password_hash, portal_enabled, email_verified')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (findError || !client) {
      console.log('[client-portal/login] Client not found:', email);
      return NextResponse.json(
        { ok: false, error: 'אימייל או סיסמה שגויים' },
        { status: 401 }
      );
    }

    // Check if portal is enabled
    if (!client.portal_enabled) {
      return NextResponse.json(
        { ok: false, error: 'הגישה לפורטל לא מאופשרת. פנה לספק השירות.' },
        { status: 403 }
      );
    }

    // Check if email is verified
    if (!client.email_verified) {
      return NextResponse.json(
        { ok: false, error: 'אנא אמת את האימייל שלך לפני ההתחברות' },
        { status: 403 }
      );
    }

    // Check if client has a password
    if (!client.password_hash) {
      return NextResponse.json(
        { ok: false, error: 'לא הוגדרה סיסמה. השתמש בקישור ההזמנה לקבלת גישה.' },
        { status: 401 }
      );
    }

    // Verify password
    const passwordValid = verifyClientPassword(password, client.password_hash);
    
    if (!passwordValid) {
      console.log('[client-portal/login] Invalid password for:', email);
      return NextResponse.json(
        { ok: false, error: 'אימייל או סיסמה שגויים' },
        { status: 401 }
      );
    }

    // Create session
    const { token, expiresAt } = createSessionToken();

    const { data: session, error: sessionError } = await supabase
      .from('client_sessions')
      .insert({
        client_id: client.id,
        token,
        expires_at: expiresAt.toISOString(),
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent'),
      })
      .select()
      .single();

    if (sessionError) {
      console.error('[client-portal/login] Session creation error:', sessionError);
      return NextResponse.json(
        { ok: false, error: 'שגיאה ביצירת סשן' },
        { status: 500 }
      );
    }

    // Update last login
    await supabase
      .from('clients')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', client.id);

    console.log('[client-portal/login] Login successful:', {
      clientId: client.id,
      email: client.email,
    });

    // Create response with cookie
    const response = NextResponse.json({
      ok: true,
      client: {
        id: client.id,
        fullName: client.full_name,
        email: client.email,
        phone: client.phone,
        emailVerified: client.email_verified,
      },
      session: {
        token,
        expiresAt: expiresAt.toISOString(),
      },
    });

    // Set cookie
    response.cookies.set('client_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[client-portal/login] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'שגיאה בהתחברות' },
      { status: 500 }
    );
  }
}
