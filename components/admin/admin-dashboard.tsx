"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LayoutDashboard, ShoppingCart, Users, BarChart3, LogOut, Settings, UserSquare2, AlertTriangle, FileText, Download } from "lucide-react"
import { OverviewTab } from "@/components/admin/tabs/overview-tab"
import { SalesTab } from "@/components/admin/tabs/sales-tab"
import { WorkersTab } from "@/components/admin/tabs/workers-tab"
import { ReportsTab } from "@/components/admin/tabs/reports-tab"
import { SuspiciousTab } from "@/components/admin/tabs/suspicious-tab"
import { AuditTab } from "@/components/admin/tabs/audit-tab"
import { ClientsTab } from "@/components/admin/tabs/clients-tab"
import type { Worker } from "@/lib/db"

interface AdminDashboardProps {
  admin: Worker
}

export function AdminDashboard({ admin }: AdminDashboardProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  const handleExport = async (format: string) => {
    const url = `/api/admin/export?format=${format}&dataType=sales`
    window.open(url, "_blank")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">ADMIN CONTROL</h1>
            <p className="text-sm text-muted-foreground">Logged in as {admin.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
              <Download className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Export CSV</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap h-auto gap-2">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="sales" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Sales
            </TabsTrigger>
            <TabsTrigger value="workers" className="gap-2">
              <Users className="h-4 w-4" />
              Workers
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-2">
              <UserSquare2 className="h-4 w-4" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="suspicious" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Suspicious
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <FileText className="h-4 w-4" />
              Audit Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="sales">
            <SalesTab />
          </TabsContent>

          <TabsContent value="workers">
            <WorkersTab />
          </TabsContent>

          <TabsContent value="clients">
            <ClientsTab />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsTab />
          </TabsContent>

          <TabsContent value="suspicious">
            <SuspiciousTab />
          </TabsContent>

          <TabsContent value="audit">
            <AuditTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
