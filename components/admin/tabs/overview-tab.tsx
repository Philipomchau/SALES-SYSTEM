"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, Users, Package, DollarSign } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface ReportData {
  summary: {
    total_sales: string
    total_revenue: string
    total_quantity: string
    active_workers: string
    unique_products: string
  }
  topProducts: Array<{
    product_name: string
    total_quantity: string
    total_revenue: string
    sale_count: string
  }>
  workerPerformance: Array<{
    id: number
    name: string
    total_sales: string
    total_revenue: string
    avg_sale_value: string
  }>
}

export function OverviewTab() {
  const { data: reports } = useSWR<ReportData>("/api/admin/reports?type=summary", fetcher)
  const { data: suspicious } = useSWR<Array<{ id: number }>>("/api/admin/suspicious?reviewed=false", fetcher)

  const summary = reports?.summary
  const topProducts = reports?.topProducts || []
  const workerPerformance = reports?.workerPerformance || []

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              TZS {Number.parseFloat(summary?.total_revenue || "0").toLocaleString("en-TZ")}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total_sales || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Workers</CardTitle>
            <Users className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.active_workers || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Alerts</CardTitle>
            <Package className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{suspicious?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.slice(0, 5).map((product, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{product.product_name}</TableCell>
                    <TableCell className="text-right">{product.total_quantity}</TableCell>
                    <TableCell className="text-right text-primary">
                      {Number.parseFloat(product.total_revenue).toLocaleString("en-TZ")}
                    </TableCell>
                  </TableRow>
                ))}
                {topProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle>Worker Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workerPerformance.slice(0, 5).map((worker) => (
                  <TableRow key={worker.id}>
                    <TableCell className="font-medium">{worker.name}</TableCell>
                    <TableCell className="text-right">{worker.total_sales}</TableCell>
                    <TableCell className="text-right text-primary">
                      {Number.parseFloat(worker.total_revenue).toLocaleString("en-TZ")}
                    </TableCell>
                  </TableRow>
                ))}
                {workerPerformance.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
