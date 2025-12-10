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
  const body = await request.json()

  const data: Record<string, unknown> = {}
  const isString = (v: unknown) => typeof v === "string" && v.trim().length > 0
  const isNumber = (v: unknown) => typeof v === "number" && !Number.isNaN(v)

  if (isString(body.title)) data.title = (body.title as string).trim()
  if (isString(body.strapline)) data.strapline = (body.strapline as string).trim()
  if (isString(body.description)) data.description = (body.description as string).trim()
  if (isString(body.ledByName)) data.ledByName = (body.ledByName as string).trim()
  if (isString(body.ledByRole)) data.ledByRole = (body.ledByRole as string).trim()
  if (isString(body.format)) data.format = (body.format as string).trim()
  if (isString(body.duration)) data.duration = (body.duration as string).trim()
  if (body.duration === null || body.duration === "") data.duration = null
  if (isNumber(body.sortOrder)) data.sortOrder = body.sortOrder
  if (typeof body.isActive === "boolean") data.isActive = body.isActive

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 })
  }

  try {
    const updated = await prisma.gift.update({
      where: { id },
      data,
    })
    return NextResponse.json(updated)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to update gift", error)
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 })
  }
}

