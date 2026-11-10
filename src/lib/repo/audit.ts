import { createDoc } from "./base";

/**
 * Catatan audit mutasi penting (collection audit_log). Kegagalan menulis
 * audit TIDAK boleh menggagalkan mutasi utamanya — cukup ditelan.
 * (Collection ai_usage disiapkan untuk tahap Telegram/AI berikutnya;
 * belum ada penulisnya di MVP ini.)
 */
export async function recordAudit(input: {
  memberId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  detail?: unknown;
}): Promise<void> {
  try {
    await createDoc("audit_log", {
      memberId: input.memberId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      detail: input.detail ?? null,
    });
  } catch {
    // Abaikan — audit bersifat best-effort.
  }
}
