import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
    try {
        await requireAuth()
        const clients = await sql`SELECT * FROM clients ORDER BY name ASC`
        return NextResponse.json(clients)
    } catch (error) {
        console.error("Get clients error:", error)
        return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        await requireAuth()
        const { clients } = await request.json()

        if (!Array.isArray(clients) || clients.length === 0) {
            return NextResponse.json({ error: "Invalid clients data" }, { status: 400 })
        }

        // Bulk insert
        // Note: neon serverless driver doesn't support complex bulk inserts easily with template literals
        // so we'll do it in a transaction or loop. For simplicity and safety with small batches, loop is okay,
        // but for larger batches, we should construct a single query.
        // Let's try to construct a single query for performance.

        const values = clients.map(c => `('${c.name}', '${c.phone || ""}', '${c.email || ""}')`).join(",")

        // Sanitize input is tricky with raw string construction. 
        // Better to use a loop with parameterized queries for safety, or use a proper query builder.
        // Given the tools, let's use a loop with Promise.all for now, it's safer against SQL injection.

        const results = await Promise.all(
            clients.map(client =>
                sql`
          INSERT INTO clients (name, phone, email)
          VALUES (${client.name}, ${client.phone || null}, ${client.email || null})
          ON CONFLICT DO NOTHING
          RETURNING id
        `
            )
        )

        return NextResponse.json({ count: results.length }, { status: 201 })
    } catch (error) {
        console.error("Create clients error:", error)
        return NextResponse.json({ error: "Failed to create clients" }, { status: 500 })
    }
}
