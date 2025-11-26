"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, AlertTriangle, AlertCircle, Loader2 } from "lucide-react"
import { formatDateTime } from "@/lib/timezone"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface SuspiciousActivity {
  id: number
  sale_id: number | null
  worker_id: number | null
  worker_name: string
  reason: string
  severity: "low" | "medium" | "high"
  reviewed: boolean
  created_at: string
  product_name?: string
  quantity?: number
  unit_price?: number
  total_amount?: number
  sale_datetime?: string
}

export function SuspiciousTab() {
  const [filter, setFilter] = useState("false")
  const [marking, setMarking] = useState<number | null>(null)

  const { data: activities, mutate } = useSWR<SuspiciousActivity[]>(`/api/admin/suspicious?reviewed=${filter}`, fetcher)

  const handleMarkReviewed = async (id: number) => {
    setMarking(id)
    try {
      await fetch(`/api/admin/suspicious/${id}`, { method: "PUT" })
      mutate()
    } finally {
      setMarking(null)
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <AlertCircle className="h-4 w-4 text-destructive" />
      case "medium":
        return <AlertTriangle className="h-4 w-4 text-chart-4" />
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getSeverityBadge = (severity: string) => {
    const colors = {
      high: "bg-destructive/10 text-destructive",
      medium: "bg-chart-4/10 text-chart-4",
      low: "bg-muted text-muted-foreground",
    }
    return colors[severity as keyof typeof colors] || colors.low
  }

  return (
    <Card className="border-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Suspicious Activities
        </CardTitle>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="false">Pending Review</SelectItem>
            <SelectItem value="true">Reviewed</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severity</TableHead>
                <TableHead>Worker</TableHead>
                <TableHead>Sale Details</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Detected</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities?.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(activity.severity)}
                      <span className={`px-2 py-1 text-xs font-medium ${getSeverityBadge(activity.severity)}`}>
                        {activity.severity.toUpperCase()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{activity.worker_name}</TableCell>
                  <TableCell>
                    {activity.product_name ? (
                      <div className="text-sm">
                        <p className="font-medium">{activity.product_name}</p>
                        <p className="text-muted-foreground">
                          Qty: {activity.quantity} × {activity.unit_price?.toLocaleString("en-TZ")} ={" "}
                          {activity.total_amount?.toLocaleString("en-TZ")}
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-sm truncate" title={activity.reason}>
                      {activity.reason}
                    </p>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{formatDateTime(activity.created_at)}</TableCell>
                  <TableCell className="text-center">
                    {activity.reviewed ? (
                      <span className="flex items-center justify-center gap-1 text-secondary">
                        <CheckCircle className="h-4 w-4" />
                        Reviewed
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkReviewed(activity.id)}
                        disabled={marking === activity.id}
                      >
                        {marking === activity.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark Reviewed"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {(!activities || activities.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No suspicious activities found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
