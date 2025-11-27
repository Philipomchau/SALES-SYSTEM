"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Upload, Download, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function ClientsTab() {
    const { data: clients, mutate } = useSWR<any[]>("/api/admin/clients", fetcher)
    const [uploading, setUploading] = useState(false)
    const [csvContent, setCsvContent] = useState("")
    const [open, setOpen] = useState(false)

    const handleDownloadTemplate = () => {
        const template = "name,phone,email\nJohn Doe,0712345678,john@example.com"
        const blob = new Blob([template], { type: "text/csv" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "clients_template.csv"
        a.click()
        window.URL.revokeObjectURL(url)
    }

    const handleUpload = async () => {
        if (!csvContent) return

        setUploading(true)
        try {
            // Simple CSV parsing
            const lines = csvContent.split("\n")
            const headers = lines[0].split(",").map((h) => h.trim())
            const data = lines.slice(1).map((line) => {
                const values = line.split(",").map((v) => v.trim())
                const client: any = {}
                headers.forEach((h, i) => {
                    if (values[i]) client[h] = values[i]
                })
                return client
            }).filter(c => c.name) // Ensure name exists

            if (data.length === 0) {
                alert("No valid clients found in CSV")
                return
            }

            const res = await fetch("/api/admin/clients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ clients: data }),
            })

            if (!res.ok) throw new Error("Failed to upload clients")

            setCsvContent("")
            setOpen(false)
            mutate()
            alert(`Successfully uploaded ${data.length} clients`)
        } catch (error) {
            console.error("Upload error:", error)
            alert("Failed to upload clients")
        } finally {
            setUploading(false)
        }
    }

    return (
        <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Clients Management</CardTitle>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleDownloadTemplate}>
                        <Download className="mr-2 h-4 w-4" />
                        Template
                    </Button>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload CSV
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Upload Clients CSV</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Paste your CSV content here. Format: name,phone,email
                                </p>
                                <Textarea
                                    value={csvContent}
                                    onChange={(e) => setCsvContent(e.target.value)}
                                    placeholder="name,phone,email&#10;John Doe,0712345678,john@example.com"
                                    rows={10}
                                />
                                <Button onClick={handleUpload} disabled={uploading || !csvContent} className="w-full">
                                    {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Upload"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Joined</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {clients?.map((client) => (
                                <TableRow key={client.id}>
                                    <TableCell className="font-medium">{client.name}</TableCell>
                                    <TableCell>{client.phone || "-"}</TableCell>
                                    <TableCell>{client.email || "-"}</TableCell>
                                    <TableCell>{new Date(client.created_at).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                            {(!clients || clients.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                        No clients found
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
