import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    const activityId = Number.parseInt(id)

    const result = await sql`
      UPDATE suspicious_activities SET
        reviewed = true,
        reviewed_by = ${admin.id},
        reviewed_at = NOW() AT TIME ZONE 'Africa/Dar_es_Salaam'
      WHERE id = ${activityId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Update suspicious activity error:", error)
    return NextResponse.json({ error: "Failed to update activity" }, { status: 500 })
  }
}
