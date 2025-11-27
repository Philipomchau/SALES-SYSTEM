import { sql, type Sale, type PriceHistory } from "./db"

export type SuspicionReason = {
  reason: string
  severity: "low" | "medium" | "high"
}

export async function checkForSuspiciousActivity(sale: Sale, workerId: number): Promise<SuspicionReason[]> {
  const suspicions: SuspicionReason[] = []

  // Execute independent checks in parallel
  const [priceHistory, avgQuantity, recentSales, workerStats] = await Promise.all([
    sql`SELECT * FROM price_history WHERE LOWER(product_name) = LOWER(${sale.product_name})`,
    sql`SELECT AVG(quantity) as avg_qty FROM sales WHERE LOWER(product_name) = LOWER(${sale.product_name})`,
    sql`SELECT COUNT(*) as count FROM sales WHERE worker_id = ${workerId} AND sale_datetime > NOW() - INTERVAL '5 minutes'`,
    sql`
      SELECT 
        w.id,
        COUNT(s.id) as sale_count
      FROM workers w
      LEFT JOIN sales s ON s.worker_id = w.id AND s.sale_datetime > NOW() - INTERVAL '7 days'
      WHERE w.role = 'worker'
      GROUP BY w.id
    `,
  ])

  // Check 1: Total amount is negative
  if (sale.total_amount < 0) {
    suspicions.push({
      reason: "Total amount is negative",
      severity: "high",
    })
  }

  // Check: High value transaction
  if (sale.total_amount > 500000) {
    suspicions.push({
      reason: `High value transaction: TZS ${sale.total_amount.toLocaleString()}`,
      severity: "medium",
    })
  }

  // Check 2: Unit price is far from typical range
  if (priceHistory.length > 0) {
    const history = priceHistory[0] as PriceHistory
    const priceDiff = Math.abs(sale.unit_price - history.avg_price)
    const threshold = history.avg_price * 0.5 // 50% deviation threshold

    if (sale.unit_price < history.min_price * 0.5) {
      suspicions.push({
        reason: `Unit price (${sale.unit_price}) is significantly lower than typical range (${history.min_price} - ${history.max_price})`,
        severity: "high",
      })
    } else if (priceDiff > threshold) {
      suspicions.push({
        reason: `Unit price deviates significantly from average (${history.avg_price.toFixed(2)})`,
        severity: "medium",
      })
    }
  }

  // Check 3: Unusually high quantity
  if (avgQuantity[0]?.avg_qty) {
    const avg = Number.parseFloat(avgQuantity[0].avg_qty)
    if (sale.quantity > avg * 5 && sale.quantity > 10) {
      suspicions.push({
        reason: `Quantity (${sale.quantity}) is unusually high compared to average (${avg.toFixed(1)})`,
        severity: "medium",
      })
    }
  }

  // Check 4: Multiple sales too close together
  if (Number.parseInt(recentSales[0]?.count || "0") > 5) {
    suspicions.push({
      reason: "Multiple sales submitted in quick succession (possible padding)",
      severity: "medium",
    })
  }

  // Check 5: Worker activity comparison
  const avgSales =
    workerStats.reduce((sum, w) => sum + Number.parseInt(w.sale_count || "0"), 0) / Math.max(workerStats.length, 1)
  const workerSales = workerStats.find((w) => w.id === workerId)

  if (workerSales && Number.parseInt(workerSales.sale_count) < avgSales * 0.2 && avgSales > 5) {
    suspicions.push({
      reason: "Worker has unusually low activity compared to others",
      severity: "low",
    })
  }

  return suspicions
}

export async function updatePriceHistory(productName: string, unitPrice: number): Promise<void> {
  await sql`
    INSERT INTO price_history (product_name, min_price, max_price, avg_price, sale_count)
    VALUES (${productName.toLowerCase()}, ${unitPrice}, ${unitPrice}, ${unitPrice}, 1)
    ON CONFLICT (product_name) DO UPDATE SET
      min_price = LEAST(price_history.min_price, ${unitPrice}),
      max_price = GREATEST(price_history.max_price, ${unitPrice}),
      avg_price = (price_history.avg_price * price_history.sale_count + ${unitPrice}) / (price_history.sale_count + 1),
      sale_count = price_history.sale_count + 1,
      last_updated = NOW() AT TIME ZONE 'Africa/Dar_es_Salaam'
  `
}

export async function recordSuspiciousActivity(
  saleId: number | null,
  workerId: number,
  reason: string,
  severity: "low" | "medium" | "high",
): Promise<void> {
  await sql`
    INSERT INTO suspicious_activity (sale_id, worker_id, reason, severity)
    VALUES (${saleId}, ${workerId}, ${reason}, ${severity})
  `
}
