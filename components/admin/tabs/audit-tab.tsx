"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Eye, FileText } from "lucide-react"
import { formatDateTime } from "@/lib/timezone"
import type { AuditLog, Worker } from "@/lib/db"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AuditTab() {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedWorker, setSelectedWorker] = useState("all")
  const [actionType, setActionType] = useState("all")
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const buildUrl = () => {
    const params = new URLSearchParams()
    if (startDate) params.set("startDate", new Date(startDate).toISOString())
    if (endDate) params.set("endDate", new Date(endDate).toISOString())
    if (selectedWorker !== "all") params.set("workerId", selectedWorker)
    if (actionType !== "all") params.set("actionType", actionType)
    return `/api/admin/audit?${params.toString()}`
  }

  const { data: logs } = useSWR<AuditLog[]>(buildUrl(), fetcher)
  const { data: workers } = useSWR<Worker[]>("/api/admin/workers", fetcher)

  const actionTypes = [
    "LOGIN",
    "LOGOUT",
    "CREATE_SALE",
    "UPDATE_SALE",
    "DELETE_SALE",
    "CREATE_WORKER",
    "UPDATE_WORKER",
    "DELETE_WORKER",
  ]

  const getActionBadge = (action: string) => {
    if (action.includes("DELETE")) return "bg-destructive/10 text-destructive"
    if (action.includes("CREATE")) return "bg-secondary/10 text-secondary"
    if (action.includes("UPDATE")) return "bg-accent/10 text-accent"
    return "bg-muted text-muted-foreground"
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Audit Log
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid gap-4 md:grid-cols-5">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>User</Label>
            <Select value={selectedWorker} onValueChange={setSelectedWorker}>
              <SelectTrigger>
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {workers?.map((worker) => (
                  <SelectItem key={worker.id} value={worker.id.toString()}>
                    {worker.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Action</Label>
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger>
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actionTypes.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>&nbsp;</Label>
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => {
                setStartDate("")
                setEndDate("")
                setSelectedWorker("all")
                setActionType("all")
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Sale ID</TableHead>
                <TableHead className="text-center">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs?.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">{formatDateTime(log.timestamp)}</TableCell>
                  <TableCell>{log.worker_name || "System"}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-medium ${getActionBadge(log.action_type)}`}>
                      {log.action_type.replace(/_/g, " ")}
                    </span>
                  </TableCell>
                  <TableCell>{log.sale_id || "-"}</TableCell>
                  <TableCell className="text-center">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => setSelectedLog(log)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Audit Log Details</DialogTitle>
                        </DialogHeader>
                        {selectedLog && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-muted-foreground">Timestamp</Label>
                                <p className="font-mono">{formatDateTime(selectedLog.timestamp)}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Action</Label>
                                <p>{selectedLog.action_type.replace(/_/g, " ")}</p>
                              </div>
                            </div>

                            {selectedLog.before_data && (
                              <div>
                                <Label className="text-muted-foreground">Before</Label>
                                <pre className="mt-1 p-3 bg-muted text-sm overflow-auto max-h-40 font-mono">
                                  {JSON.stringify(selectedLog.before_data, null, 2)}
                                </pre>
                              </div>
                            )}

                            {selectedLog.after_data && (
                              <div>
                                <Label className="text-muted-foreground">After</Label>
                                <pre className="mt-1 p-3 bg-muted text-sm overflow-auto max-h-40 font-mono">
                                  {JSON.stringify(selectedLog.after_data, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
              {(!logs || logs.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No audit logs found
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
