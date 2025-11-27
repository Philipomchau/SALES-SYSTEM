import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)

    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const workerId = searchParams.get("workerId")
    const actionType = searchParams.get("actionType")

    let query = `
      SELECT al.*, w.name as worker_name
      FROM audit_logs al
      LEFT JOIN workers w ON al.worker_id = w.id
      WHERE 1=1
    `
    const params: (string | number)[] = []

    if (startDate) {
      query += ` AND al.timestamp >= $${params.length + 1}`
      params.push(startDate)
    }
    if (endDate) {
      query += ` AND al.timestamp <= $${params.length + 1}`
      params.push(endDate)
    }
    if (workerId && workerId !== "all") {
      query += ` AND al.worker_id = $${params.length + 1}`
      params.push(Number.parseInt(workerId))
    }
    if (actionType && actionType !== "all") {
      query += ` AND al.action_type = $${params.length + 1}`
      params.push(actionType)
    }

    query += ` ORDER BY al.timestamp DESC LIMIT 500`

    // @ts-ignore
    const result = await sql.query(query, params)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Get audit log error:", error)
    return NextResponse.json({ error: "Failed to fetch audit log" }, { status: 500 })
  }
}
