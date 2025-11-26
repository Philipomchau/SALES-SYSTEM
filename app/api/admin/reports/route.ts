import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)

    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const reportType = searchParams.get("type") || "summary"

    let dateFilter = ""
    const params: string[] = []

    if (startDate) {
      dateFilter += ` AND s.sale_datetime >= $${params.length + 1}`
      params.push(startDate)
    }
    if (endDate) {
      dateFilter += ` AND s.sale_datetime <= $${params.length + 1}`
      params.push(endDate)
    }

    if (reportType === "summary") {
      const summaryQuery = `
        SELECT 
          COUNT(*) as total_sales,
          COALESCE(SUM(s.total_amount), 0) as total_revenue,
          COALESCE(SUM(s.quantity), 0) as total_quantity,
          COUNT(DISTINCT s.worker_id) as active_workers,
          COUNT(DISTINCT s.product_name) as unique_products
        FROM sales s
        WHERE 1=1 ${dateFilter}
      `
      const topProductsQuery = `
        SELECT 
          s.product_name,
          SUM(s.quantity) as total_quantity,
          SUM(s.total_amount) as total_revenue,
          COUNT(*) as sale_count
        FROM sales s
        WHERE 1=1 ${dateFilter}
        GROUP BY s.product_name
        ORDER BY total_revenue DESC
        LIMIT 10
      `
      const workerPerformanceQuery = `
        SELECT 
          w.id,
          w.name,
          COUNT(s.id) as total_sales,
          COALESCE(SUM(s.total_amount), 0) as total_revenue,
          COALESCE(AVG(s.total_amount), 0) as avg_sale_value
        FROM workers w
        LEFT JOIN sales s ON s.worker_id = w.id ${dateFilter ? `AND 1=1 ${dateFilter}` : ""}
        WHERE w.role = 'worker'
        GROUP BY w.id, w.name
        ORDER BY total_revenue DESC
      `
      const [summary, topProducts, workerPerformance] = await Promise.all([
        sql.query(summaryQuery, params),
        sql.query(topProductsQuery, params),
        sql.query(workerPerformanceQuery, params),
      ])

      return NextResponse.json({
        summary: summary[0],
        topProducts: topProducts,
        workerPerformance: workerPerformance,
      })
    }

    if (reportType === "daily") {
      const dailyQuery = `
        SELECT 
          DATE(s.sale_datetime AT TIME ZONE 'Africa/Dar_es_Salaam') as date,
          COUNT(*) as total_sales,
          SUM(s.total_amount) as total_revenue,
          SUM(s.quantity) as total_quantity
        FROM sales s
        WHERE 1=1 ${dateFilter}
        GROUP BY DATE(s.sale_datetime AT TIME ZONE 'Africa/Dar_es_Salaam')
        ORDER BY date DESC
        LIMIT 30
      `
      const daily = await sql.query(dailyQuery, params)
      return NextResponse.json(daily)
    }

    return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
  } catch (error) {
    console.error("Get reports error:", error)
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
  }
}
