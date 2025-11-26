import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyPassword, createSession } from "@/lib/auth"
import { logAudit } from "@/lib/audit"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    const result = await sql`
      SELECT * FROM workers WHERE email = ${email}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const worker = result[0]
    const valid = await verifyPassword(password, worker.password_hash)

    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    await createSession(worker.id)
    await logAudit(worker.id, "LOGIN", null, null, { email: worker.email })

    return NextResponse.json({
      id: worker.id,
      name: worker.name,
      email: worker.email,
      role: worker.role,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
