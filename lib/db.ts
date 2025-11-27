import { neon } from "@neondatabase/serverless"

export const sql = neon(process.env.DATABASE_URL!)

export type Worker = {
  id: number
  name: string
  email: string
  password_hash: string
  role: "worker" | "admin"
  created_at: string
}

export type Sale = {
  id: number
  worker_id: number
  product_name: string
  quantity: number
  unit_price: number
  total_amount: number
  notes: string | null
  sale_datetime: string
  created_at: string
  updated_at: string
  worker_name?: string
  unit_type?: "piece" | "kg"
  client_id?: number | null
}

export type AuditLog = {
  id: number
  worker_id: number | null
  action_type: string
  sale_id: number | null
  before_data: Record<string, unknown> | null
  after_data: Record<string, unknown> | null
  timestamp: string
  worker_name?: string
}

export type PriceHistory = {
  id: number
  product_name: string
  min_price: number
  max_price: number
  avg_price: number
  sale_count: number
  last_updated: string
}

export type SuspiciousActivity = {
  id: number
  sale_id: number | null
  worker_id: number | null
  reason: string
  severity: "low" | "medium" | "high"
  reviewed: boolean
  reviewed_by: number | null
  reviewed_at: string | null
  created_at: string
  worker_name?: string
  sale_details?: Sale
}
