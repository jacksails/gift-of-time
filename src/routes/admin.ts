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

export default adminRouter

