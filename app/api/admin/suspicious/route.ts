import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const reviewed = searchParams.get("reviewed")

    let query = `
      SELECT 
        sa.*,
        w.name as worker_name,
        s.product_name,
        s.quantity,
        s.unit_price,
        s.total_amount,
        s.sale_datetime
      FROM suspicious_activities sa
      LEFT JOIN workers w ON sa.worker_id = w.id
      LEFT JOIN sales s ON sa.sale_id = s.id
    `

    if (reviewed === "false") {
      query += ` WHERE sa.reviewed = false`
    } else if (reviewed === "true") {
      query += ` WHERE sa.reviewed = true`
    }

    query += ` ORDER BY sa.created_at DESC LIMIT 100`

    const result = await sql.query(query)
    return NextResponse.json(result.rows || result)
  } catch (error) {
    console.error("Get suspicious activities error:", error)
    return NextResponse.json({ error: "Failed to fetch suspicious activities" }, { status: 500 })
  }
}
