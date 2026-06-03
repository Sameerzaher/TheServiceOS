/**
 * Client Invitations API (for teachers)
 * הזמנות ללקוחות להצטרף לפורטל
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/adminClient';
import { generateInvitationToken } from '@/lib/auth/clientAuth';

interface InvitationEmailData {
  to: string;
  clientName: string;
  teacherName: string;
  invitationUrl: string;
}

async function sendInvitationEmail(data: InvitationEmailData): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 הוזמנת לפורטל לקוחות</h1>
    </div>
    <div class="content">
      <p>שלום ${data.clientName},</p>
      <p>${data.teacherName} הזמין אותך להצטרף לפורטל הלקוחות של ServiceOS!</p>
      <p>בפורטל תוכל:</p>
      <ul>
        <li>לצפות בתורים שלך</li>
        <li>לקבוע תורים חדשים</li>
        <li>לבטל או לשנות תורים</li>
        <li>לעקוב אחר תשלומים</li>
      </ul>
      <center>
        <a href="${data.invitationUrl}" class="button">הצטרף עכשיו</a>
      </center>
      <p>או העתק והדבק את הקישור הזה בדפדפן:</p>
      <p style="background: white; padding: 10px; border-radius: 4px; word-break: break-all;">${data.invitationUrl}</p>
      <p style="color: #f59e0b;">⚠️ ההזמנה תקפה ל-7 ימים</p>
    </div>
    <div class="footer">
      <p>ServiceOS - מערכת ניהול עסקית חכמה</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const emailProvider = process.env.EMAIL_PROVIDER || 'console';
  
  if (emailProvider === 'console') {
    console.log('\n📧 ═══════════════════════════════════════════════');
    console.log('📧 Client Invitation Email (Development Mode)');
    console.log('📧 ═══════════════════════════════════════════════');
    console.log(`To: ${data.to}`);
    console.log(`Subject: ${data.teacherName} הזמין אותך לפורטל לקוחות`);
    console.log(`Invitation URL: ${data.invitationUrl}`);
    console.log('═══════════════════════════════════════════════\n');
    return true;
  }

  // Use real email service
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'noreply@serviceos.com',
        to: data.to,
        subject: `${data.teacherName} הזמין אותך לפורטל לקוחות`,
        html,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('[invitation-email] Error:', error);
    return false;
  }
}

/**
 * POST - Send invitation to client
 */
export async function POST(request: NextRequest) {
  try {
    const { clientId, teacherId } = await request.json();

    if (!clientId || !teacherId) {
      return NextResponse.json(
        { error: 'חסרים פרטים נדרשים' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Get client details
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, full_name, email, phone, email_verified, portal_enabled')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'לקוח לא נמצא' },
        { status: 404 }
      );
    }

    // Check if client already has portal access
    if (client.email && client.email_verified) {
      return NextResponse.json(
        { error: 'ללקוח כבר יש גישה לפורטל' },
        { status: 400 }
      );
    }

    // Get teacher details
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id, full_name')
      .eq('id', teacherId)
      .single();

    if (teacherError || !teacher) {
      return NextResponse.json(
        { error: 'מורה לא נמצא' },
        { status: 404 }
      );
    }

    // Check if there's already a pending invitation
    const { data: existingInvitation } = await supabase
      .from('client_invitations')
      .select('id')
      .eq('client_id', clientId)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'כבר נשלחה הזמנה פעילה ללקוח זה' },
        { status: 400 }
      );
    }

    // Determine email - use existing or phone as fallback
    let invitationEmail = client.email;
    if (!invitationEmail) {
      // Client doesn't have email, need to request it
      return NextResponse.json(
        { 
          error: 'ללקוח אין אימייל במערכת. אנא הוסף אימייל ללקוח תחילה',
          requiresEmail: true 
        },
        { status: 400 }
      );
    }

    // Generate invitation token
    const invitationToken = generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Create invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('client_invitations')
      .insert({
        client_id: clientId,
        teacher_id: teacherId,
        invitation_token: invitationToken,
        email: invitationEmail,
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single();

    if (invitationError) {
      console.error('[invitations] Error creating invitation:', invitationError);
      return NextResponse.json(
        { error: 'שגיאה ביצירת הזמנה' },
        { status: 500 }
      );
    }

    // Send invitation email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const invitationUrl = `${appUrl}/client-invitation?token=${invitationToken}`;

    const emailSent = await sendInvitationEmail({
      to: invitationEmail,
      clientName: client.full_name,
      teacherName: teacher.full_name,
      invitationUrl,
    });

    return NextResponse.json({
      success: true,
      message: 'ההזמנה נשלחה בהצלחה',
      invitation: {
        id: invitation.id,
        email: invitationEmail,
        expiresAt: expiresAt.toISOString(),
        emailSent,
      },
    });
  } catch (error) {
    console.error('[invitations] Unexpected error:', error);
    return NextResponse.json(
      { error: 'שגיאה לא צפויה' },
      { status: 500 }
    );
  }
}

/**
 * GET - Get pending invitations for a teacher
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');

    if (!teacherId) {
      return NextResponse.json(
        { error: 'חסר מזהה מורה' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    const { data: invitations, error } = await supabase
      .from('client_invitations')
      .select(`
        id,
        email,
        expires_at,
        accepted_at,
        created_at,
        clients (
          id,
          full_name,
          phone
        )
      `)
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[invitations] Error fetching:', error);
      return NextResponse.json(
        { error: 'שגיאה בטעינת הזמנות' },
        { status: 500 }
      );
    }

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('[invitations] Unexpected error:', error);
    return NextResponse.json(
      { error: 'שגיאה לא צפויה' },
      { status: 500 }
    );
  }
}
