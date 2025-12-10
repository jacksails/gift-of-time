import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import crypto from "crypto"
import { prisma } from "@/src/prisma"

async function isAuthed() {
  const cookieStore = await cookies()
  return cookieStore.get("admin_auth")?.value === "1"
}

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "UNAUTHORISED" }, { status: 401 })
  }

  try {
    const clients = await prisma.client.findMany({
      include: {
        selectedGift: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    const result = clients.map((client) => ({
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      companyName: client.companyName,
      email: client.email,
      token: client.token,
      hasSelectedGift: client.selectedGiftId != null,
      selectedGiftId: client.selectedGiftId,
      selectedGiftTitle: client.selectedGift?.title ?? null,
      selectedAt: client.selectedAt,
    }))

    return NextResponse.json(result)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to list clients", error)
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "UNAUTHORISED" }, { status: 401 })
  }

  const { firstName, lastName, companyName, email } = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >

  const isValidString = (val: unknown) => typeof val === "string" && val.trim().length > 0
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (
    !isValidString(firstName) ||
    !isValidString(lastName) ||
    !isValidString(companyName) ||
    !isValidString(email) ||
    !emailRegex.test(email as string)
  ) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 })
  }

  const token = crypto.randomBytes(24).toString("hex")

  try {
    const client = await prisma.client.create({
      data: {
        firstName: (firstName as string).trim(),
        lastName: (lastName as string).trim(),
        companyName: (companyName as string).trim(),
        email: (email as string).trim(),
        token,
      },
    })

    const baseUrl =
      process.env.BASE_URL ||
      process.env.API_BASE_URL ||
      process.env.VITE_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      ""
    const inviteUrl = `${baseUrl}?t=${encodeURIComponent(token)}`

    return NextResponse.json({
      client: {
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName,
        companyName: client.companyName,
        email: client.email,
        token: client.token,
      },
      inviteUrl,
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to create client", error)
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 })
  }
}

