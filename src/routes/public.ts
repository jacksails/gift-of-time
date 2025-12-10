import { Router } from "express"

import { prisma } from "../prisma"
import type { ClientAndGiftsResponse } from "../types"

const publicRouter = Router()

publicRouter.get("/api/client-and-gifts", async (req, res) => {
  const tokenParam = req.query.t
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam

  if (!token || typeof token !== "string" || token.trim().length === 0) {
    return res.status(400).json({ error: "MISSING_TOKEN" })
  }

  try {
    const client = await prisma.client.findUnique({
      where: { token },
    })

    if (!client) {
      return res.status(404).json({ error: "NOT_FOUND" })
    }

    const gifts = await prisma.gift.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    })

    const payload: ClientAndGiftsResponse = {
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
    }

    return res.json(payload)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to fetch client and gifts", error)
    return res.status(500).json({ error: "SERVER_ERROR" })
  }
})

publicRouter.post("/api/select-gift", async (req, res) => {
  const { token, giftId } = req.body ?? {}

  if (!token || !giftId || typeof token !== "string" || typeof giftId !== "string") {
    return res.status(400).json({ error: "INVALID_INPUT" })
  }

  try {
    const now = new Date()

    const result = await prisma.$transaction(async (tx) => {
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
      return res.status(404).json({ error: "NOT_FOUND" })
    }

    if (result.type === "ALREADY_SELECTED") {
      return res.status(409).json({
        error: "ALREADY_SELECTED",
        selectedGiftId: result.selectedGiftId,
      })
    }

    if (result.type === "INVALID_GIFT") {
      return res.status(400).json({ error: "INVALID_GIFT" })
    }

    return res.json({
      success: true,
      selectedGiftId: result.selectedGiftId,
      selectedAt: result.selectedAt,
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to select gift", error)
    return res.status(500).json({ error: "SERVER_ERROR" })
  }
})

export default publicRouter

