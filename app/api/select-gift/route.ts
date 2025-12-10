import { NextResponse } from "next/server"
import { prisma } from "@/src/prisma"
import type { Prisma } from "@prisma/client"

export async function POST(request: Request) {
  const { token, giftId } = (await request.json().catch(() => ({}))) as { token?: string; giftId?: string }

  if (!token || !giftId) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 })
  }

  try {
    const now = new Date()

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const client = await tx.client.findUnique({
        where: { token },
        select: { id: true, selectedGiftId: true },
      })

      if (!client) {
        return { type: "NOT_FOUND" as const }
      }

      if (client.selectedGiftId) {
        return { type: "ALREADY_SELECTED" as const, selectedGiftId: client.selectedGiftId }
      }

      const gift = await tx.gift.findFirst({
        where: { id: giftId, isActive: true },
        select: { id: true },
      })

      if (!gift) {
        return { type: "INVALID_GIFT" as const }
      }

      const updated = await tx.client.update({
        where: { id: client.id },
        data: {
          selectedGiftId: giftId,
          selectedAt: now,
        },
        select: { selectedGiftId: true, selectedAt: true },
      })

      return {
        type: "SUCCESS" as const,
        selectedGiftId: updated.selectedGiftId!,
        selectedAt: updated.selectedAt!,
      }
    })

    if (result.type === "NOT_FOUND") {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
    }

    if (result.type === "ALREADY_SELECTED") {
      return NextResponse.json(
        { error: "ALREADY_SELECTED", selectedGiftId: result.selectedGiftId },
        { status: 409 },
      )
    }

    if (result.type === "INVALID_GIFT") {
      return NextResponse.json({ error: "INVALID_GIFT" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      selectedGiftId: result.selectedGiftId,
      selectedAt: result.selectedAt,
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to select gift", error)
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 })
  }
}

