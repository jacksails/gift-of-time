import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/src/prisma"

async function isAuthed() {
  const cookieStore = await cookies()
  return cookieStore.get("admin_auth")?.value === "1"
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
  const isNumber = (v: unknown) => typeof v === "number" && !Number.isNaN(v)

  if (isString(body.title)) data.title = (body.title as string).trim()
  if (isString(body.strapline)) data.strapline = (body.strapline as string).trim()
  if (isString(body.description)) data.description = (body.description as string).trim()
  if (isString(body.ledByName)) data.ledByName = (body.ledByName as string).trim()
  if (isString(body.ledByRole)) data.ledByRole = (body.ledByRole as string).trim()
  if (isString(body.duration)) data.duration = (body.duration as string).trim()
  if (isString(body.format)) data.format = (body.format as string).trim()
  if (isNumber(body.sortOrder)) data.sortOrder = body.sortOrder
  if (typeof body.isActive === "boolean") data.isActive = body.isActive

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 })
  }

  try {
    const existing = await prisma.gift.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
    }

    const updated = await prisma.gift.update({ where: { id }, data })
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update gift", error)
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 })
  }
}

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "UNAUTHORISED" }, { status: 401 })
  }

  try {
    const gifts = await prisma.gift.findMany({
      orderBy: { sortOrder: "asc" },
    })
    return NextResponse.json(gifts)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to list gifts", error)
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "UNAUTHORISED" }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>

  const requiredStrings = ["slug", "title", "strapline", "description", "ledByName", "ledByRole"]
  for (const key of requiredStrings) {
    if (typeof body[key] !== "string" || !(body[key] as string).trim()) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 })
    }
  }

  try {
    const gift = await prisma.gift.create({
      data: {
        slug: (body.slug as string).trim(),
        title: (body.title as string).trim(),
        strapline: (body.strapline as string).trim(),
        description: (body.description as string).trim(),
        ledByName: (body.ledByName as string).trim(),
        ledByRole: (body.ledByRole as string).trim(),
        duration: typeof body.duration === "string" ? (body.duration as string).trim() || null : null,
        format: typeof body.format === "string" ? body.format.trim() || null : null,
        sortOrder:
          typeof body.sortOrder === "number"
            ? body.sortOrder
            : body.sortOrder
              ? Number(body.sortOrder) || 0
              : 0,
        isActive: typeof body.isActive === "boolean" ? body.isActive : true,
      },
    })
    return NextResponse.json(gift)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to create gift", error)
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 })
  }
}

