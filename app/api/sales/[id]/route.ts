import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { checkForSuspiciousActivity, recordSuspiciousActivity } from "@/lib/suspicion"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    const saleId = Number.parseInt(id)
    const updates = await request.json()

    // Get existing sale for audit
    const existing = await sql`SELECT * FROM sales WHERE id = ${saleId}`
    if (existing.length === 0) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

    const beforeData = existing[0]
    const total_amount = (updates.quantity || beforeData.quantity) * (updates.unit_price || beforeData.unit_price)

    const result = await sql`
      UPDATE sales SET
        product_name = ${updates.product_name || beforeData.product_name},
        quantity = ${updates.quantity || beforeData.quantity},
        unit_price = ${updates.unit_price || beforeData.unit_price},
        total_amount = ${total_amount},
        notes = ${updates.notes !== undefined ? updates.notes : beforeData.notes},
        updated_at = NOW() AT TIME ZONE 'Africa/Dar_es_Salaam'
      WHERE id = ${saleId}
      RETURNING *
    `

    const sale = result[0]

    // Check for new suspicious activity
    const suspicions = await checkForSuspiciousActivity(sale, sale.worker_id)
    for (const suspicion of suspicions) {
      await recordSuspiciousActivity(sale.id, sale.worker_id, suspicion.reason, suspicion.severity)
    }

    // Log audit with before/after
    await logAudit(admin.id, "UPDATE_SALE", saleId, beforeData, sale)

    return NextResponse.json(sale)
  } catch (error) {
    console.error("Update sale error:", error)
    return NextResponse.json({ error: "Failed to update sale" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    const saleId = Number.parseInt(id)

    // Get existing sale for audit
    const existing = await sql`SELECT * FROM sales WHERE id = ${saleId}`
    if (existing.length === 0) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

    await sql`DELETE FROM sales WHERE id = ${saleId}`

    // Log audit
    await logAudit(admin.id, "DELETE_SALE", saleId, existing[0], null)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete sale error:", error)
    return NextResponse.json({ error: "Failed to delete sale" }, { status: 500 })
  }
}
