import type { Client, Gift } from "@/types/gift"

function getApiBaseUrl(): string {
  const fromEnv =
    (typeof import.meta !== "undefined" ? (import.meta as any)?.env?.VITE_API_BASE_URL : undefined) ||
    (typeof process !== "undefined" ? (process.env.VITE_API_BASE_URL as string | undefined) : undefined)

  return fromEnv || ""
}

type ClientAndGiftsResponse = {
  client: {
    id: string
    firstName: string
    lastName: string
    companyName: string
    email: string
    hasSelectedGift: boolean
    selectedGiftId?: string | null
  }
  gifts: Gift[]
}

type SubmitSelectionResponse = {
  success: boolean
  selectedGiftId: string
  selectedAt: string
}

/**
 * Fetch client and gifts by token.
 * Throws:
 * - "NOT_FOUND" when token is missing/invalid
 * - "SERVER_ERROR" for all other failures
 */
export async function fetchClientAndGifts(token: string): Promise<{
  client: Client
  gifts: Gift[]
}> {
  if (!token) {
    throw new Error("NOT_FOUND")
  }

  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}/api/client-and-gifts?t=${encodeURIComponent(token)}`

  const response = await fetch(url)

  if (response.status === 404) {
    throw new Error("NOT_FOUND")
  }

  if (!response.ok) {
    throw new Error("SERVER_ERROR")
  }

  const data = (await response.json()) as ClientAndGiftsResponse

  return {
    client: {
      id: data.client.id,
      firstName: data.client.firstName,
      lastName: data.client.lastName,
      companyName: data.client.companyName,
      email: data.client.email,
      hasSelectedGift: data.client.hasSelectedGift,
      selectedGiftId: data.client.selectedGiftId ?? null,
    },
    gifts: data.gifts,
  }
}

export async function submitGiftSelection(params: {
  token: string
  giftId: string
}): Promise<SubmitSelectionResponse> {
  const { token, giftId } = params

  if (!token || !giftId) {
    throw new Error("INVALID_INPUT")
  }

  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}/api/select-gift`

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, giftId }),
  })

  if (response.status === 404) {
    throw new Error("NOT_FOUND")
  }

  if (response.status === 409) {
    throw new Error("ALREADY_SELECTED")
  }

  if (response.status === 400) {
    let errorBody: { error?: string } | undefined
    try {
      errorBody = (await response.json()) as { error?: string }
    } catch {
      errorBody = undefined
    }

    if (errorBody?.error === "INVALID_GIFT") {
      throw new Error("INVALID_GIFT")
    }
    if (errorBody?.error === "INVALID_INPUT") {
      throw new Error("INVALID_INPUT")
    }

    throw new Error("SERVER_ERROR")
  }

  if (!response.ok) {
    throw new Error("SERVER_ERROR")
  }

  const data = (await response.json()) as SubmitSelectionResponse
  return data
}
