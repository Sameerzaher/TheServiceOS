import { NextResponse } from "next/server";
import { buildDemoDataset } from "@/core/demo/demoSeed";
import { resolveTeacherIdFromRequest } from "@/lib/api/resolveTeacherId";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";
import {
  getSupabaseBusinessId,
  getSupabaseClientsTable,
  getSupabaseAppointmentsTable,
} from "@/core/config/supabaseEnv";

export const runtime = "nodejs";

const HE_ERR_UNAVAILABLE = "שירות הדמו אינו זמין כרגע.";
const HE_ERR_GENERIC = "אירעה שגיאה בטעינת הדמו.";

export async function POST(req: Request): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    console.error("[demo/load] Supabase not configured");
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_UNAVAILABLE },
      { status: 503 }
    );
  }

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();
    const teacherId = resolveTeacherIdFromRequest(req);

    const { clients, appointments } = buildDemoDataset(new Date(), teacherId);
    const clientsTable = getSupabaseClientsTable();
    const appointmentsTable = getSupabaseAppointmentsTable();

    // Insert clients
    const clientRows = clients.map((c) => ({
      id: c.id,
      business_id: businessId,
      teacher_id: teacherId,
      full_name: c.fullName,
      phone: c.phone,
      notes: c.notes,
      custom_fields: c.customFields,
      created_at: c.createdAt,
      updated_at: c.updatedAt,
    }));

    const { error: clientsError } = await supabase
      .from(clientsTable)
      .upsert(clientRows, { onConflict: "id" });

    if (clientsError) {
      console.error("[demo/load] Clients insert error:", clientsError);
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_GENERIC },
        { status: 500 }
      );
    }

    // Insert appointments
    const appointmentRows = appointments.map((a) => {
      // Ensure end_at is always after start_at
      const endAt = a.customFields?.bookingSlotEnd 
        ? a.customFields.bookingSlotEnd 
        : new Date(new Date(a.startAt).getTime() + 45 * 60 * 1000).toISOString();
      
      return {
        id: a.id,
        business_id: businessId,
        teacher_id: teacherId,
        client_id: a.clientId,
        start_at: a.startAt,
        end_at: endAt,
        status: a.status,
        payment_status: a.paymentStatus,
        amount: a.amount,
        custom_fields: a.customFields,
        created_at: a.createdAt,
        updated_at: a.updatedAt,
      };
    });

    const { error: appointmentsError } = await supabase
      .from(appointmentsTable)
      .upsert(appointmentRows, { onConflict: "id" });

    if (appointmentsError) {
      console.error("[demo/load] Appointments insert error:", appointmentsError);
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_GENERIC },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true as const,
      message: "Demo loaded successfully",
    });
  } catch (e) {
    console.error("[demo/load] Unexpected error:", e);
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_GENERIC },
      { status: 500 }
    );
  }
}
