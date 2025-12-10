import { Prisma } from "@prisma/client"
import { Router } from "express"
import crypto from "crypto"

import { prisma } from "../prisma"

const adminRouter = Router()

const ADMIN_API_KEY = process.env.ADMIN_API_KEY
const BASE_URL = process.env.BASE_URL

adminRouter.use((req, res, next) => {
  const headerKey = req.header("x-admin-key")
  if (!ADMIN_API_KEY || !headerKey || headerKey !== ADMIN_API_KEY) {
    return res.status(401).json({ error: "UNAUTHORISED" })
  }
  return next()
})

adminRouter.post("/clients", async (req, res) => {
  const { firstName, lastName, companyName, email } = req.body ?? {}

  const isValidString = (val: unknown) => typeof val === "string" && val.trim().length > 0
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (
    !isValidString(firstName) ||
    !isValidString(lastName) ||
    !isValidString(companyName) ||
    !isValidString(email) ||
    !emailRegex.test(email as string)
  ) {
    return res.status(400).json({ error: "INVALID_INPUT" })
  }

  const token = crypto.randomBytes(24).toString("hex")

  try {
    const client = await prisma.client.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        companyName: companyName.trim(),
        email: (email as string).trim(),
        token,
      },
    })

    const baseUrl = BASE_URL || ""
    const inviteUrl = `${baseUrl}?t=${encodeURIComponent(token)}`

    return res.status(201).json({
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
    return res.status(500).json({ error: "SERVER_ERROR" })
  }
})

adminRouter.get("/clients", async (_req, res) => {
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
      hasSelectedGift: client.selectedGiftId != null,
      selectedGiftId: client.selectedGiftId,
      selectedGiftTitle: client.selectedGift?.title ?? null,
      selectedAt: client.selectedAt,
    }))

    return res.json(result)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to list clients", error)
    return res.status(500).json({ error: "SERVER_ERROR" })
  }
})

adminRouter.get("/gifts", async (_req, res) => {
  try {
    const gifts = await prisma.gift.findMany({
      orderBy: { sortOrder: "asc" },
    })
    return res.json(gifts)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to list gifts", error)
    return res.status(500).json({ error: "SERVER_ERROR" })
  }
})

adminRouter.put("/gifts/:id", async (req, res) => {
  const { id } = req.params
  const {
    title,
    strapline,
    description,
    ledByName,
    ledByRole,
    duration,
    format,
    sortOrder,
    isActive,
  } = req.body ?? {}

  const data: Prisma.GiftUpdateInput = {}

  const isString = (v: unknown) => typeof v === "string" && v.trim().length > 0
  const isNumber = (v: unknown) => typeof v === "number" && !Number.isNaN(v)

  if (isString(title)) data.title = title.trim()
  if (isString(strapline)) data.strapline = strapline.trim()
  if (isString(description)) data.description = description.trim()
  if (isString(ledByName)) data.ledByName = ledByName.trim()
  if (isString(ledByRole)) data.ledByRole = ledByRole.trim()
  if (isString(format)) data.format = format.trim()
  if (isString(duration)) data.duration = duration.trim()
  if (isNumber(sortOrder)) data.sortOrder = sortOrder
  if (typeof isActive === "boolean") data.isActive = isActive

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: "INVALID_INPUT" })
  }

  try {
    const updated = await prisma.gift.update({
      where: { id },
      data,
    })
    return res.json(updated)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to update gift", error)
    return res.status(500).json({ error: "SERVER_ERROR" })
  }
})

export default adminRouter

