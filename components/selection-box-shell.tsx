"use client"

import { useState } from "react"
import type { Client, Gift, SubmissionError } from "@/types/gift"
import GiftGrid from "./gift-grid"
import GiftDetailModal from "./gift-detail-modal"

interface SelectionBoxShellProps {
  client: Client
  gifts: Gift[]
  onSubmitSelection: (giftId: string) => Promise<void>
  isSubmitting: boolean
  submissionError: SubmissionError
}

export default function SelectionBoxShell({
  client,
  gifts,
  onSubmitSelection,
  isSubmitting,
  submissionError,
}: SelectionBoxShellProps) {
  const [selectedGiftForPreview, setSelectedGiftForPreview] = useState<Gift | null>(null)

  const handleGiftClick = (gift: Gift) => {
    setSelectedGiftForPreview(gift)
  }

  const handleCloseModal = () => {
    setSelectedGiftForPreview(null)
  }

  return (
    <div className="w-full max-w-5xl">
      <div className="bg-zinc-950/80 backdrop-blur border-2 border-gold/50 rounded-2xl shadow-2xl shadow-gold/10 p-12 relative animate-fade-in-scale">
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-gold rounded-tl-2xl" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-gold rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-gold rounded-bl-2xl" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-gold rounded-br-2xl" />

        <div className="absolute inset-0 rounded-2xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)] pointer-events-none" />

        <div className="text-center mb-12 relative">
          <h1 className="text-5xl font-serif text-gold mb-8 text-balance leading-tight">Your Gift of Time</h1>
          <p className="text-2xl text-zinc-200 mb-6 text-balance">
            Choose one expert session with the IMA team for Q1 2026.
          </p>
          <div className="max-w-2xl mx-auto space-y-4">
            <p className="text-zinc-300 leading-relaxed">
              We have curated six sessions designed to help you unlock new ideas, solve real problems and plan for the
              year ahead. Browse the box below and pick the one that will be most useful for you and your team.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gold/20">
            <p className="text-zinc-400 text-sm">
              Hi {client.firstName},<br />
              Your Gift of Time selection is ready.
            </p>
          </div>
        </div>

        <GiftGrid gifts={gifts} onGiftClick={handleGiftClick} />
      </div>

      {selectedGiftForPreview && (
        <GiftDetailModal
          gift={selectedGiftForPreview}
          onConfirm={onSubmitSelection}
          onClose={handleCloseModal}
          isSubmitting={isSubmitting}
          submissionError={submissionError}
        />
      )}
    </div>
  )
}
