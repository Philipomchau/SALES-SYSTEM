import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const worker = await getSession()

    if (!worker) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    return NextResponse.json({
      id: worker.id,
      name: worker.name,
      email: worker.email,
      role: worker.role,
    })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ error: "Auth check failed" }, { status: 500 })
  }
}
