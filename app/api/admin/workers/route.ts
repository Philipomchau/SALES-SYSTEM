import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAdmin, hashPassword } from "@/lib/auth"
import { logAudit } from "@/lib/audit"

export async function GET() {
  try {
    await requireAdmin()

    const result = await sql`
      SELECT id, name, email, role, created_at FROM workers ORDER BY created_at DESC
    `
    return NextResponse.json(result)
  } catch (error) {
    console.error("Get workers error:", error)
    return NextResponse.json({ error: "Failed to fetch workers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    const { name, email, password, role = "worker" } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)

    const result = await sql`
      INSERT INTO workers (name, email, password_hash, role)
      VALUES (${name}, ${email}, ${passwordHash}, ${role})
      RETURNING id, name, email, role, created_at
    `

    await logAudit(admin.id, "CREATE_WORKER", null, null, { name, email, role })

    return NextResponse.json(result[0], { status: 201 })
  } catch (error: unknown) {
    console.error("Create worker error:", error)
    if (error instanceof Error && error.message?.includes("duplicate")) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create worker" }, { status: 500 })
  }
}
