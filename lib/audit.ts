import { sql } from "./db"

export async function logAudit(
  workerId: number | null,
  actionType: string,
  saleId: number | null = null,
  beforeData: Record<string, unknown> | null = null,
  afterData: Record<string, unknown> | null = null,
): Promise<void> {
  await sql`
    INSERT INTO audit_log (worker_id, action_type, sale_id, before_data, after_data)
    VALUES (${workerId}, ${actionType}, ${saleId}, ${JSON.stringify(beforeData)}, ${JSON.stringify(afterData)})
  `
}
