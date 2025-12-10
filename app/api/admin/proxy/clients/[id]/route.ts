import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/src/prisma"

async function isAuthed() {
  const cookieStore = await cookies()
  return cookieStore.get("admin_auth")?.value === "1"
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "UNAUTHORISED" }, { status: 401 })
  }

  const { id } = await context.params
  const body = await request.json().catch(() => ({})) as Record<string, unknown>

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
    // eslint-disable-next-line no-console
    console.error("Failed to update client", error)
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "UNAUTHORISED" }, { status: 401 })
  }

  let id: string
  try {
    const params = await context.params
    id = params.id
  } catch (err) {
    console.error("Failed to get params", err)
    return NextResponse.json({ error: "INVALID_PARAMS" }, { status: 400 })
  }

  if (!id) {
    return NextResponse.json({ error: "MISSING_ID" }, { status: 400 })
  }

  try {
    // First check if client exists
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

