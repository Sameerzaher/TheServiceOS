/**
 * Client Invoice Download API
 * הורדת חשבונית PDF ללקוחות
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/core/config/supabaseClient';

/**
 * GET - Generate and download invoice PDF (simplified HTML version)
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

    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get('appointmentId');

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'חסר מזהה תור' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Verify session
    const { data: session } = await supabase
      .from('client_sessions')
      .select('client_id, expires_at')
      .eq('token', sessionToken)
      .single();

    if (!session || new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'סשן לא תקין' },
        { status: 401 }
      );
    }

    // Get appointment with full details
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        id,
        start_at,
        end_at,
        amount,
        payment_status,
        payment_method,
        created_at,
        clients (
          full_name,
          email,
          phone
        ),
        teachers (
          full_name,
          business_name,
          phone,
          email
        )
      `)
      .eq('id', appointmentId)
      .eq('client_id', session.client_id)
      .single();

    if (error || !appointment) {
      return NextResponse.json(
        { error: 'תור לא נמצא' },
        { status: 404 }
      );
    }

    // Generate simple HTML invoice
    const invoiceDate = new Date(appointment.created_at).toLocaleDateString('he-IL');
    const appointmentDate = new Date(appointment.start_at).toLocaleDateString('he-IL');
    const appointmentTime = new Date(appointment.start_at).toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <title>חשבונית - ${appointment.id.substring(0, 8)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      background: white;
      color: #333;
    }
    .invoice {
      max-width: 800px;
      margin: 0 auto;
      border: 2px solid #333;
      padding: 40px;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #333;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 32px;
      margin-bottom: 10px;
    }
    .invoice-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .invoice-info div {
      flex: 1;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      border-bottom: 2px solid #333;
      padding-bottom: 5px;
      margin-bottom: 15px;
    }
    .info-row {
      margin-bottom: 8px;
      line-height: 1.6;
    }
    .info-row strong {
      display: inline-block;
      width: 120px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 30px 0;
    }
    .items-table th {
      background: #333;
      color: white;
      padding: 12px;
      text-align: right;
      border: 1px solid #333;
    }
    .items-table td {
      padding: 12px;
      border: 1px solid #333;
    }
    .total {
      text-align: left;
      font-size: 24px;
      font-weight: bold;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 3px solid #333;
    }
    .payment-status {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 20px;
      font-weight: bold;
      margin-right: 10px;
    }
    .paid {
      background: #d4edda;
      color: #155724;
    }
    .pending {
      background: #fff3cd;
      color: #856404;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ccc;
      color: #666;
      font-size: 12px;
    }
    @media print {
      body { padding: 0; }
      .invoice { border: none; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <h1>חשבונית</h1>
      <p>מספר: ${appointment.id.substring(0, 8).toUpperCase()}</p>
      <p>תאריך הפקה: ${invoiceDate}</p>
    </div>

    <div class="invoice-info">
      <div>
        <div class="section-title">מפרט עסק</div>
        <div class="info-row"><strong>שם עסק:</strong> ${appointment.teachers.business_name || appointment.teachers.full_name}</div>
        <div class="info-row"><strong>איש קשר:</strong> ${appointment.teachers.full_name}</div>
        <div class="info-row"><strong>טלפון:</strong> ${appointment.teachers.phone}</div>
        ${appointment.teachers.email ? `<div class="info-row"><strong>אימייל:</strong> ${appointment.teachers.email}</div>` : ''}
      </div>

      <div>
        <div class="section-title">פרטי לקוח</div>
        <div class="info-row"><strong>שם:</strong> ${appointment.clients.full_name}</div>
        <div class="info-row"><strong>טלפון:</strong> ${appointment.clients.phone}</div>
        ${appointment.clients.email ? `<div class="info-row"><strong>אימייל:</strong> ${appointment.clients.email}</div>` : ''}
      </div>
    </div>

    <div class="section-title">פירוט שירותים</div>
    <table class="items-table">
      <thead>
        <tr>
          <th>תיאור</th>
          <th>תאריך</th>
          <th>שעה</th>
          <th>סכום</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>שירות מקצועי</td>
          <td>${appointmentDate}</td>
          <td>${appointmentTime}</td>
          <td>₪${appointment.amount}</td>
        </tr>
      </tbody>
    </table>

    <div class="total">
      <div>
        סטטוס תשלום:
        <span class="payment-status ${appointment.payment_status === 'paid' ? 'paid' : 'pending'}">
          ${appointment.payment_status === 'paid' ? 'שולם' : 'ממתין לתשלום'}
        </span>
      </div>
      <div style="margin-top: 10px;">
        סה"כ לתשלום: ₪${appointment.amount}
      </div>
      ${appointment.payment_method ? `<div style="font-size: 16px; margin-top: 10px;">אמצעי תשלום: ${appointment.payment_method}</div>` : ''}
    </div>

    <div class="footer">
      <p>חשבונית זו הופקה אוטומטית על ידי מערכת ServiceOS</p>
      <p>תודה שבחרת בשירותים שלנו!</p>
    </div>
  </div>

  <script>
    // Auto-print on load (optional)
    // window.onload = () => window.print();
  </script>
</body>
</html>
    `.trim();

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="invoice-${appointment.id.substring(0, 8)}.html"`,
      },
    });
  } catch (error) {
    console.error('[invoice] Unexpected error:', error);
    return NextResponse.json(
      { error: 'שגיאה לא צפויה' },
      { status: 500 }
    );
  }
}
