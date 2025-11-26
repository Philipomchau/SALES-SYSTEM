import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAdmin, hashPassword } from "@/lib/auth"
import { logAudit } from "@/lib/audit"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    const workerId = Number.parseInt(id)
    const { name, email, password, role } = await request.json()

    const existing = await sql`SELECT * FROM workers WHERE id = ${workerId}`
    if (existing.length === 0) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 })
    }

    const beforeData = { name: existing[0].name, email: existing[0].email, role: existing[0].role }

    let result
    if (password) {
      const passwordHash = await hashPassword(password)
      result = await sql`
        UPDATE workers SET
          name = ${name || existing[0].name},
          email = ${email || existing[0].email},
          password_hash = ${passwordHash},
          role = ${role || existing[0].role}
        WHERE id = ${workerId}
        RETURNING id, name, email, role, created_at
      `
    } else {
      result = await sql`
        UPDATE workers SET
          name = ${name || existing[0].name},
          email = ${email || existing[0].email},
          role = ${role || existing[0].role}
        WHERE id = ${workerId}
        RETURNING id, name, email, role, created_at
      `
    }

    const afterData = { name: result[0].name, email: result[0].email, role: result[0].role }
    await logAudit(admin.id, "UPDATE_WORKER", null, beforeData, afterData)

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Update worker error:", error)
    return NextResponse.json({ error: "Failed to update worker" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    const workerId = Number.parseInt(id)

    const existing = await sql`SELECT * FROM workers WHERE id = ${workerId}`
    if (existing.length === 0) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 })
    }

    // Prevent deleting self
    if (admin.id === workerId) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    await sql`DELETE FROM workers WHERE id = ${workerId}`

    await logAudit(admin.id, "DELETE_WORKER", null, { name: existing[0].name, email: existing[0].email }, null)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete worker error:", error)
    return NextResponse.json({ error: "Failed to delete worker" }, { status: 500 })
  }
}
