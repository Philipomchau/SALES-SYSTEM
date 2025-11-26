import { cookies } from "next/headers"
import { sql, type Worker } from "./db"
import bcrypt from "bcryptjs"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSession(workerId: number): Promise<string> {
  const sessionId = crypto.randomUUID()
  const cookieStore = await cookies()
  cookieStore.set("session", `${sessionId}:${workerId}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })
  return sessionId
}

export async function getSession(): Promise<Worker | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get("session")

  if (!session?.value) return null

  const [, workerId] = session.value.split(":")
  if (!workerId) return null

  const result = await sql`
    SELECT id, name, email, role, created_at 
    FROM workers 
    WHERE id = ${Number.parseInt(workerId)}
  `

  return result[0] as Worker | null
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete("session")
}

export async function requireAuth(): Promise<Worker> {
  const worker = await getSession()
  if (!worker) {
    throw new Error("Unauthorized")
  }
  return worker
}

export async function requireAdmin(): Promise<Worker> {
  const worker = await requireAuth()
  if (worker.role !== "admin") {
    throw new Error("Admin access required")
  }
  return worker
}
