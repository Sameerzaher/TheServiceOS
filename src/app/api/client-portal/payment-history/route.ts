/**
 * Client Payment History API
 * היסטוריית תשלומים ללקוחות
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/adminClient';
import { attachTeachers } from '@/lib/client-portal/appointmentsWithTeachers';

/**
 * GET - Get client's payment history
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

    // Get client's appointments with payment info
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        start_at,
        end_at,
        amount,
        payment_status,
        payment_method,
        created_at,
        teacher_id
      `)
      .eq('client_id', session.client_id)
      .neq('status', 'canceled')
      .gt('amount', 0)
      .order('start_at', { ascending: false });

    if (error) {
      console.error('[payment-history] Error:', error);
      return NextResponse.json(
        { error: 'שגיאה בטעינת היסטוריית תשלומים' },
        { status: 500 }
      );
    }

    const withTeachers = await attachTeachers(supabase, appointments ?? []);

    // Calculate statistics
    const totalPaid = withTeachers
      .filter((a) => a.payment_status === 'paid')
      .reduce((sum, a) => sum + (a.amount || 0), 0);

    const totalPending = withTeachers
      .filter((a) => a.payment_status !== 'paid')
      .reduce((sum, a) => sum + (a.amount || 0), 0);

    return NextResponse.json({
      appointments: withTeachers,
      statistics: {
        totalPaid,
        totalPending,
        totalPayments: withTeachers.length,
      },
    });
  } catch (error) {
    console.error('[payment-history] Unexpected error:', error);
    return NextResponse.json(
      { error: 'שגיאה לא צפויה' },
      { status: 500 }
    );
  }
}
