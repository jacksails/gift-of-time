import { NextResponse } from "next/server"
import { prisma } from "@/src/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("t")

  if (!token) {
    return NextResponse.json({ error: "MISSING_TOKEN" }, { status: 400 })
  }

  try {
    const client = await prisma.client.findUnique({
      where: { token },
    })

    if (!client) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
    }

    const gifts = await prisma.gift.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    })

    return NextResponse.json({
      client: {
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName,
        companyName: client.companyName,
        email: client.email,
        hasSelectedGift: client.selectedGiftId != null,
        selectedGiftId: client.selectedGiftId ?? null,
      },
      gifts,
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to fetch client and gifts", error)
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 })
  }
}

