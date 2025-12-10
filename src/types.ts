export interface GiftResponse {
  id: string
  slug: string
  title: string
  strapline: string
  description: string
  ledByName: string
  ledByRole: string
  durationMinutes: number | null
  format: string | null
  sortOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ClientResponse {
  id: string
  firstName: string
  lastName: string
  companyName: string
  email: string
  hasSelectedGift: boolean
  selectedGiftId: string | null
}

export interface ClientAndGiftsResponse {
  client: ClientResponse
  gifts: GiftResponse[]
}

export interface SelectGiftResponse {
  success: boolean
  selectedGiftId: string
  selectedAt: Date
}

export interface AdminClientResponse {
  id: string
  firstName: string
  lastName: string
  companyName: string
  email: string
  hasSelectedGift: boolean
  selectedGiftId: string | null
  selectedGiftTitle: string | null
  selectedAt: Date | null
}

