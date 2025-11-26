import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { WorkerDashboard } from "@/components/worker/worker-dashboard"

export default async function WorkerPage() {
  const worker = await getSession()

  if (!worker) {
    redirect("/login")
  }

  return <WorkerDashboard worker={worker} />
}
