import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const API_BASE =
  process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || ""

async function isAuthed() {
  const cookieStore = await cookies()
  return cookieStore.get("admin_auth")?.value === "1"
}

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "UNAUTHORISED" }, { status: 401 })
  }

  const res = await fetch(`${API_BASE}/api/admin/gifts`, {
    headers: {
      "x-admin-key": process.env.ADMIN_API_KEY ?? "",
    },
    cache: "no-store",
  })

  if (!res.ok) {
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 })
  }

  const data = await res.json()
  return NextResponse.json(data)
}

