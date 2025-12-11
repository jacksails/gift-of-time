import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import crypto from "crypto"
import { prisma } from "@/src/prisma"

async function isAuthed() {
  const cookieStore = await cookies()
  return cookieStore.get("admin_auth")?.value === "1"
}

export async function POST(request: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "UNAUTHORISED" }, { status: 401 })
  }

  const text = await request.text()
  if (!text.trim()) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 })
  }

  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length === 0) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 })
  }

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase())
  const required = ["firstName", "lastName", "companyName", "email"].map((h) => h.toLowerCase())
  const missing = required.filter((r) => !header.includes(r))
  if (missing.length > 0) {
    return NextResponse.json({ error: "INVALID_INPUT", missing }, { status: 400 })
  }

  const idx = {
    firstName: header.indexOf("firstname"),
    lastName: header.indexOf("lastname"),
    companyName: header.indexOf("companyname"),
    email: header.indexOf("email"),
  }

  const created: string[] = []
  const errors: { line: number; error: string }[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue
    const cols = line.split(",")
    const firstName = cols[idx.firstName]?.trim()
    const lastName = cols[idx.lastName]?.trim()
    const companyName = cols[idx.companyName]?.trim()
    const email = cols[idx.email]?.trim()

    if (!firstName || !lastName || !companyName || !email) {
      errors.push({ line: i + 1, error: "MISSING_FIELD" })
      continue
    }

    const token = crypto.randomBytes(24).toString("hex")

    try {
      await prisma.client.create({
        data: {
          firstName,
          lastName,
          companyName,
          email,
          token,
        },
      })
      created.push(email)
    } catch (error) {
      errors.push({ line: i + 1, error: "CREATE_FAILED" })
    }
  }

  return NextResponse.json({ createdCount: created.length, errors })
}


