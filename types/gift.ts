export type Gift = {
  id: string
  slug: string
  title: string
  strapline: string
  description: string
  ledByName: string
  ledByRole: string
  durationMinutes?: number
  format?: string
  sortOrder: number
  isActive: boolean
}

export type Client = {
  id: string
  firstName: string
  lastName: string
  companyName: string
  email: string
  hasSelectedGift: boolean
  selectedGiftId?: string | null
}

export type SubmissionError = "ALREADY_SELECTED" | "SERVER_ERROR" | null
