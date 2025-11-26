import { NextResponse } from "next/server"
import { destroySession, getSession } from "@/lib/auth"
import { logAudit } from "@/lib/audit"

export async function POST() {
  try {
    const worker = await getSession()
    if (worker) {
      await logAudit(worker.id, "LOGOUT")
    }
    await destroySession()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
