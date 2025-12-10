import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const password = body?.password

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 })
  }

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "UNAUTHORISED" }, { status: 401 })
  }

  const res = NextResponse.json({ success: true })
  res.cookies.set({
    name: "admin_auth",
    value: "1",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 hours
  })
  return res
}

