import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = await cookies()
  const authed = cookieStore.get("admin_auth")?.value === "1"
  if (!authed) {
    return NextResponse.json({ error: "UNAUTHORISED" }, { status: 401 })
  }
  return NextResponse.json({ ok: true })
}

