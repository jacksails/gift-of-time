import { NextResponse } from "next/server"
import { cookies } from "next/headers"
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

