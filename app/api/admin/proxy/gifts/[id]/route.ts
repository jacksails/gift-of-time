import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const API_BASE =
  process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || ""

async function isAuthed() {
  const cookieStore = await cookies()
  return cookieStore.get("admin_auth")?.value === "1"
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "UNAUTHORISED" }, { status: 401 })
  }

  const { id } = await context.params
  const body = await request.json()

  const res = await fetch(`${API_BASE}/api/admin/gifts/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": process.env.ADMIN_API_KEY ?? "",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}))
    return NextResponse.json(errorBody || { error: "SERVER_ERROR" }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}

