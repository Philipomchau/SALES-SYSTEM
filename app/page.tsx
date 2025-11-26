import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"

export default async function Home() {
  const worker = await getSession()

  if (!worker) {
    redirect("/login")
  }

  if (worker.role === "admin") {
    redirect("/admin")
  }

  redirect("/worker")
}
