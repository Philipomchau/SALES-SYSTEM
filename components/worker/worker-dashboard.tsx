"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LogOut, Plus, History, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { formatDateTime } from "@/lib/timezone"
import type { Worker, Sale } from "@/lib/db"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface WorkerDashboardProps {
  worker: Worker
}

export function WorkerDashboard({ worker }: WorkerDashboardProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("new-sale")
  const [dateFilter, setDateFilter] = useState("today")

  // Form state
  const [productName, setProductName] = useState("")
  const [quantity, setQuantity] = useState("")
  const [unitPrice, setUnitPrice] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [submitMessage, setSubmitMessage] = useState("")

  const getDateRange = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (dateFilter) {
      case "today":
        return { startDate: today.toISOString() }
      case "week":
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        return { startDate: weekAgo.toISOString() }
      case "month":
        const monthAgo = new Date(today)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        return { startDate: monthAgo.toISOString() }
      default:
        return {}
    }
  }

  const { startDate } = getDateRange()
  const salesUrl = startDate ? `/api/sales?startDate=${startDate}` : "/api/sales"

  const { data: sales, mutate: mutateSales } = useSWR<Sale[]>(salesUrl, fetcher)

  const totalAmount = quantity && unitPrice ? Number.parseFloat(quantity) * Number.parseFloat(unitPrice) : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitStatus("idle")

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: productName,
          quantity: Number.parseInt(quantity),
          unit_price: Number.parseFloat(unitPrice),
          notes: notes || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to record sale")
      }

      setSubmitStatus("success")
      setSubmitMessage("Sale recorded successfully!")
      setProductName("")
      setQuantity("")
      setUnitPrice("")
      setNotes("")
      mutateSales()

      setTimeout(() => setSubmitStatus("idle"), 3000)
    } catch (error) {
      setSubmitStatus("error")
      setSubmitMessage(error instanceof Error ? error.message : "Failed to record sale")
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  const todayTotal = sales?.reduce((sum, sale) => sum + Number.parseFloat(sale.total_amount.toString()), 0) || 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">SALES PORTAL</h1>
            <p className="text-sm text-muted-foreground">Welcome, {worker.name}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="new-sale" className="gap-2">
              <Plus className="h-4 w-4" />
              New Sale
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              My Sales
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new-sale">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Record New Sale</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {submitStatus !== "idle" && (
                      <div
                        className={`flex items-center gap-2 p-3 text-sm ${
                          submitStatus === "success"
                            ? "bg-secondary/10 border border-secondary/20 text-secondary"
                            : "bg-destructive/10 border border-destructive/20 text-destructive"
                        }`}
                      >
                        {submitStatus === "success" ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        {submitMessage}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="product">Product Name</Label>
                      <Input
                        id="product"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="e.g., Fruit, Drink, Bread..."
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="1"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">Unit Price (TZS)</Label>
                        <Input
                          id="price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={unitPrice}
                          onChange={(e) => setUnitPrice(e.target.value)}
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any additional notes..."
                        rows={3}
                      />
                    </div>

                    <div className="p-4 bg-muted border border-border">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Amount:</span>
                        <span className="text-2xl font-bold text-primary">
                          TZS {totalAmount.toLocaleString("en-TZ", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Recording...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Record Sale
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Today&apos;s Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-6 bg-primary/10 border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-1">Total Earned Today</p>
                    <p className="text-3xl font-bold text-primary">
                      TZS {todayTotal.toLocaleString("en-TZ", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted border border-border">
                      <p className="text-sm text-muted-foreground mb-1">Sales Count</p>
                      <p className="text-2xl font-bold">{sales?.length || 0}</p>
                    </div>
                    <div className="p-4 bg-muted border border-border">
                      <p className="text-sm text-muted-foreground mb-1">Current Time</p>
                      <p className="text-lg font-mono">
                        {new Date().toLocaleTimeString("en-TZ", { timeZone: "Africa/Dar_es_Salaam" })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card className="border-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Sales History</CardTitle>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date/Time</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales?.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="font-mono text-sm">{formatDateTime(sale.sale_datetime)}</TableCell>
                          <TableCell>{sale.product_name}</TableCell>
                          <TableCell className="text-right">{sale.quantity}</TableCell>
                          <TableCell className="text-right">
                            {Number.parseFloat(sale.unit_price.toString()).toLocaleString("en-TZ")}
                          </TableCell>
                          <TableCell className="text-right font-medium text-primary">
                            {Number.parseFloat(sale.total_amount.toString()).toLocaleString("en-TZ")}
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!sales || sales.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No sales recorded for this period
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
