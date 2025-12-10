import type { Client, Gift } from "@/types/gift"
import { gifts as staticGifts } from "@/data/gifts"

export async function fetchClientAndGifts(token: string): Promise<{
  client: Client
  gifts: Gift[]
}> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  // Check for missing or invalid token
  if (!token || token === "invalid") {
    throw new Error("NOT_FOUND")
  }

  if (token === "already-chosen") {
    const preselectedGiftId = staticGifts[0].id
    const client: Client = {
      id: "client-001",
      firstName: "Alex",
      lastName: "Thompson",
      companyName: "Acme Corporation",
      email: "alex.thompson@acme.com",
      hasSelectedGift: true,
      selectedGiftId: preselectedGiftId,
    }

    return {
      client,
      gifts: staticGifts,
    }
  }

  // Mock client data
  const client: Client = {
    id: "client-001",
    firstName: "Alex",
    lastName: "Thompson",
    companyName: "Acme Corporation",
    email: "alex.thompson@acme.com",
    hasSelectedGift: false,
    selectedGiftId: null,
  }

  return {
    client,
    gifts: staticGifts,
  }
}

export async function submitGiftSelection(params: {
  token: string
  giftId: string
}): Promise<{
  success: boolean
  selectedGiftId: string
  selectedAt: string
}> {
  // Validate inputs
  if (!params.token || !params.giftId) {
    throw new Error("INVALID_INPUT")
  }

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 600))

  if (params.token === "already-chosen") {
    throw new Error("ALREADY_SELECTED")
  }

  if (Math.random() < 0.05) {
    throw new Error("SERVER_ERROR")
  }

  return {
    success: true,
    selectedGiftId: params.giftId,
    selectedAt: new Date().toISOString(),
  }
}
