import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { getSupabaseBusinessId } from "@/core/config/supabaseEnv";

interface AuditLogEntry {
  businessId: string;
  teacherId: string;
  actorTeacherId?: string;
  action: "create" | "update" | "delete" | "approve" | "reject";
  entityType: "appointment" | "client" | "teacher" | "settings" | "booking_settings" | "blocked_date";
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient();
    const now = new Date().toISOString();

    await supabase.from("audit_log").insert({
      business_id: entry.businessId,
      teacher_id: entry.teacherId,
      actor_teacher_id: entry.actorTeacherId || null,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId || null,
      old_values: entry.oldValues || null,
      new_values: entry.newValues || null,
      metadata: entry.metadata || null,
      created_at: now,
    });

    console.log("[audit] Logged action:", entry.action, entry.entityType);
  } catch (e) {
    console.error("[audit] Failed to log:", e);
  }
}

export function createAuditLogger(teacherId: string, actorTeacherId?: string) {
  const businessId = getSupabaseBusinessId();
  
  return {
    logCreate: (entityType: AuditLogEntry["entityType"], entityId: string, newValues: Record<string, unknown>) =>
      logAudit({ businessId, teacherId, actorTeacherId, action: "create", entityType, entityId, newValues }),
    
    logUpdate: (entityType: AuditLogEntry["entityType"], entityId: string, oldValues: Record<string, unknown>, newValues: Record<string, unknown>) =>
      logAudit({ businessId, teacherId, actorTeacherId, action: "update", entityType, entityId, oldValues, newValues }),
    
    logDelete: (entityType: AuditLogEntry["entityType"], entityId: string, oldValues: Record<string, unknown>) =>
      logAudit({ businessId, teacherId, actorTeacherId, action: "delete", entityType, entityId, oldValues }),
    
    logApprove: (entityType: AuditLogEntry["entityType"], entityId: string) =>
      logAudit({ businessId, teacherId, actorTeacherId, action: "approve", entityType, entityId }),
    
    logReject: (entityType: AuditLogEntry["entityType"], entityId: string) =>
      logAudit({ businessId, teacherId, actorTeacherId, action: "reject", entityType, entityId }),
  };
}
