import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)

    const format = searchParams.get("format") || "csv"
    const dataType = searchParams.get("dataType") || "sales"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    let data: Record<string, unknown>[] = []
    let dateFilter = ""
    const params: string[] = []

    if (startDate) {
      dateFilter += ` AND sale_datetime >= $${params.length + 1}`
      params.push(startDate)
    }
    if (endDate) {
      dateFilter += ` AND sale_datetime <= $${params.length + 1}`
      params.push(endDate)
    }

    if (dataType === "sales") {
      const query = `
        SELECT s.*, w.name as worker_name
        FROM sales s
        JOIN workers w ON s.worker_id = w.id
        WHERE 1=1 ${dateFilter}
        ORDER BY s.sale_datetime DESC
      `
      const result = await sql.query(query, params)
      data = result.rows || result
    }

    if (format === "csv") {
      if (data.length === 0) {
        return new NextResponse("No data to export", { status: 200 })
      }

      const headers = Object.keys(data[0])
      const csv = [headers.join(","), ...data.map((row) => headers.map((h) => `"${row[h] ?? ""}"`).join(","))].join(
        "\n",
      )

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename=${dataType}_export.csv`,
        },
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 })
  }
}
