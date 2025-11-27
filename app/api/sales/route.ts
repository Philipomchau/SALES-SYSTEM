import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { checkForSuspiciousActivity, updatePriceHistory, recordSuspiciousActivity } from "@/lib/suspicion"

export async function GET(request: NextRequest) {
  try {
    const worker = await requireAuth()
    const { searchParams } = new URL(request.url)

    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const workerId = searchParams.get("workerId")
    const product = searchParams.get("product")

    let query = `
      SELECT s.*, w.name as worker_name 
      FROM sales s 
      JOIN workers w ON s.worker_id = w.id 
      WHERE 1=1
    `
    const params: (string | number)[] = []

    // Workers can only see their own sales
    if (worker.role === "worker") {
      query += ` AND s.worker_id = $${params.length + 1}`
      params.push(worker.id)
    } else if (workerId) {
      query += ` AND s.worker_id = $${params.length + 1}`
      params.push(Number.parseInt(workerId))
    }

    if (startDate) {
      query += ` AND s.sale_datetime >= $${params.length + 1}`
      params.push(startDate)
    }

    if (endDate) {
      query += ` AND s.sale_datetime <= $${params.length + 1}`
      params.push(endDate)
    }

    if (product) {
      query += ` AND LOWER(s.product_name) LIKE LOWER($${params.length + 1})`
      params.push(`%${product}%`)
    }

    query += ` ORDER BY s.sale_datetime DESC LIMIT 500`

    const result = await sql.query(query, params)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Get sales error:", error)
    return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const worker = await requireAuth()
    const { product_name, quantity, unit_price, notes, unit_type, client_id, sale_datetime } = await request.json()

    if (!product_name || !quantity || !unit_price) {
      return NextResponse.json({ error: "Product name, quantity, and unit price are required" }, { status: 400 })
    }

    const total_amount = quantity * unit_price
    const saleDate = sale_datetime ? new Date(sale_datetime).toISOString() : new Date().toISOString()

    const result = await sql`
      INSERT INTO sales (worker_id, product_name, quantity, unit_price, total_amount, notes, unit_type, client_id, sale_datetime)
      VALUES (${worker.id}, ${product_name}, ${quantity}, ${unit_price}, ${total_amount}, ${notes || null}, ${unit_type || 'piece'}, ${client_id || null}, ${saleDate})
      RETURNING *
    `

    const sale = result[0] as unknown as import("@/lib/db").Sale

    // Execute auxiliary tasks in parallel
    // Execute auxiliary tasks in parallel, but don't block/fail the response
    try {
      await Promise.all([
        updatePriceHistory(product_name, unit_price),
        checkForSuspiciousActivity(sale, worker.id).then(async (suspicions) => {
          if (suspicions.length > 0) {
            await Promise.all(
              suspicions.map((suspicion) =>
                recordSuspiciousActivity(sale.id, worker.id, suspicion.reason, suspicion.severity),
              ),
            )
          }
        }),
        logAudit(worker.id, "CREATE_SALE", sale.id, null, sale),
      ])
    } catch (error) {
      console.error("Auxiliary task error (non-fatal):", error)
    }

    return NextResponse.json(sale, { status: 201 })
  } catch (error) {
    console.error("Create sale error:", error)
    return NextResponse.json({ error: "Failed to create sale" }, { status: 500 })
  }
}
