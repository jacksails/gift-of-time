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

export async function PUT(request: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "UNAUTHORISED" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "MISSING_ID" }, { status: 400 })
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>

  const data: Record<string, unknown> = {}
  const isString = (v: unknown) => typeof v === "string" && v.trim().length > 0

  if (isString(body.firstName)) data.firstName = (body.firstName as string).trim()
  if (isString(body.lastName)) data.lastName = (body.lastName as string).trim()
  if (isString(body.companyName)) data.companyName = (body.companyName as string).trim()
  if (isString(body.email)) data.email = (body.email as string).trim()

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 })
  }

  try {
    const existing = await prisma.client.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
    }

    const updated = await prisma.client.update({
      where: { id },
      data,
      include: { selectedGift: { select: { id: true, title: true } } },
    })

    return NextResponse.json({
      id: updated.id,
      firstName: updated.firstName,
      lastName: updated.lastName,
      companyName: updated.companyName,
      email: updated.email,
      token: updated.token,
      hasSelectedGift: updated.selectedGiftId != null,
      selectedGiftId: updated.selectedGiftId,
      selectedGiftTitle: updated.selectedGift?.title ?? null,
      selectedAt: updated.selectedAt,
    })
  } catch (error) {
    console.error("Failed to update client", error)
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "UNAUTHORISED" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "MISSING_ID" }, { status: 400 })
  }

  try {
    const existing = await prisma.client.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
    }

    await prisma.client.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete client", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "SERVER_ERROR", details: message }, { status: 500 })
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

