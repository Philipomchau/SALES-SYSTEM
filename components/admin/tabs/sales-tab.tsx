"use client"

import type React from "react"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil, Trash2, Search, Loader2 } from "lucide-react"
import { formatDateTime } from "@/lib/timezone"
import type { Sale, Worker } from "@/lib/db"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function SalesTab() {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedWorker, setSelectedWorker] = useState("all")
  const [productFilter, setProductFilter] = useState("")
  const [editingSale, setEditingSale] = useState<Sale | null>(null)
  const [saving, setSaving] = useState(false)

  const buildUrl = () => {
    const params = new URLSearchParams()
    if (startDate) params.set("startDate", new Date(startDate).toISOString())
    if (endDate) params.set("endDate", new Date(endDate).toISOString())
    if (selectedWorker !== "all") params.set("workerId", selectedWorker)
    if (productFilter) params.set("product", productFilter)
    return `/api/sales?${params.toString()}`
  }

  const { data: sales, mutate: mutateSales } = useSWR<Sale[]>(buildUrl(), fetcher)
  const { data: workers } = useSWR<Worker[]>("/api/admin/workers", fetcher)

  const handleDelete = async (saleId: number) => {
    if (!confirm("Are you sure you want to delete this sale?")) return

    await fetch(`/api/sales/${saleId}`, { method: "DELETE" })
    mutateSales()
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSale) return

    setSaving(true)
    try {
      await fetch(`/api/sales/${editingSale.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: editingSale.product_name,
          quantity: editingSale.quantity,
          unit_price: editingSale.unit_price,
          notes: editingSale.notes,
        }),
      })
      mutateSales()
      setEditingSale(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle>All Sales</CardTitle>
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
            <Label>Worker</Label>
            <Select value={selectedWorker} onValueChange={setSelectedWorker}>
              <SelectTrigger>
                <SelectValue placeholder="All Workers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workers</SelectItem>
                {workers
                  ?.filter((w) => w.role === "worker")
                  .map((worker) => (
                    <SelectItem key={worker.id} value={worker.id.toString()}>
                      {worker.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Product</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search product..."
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
              />
            </div>
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
                setProductFilter("")
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
                <TableHead>Date/Time</TableHead>
                <TableHead>Worker</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales?.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-mono text-sm">{formatDateTime(sale.sale_datetime)}</TableCell>
                  <TableCell>{sale.worker_name}</TableCell>
                  <TableCell>{sale.product_name}</TableCell>
                  <TableCell className="text-right">{sale.quantity}</TableCell>
                  <TableCell className="capitalize">{sale.unit_type || 'piece'}</TableCell>
                  <TableCell className="text-right">
                    {Number.parseFloat(sale.unit_price.toString()).toLocaleString("en-TZ")}
                  </TableCell>
                  <TableCell className="text-right font-medium text-primary">
                    {Number.parseFloat(sale.total_amount.toString()).toLocaleString("en-TZ")}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={sale.notes || ""}>
                    {sale.notes || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon" onClick={() => setEditingSale(sale)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Sale</DialogTitle>
                          </DialogHeader>
                          {editingSale && (
                            <form onSubmit={handleEdit} className="space-y-4">
                              <div className="space-y-2">
                                <Label>Product Name</Label>
                                <Input
                                  value={editingSale.product_name}
                                  onChange={(e) => setEditingSale({ ...editingSale, product_name: e.target.value })}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Quantity</Label>
                                  <Input
                                    type="number"
                                    value={editingSale.quantity}
                                    onChange={(e) =>
                                      setEditingSale({
                                        ...editingSale,
                                        quantity: Number.parseInt(e.target.value),
                                      })
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Unit Price</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={editingSale.unit_price}
                                    onChange={(e) =>
                                      setEditingSale({
                                        ...editingSale,
                                        unit_price: Number.parseFloat(e.target.value),
                                      })
                                    }
                                  />
                                </div>
                              </div>
                              <Button type="submit" className="w-full" disabled={saving}>
                                {saving ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  "Save Changes"
                                )}
                              </Button>
                            </form>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button variant="outline" size="icon" onClick={() => handleDelete(sale.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!sales || sales.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No sales found
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
