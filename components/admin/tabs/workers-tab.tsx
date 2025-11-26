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
import { Plus, Pencil, Trash2, Loader2, Key } from "lucide-react"
import { formatDate } from "@/lib/timezone"
import type { Worker } from "@/lib/db"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function WorkersTab() {
  const { data: workers, mutate: mutateWorkers } = useSWR<Worker[]>("/api/admin/workers", fetcher)
  const [isCreating, setIsCreating] = useState(false)
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null)
  const [resetPasswordId, setResetPasswordId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("worker")
  const [newPassword, setNewPassword] = useState("")

  const resetForm = () => {
    setName("")
    setEmail("")
    setPassword("")
    setRole("worker")
    setNewPassword("")
    setEditingWorker(null)
    setResetPasswordId(null)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch("/api/admin/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      })

      if (res.ok) {
        mutateWorkers()
        setIsCreating(false)
        resetForm()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingWorker) return

    setSaving(true)
    try {
      await fetch(`/api/admin/workers/${editingWorker.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingWorker.name,
          email: editingWorker.email,
          role: editingWorker.role,
        }),
      })
      mutateWorkers()
      resetForm()
    } finally {
      setSaving(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetPasswordId || !newPassword) return

    setSaving(true)
    try {
      await fetch(`/api/admin/workers/${resetPasswordId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      })
      mutateWorkers()
      resetForm()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (workerId: number) => {
    if (!confirm("Are you sure you want to delete this worker?")) return

    await fetch(`/api/admin/workers/${workerId}`, { method: "DELETE" })
    mutateWorkers()
  }

  return (
    <Card className="border-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Worker Accounts</CardTitle>
        <Dialog
          open={isCreating}
          onOpenChange={(open) => {
            setIsCreating(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Worker
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Worker Account</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@company.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="worker">Worker</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workers?.map((worker) => (
              <TableRow key={worker.id}>
                <TableCell className="font-medium">{worker.name}</TableCell>
                <TableCell>{worker.email}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 text-xs font-medium ${
                      worker.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {worker.role.toUpperCase()}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-sm">{formatDate(worker.created_at)}</TableCell>
                <TableCell>
                  <div className="flex justify-center gap-2">
                    {/* Edit Dialog */}
                    <Dialog
                      open={editingWorker?.id === worker.id}
                      onOpenChange={(open) => {
                        if (open) setEditingWorker(worker)
                        else resetForm()
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Worker</DialogTitle>
                        </DialogHeader>
                        {editingWorker && (
                          <form onSubmit={handleEdit} className="space-y-4">
                            <div className="space-y-2">
                              <Label>Name</Label>
                              <Input
                                value={editingWorker.name}
                                onChange={(e) => setEditingWorker({ ...editingWorker, name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Email</Label>
                              <Input
                                type="email"
                                value={editingWorker.email}
                                onChange={(e) => setEditingWorker({ ...editingWorker, email: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Role</Label>
                              <Select
                                value={editingWorker.role}
                                onValueChange={(value: "worker" | "admin") =>
                                  setEditingWorker({ ...editingWorker, role: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="worker">Worker</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
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

                    {/* Reset Password Dialog */}
                    <Dialog
                      open={resetPasswordId === worker.id}
                      onOpenChange={(open) => {
                        if (open) setResetPasswordId(worker.id)
                        else resetForm()
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Key className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reset Password for {worker.name}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                          <div className="space-y-2">
                            <Label>New Password</Label>
                            <Input
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Enter new password"
                              required
                            />
                          </div>
                          <Button type="submit" className="w-full" disabled={saving}>
                            {saving ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Resetting...
                              </>
                            ) : (
                              "Reset Password"
                            )}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Button variant="outline" size="icon" onClick={() => handleDelete(worker.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!workers || workers.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No workers found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
