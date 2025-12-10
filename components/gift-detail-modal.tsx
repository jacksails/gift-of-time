"use client"

import type { Gift, SubmissionError } from "@/types/gift"
import { useEffect, useRef, useState } from "react"

interface GiftDetailModalProps {
  gift: Gift
  onConfirm: (giftId: string) => Promise<void>
  onClose: () => void
  isSubmitting: boolean
  submissionError: SubmissionError
}

export default function GiftDetailModal({
  gift,
  onConfirm,
  onClose,
  isSubmitting,
  submissionError,
}: GiftDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        if (showConfirmation) {
          setShowConfirmation(false)
        } else {
          onClose()
        }
      }

      // Focus trap
      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    closeButtonRef.current?.focus()

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose, isSubmitting, showConfirmation])

  const handleConfirmChoice = async () => {
    try {
      await onConfirm(gift.id)
    } catch (error) {
      // Error is handled by parent component
    }
  }

  const handleAlreadySelectedClose = () => {
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-8"
      onClick={!isSubmitting ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="bg-zinc-950 border-2 border-gold/40 rounded-2xl shadow-2xl shadow-gold/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {!showConfirmation ? (
          <>
            {/* Header */}
            <div className="border-b border-gold/20 p-8 pb-6">
              <div className="flex items-start justify-between mb-2">
                <h2 id="modal-title" className="text-3xl font-serif text-gold text-balance flex-1">
                  {gift.title}
                </h2>
                <button
                  ref={closeButtonRef}
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="text-zinc-400 hover:text-gold transition-colors p-2 -mt-2 -mr-2 focus:outline-none focus:ring-2 focus:ring-gold/60 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Close modal"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-lg text-zinc-300 mb-4">{gift.strapline}</p>
              <p className="text-sm text-zinc-400">
                Led by <span className="text-gold">{gift.ledByName}</span>, {gift.ledByRole}
              </p>
            </div>

            {/* Content */}
            <div className="p-8">
              <h3 className="text-sm font-semibold text-gold/80 uppercase tracking-wide mb-3">About this session</h3>
              <p className="text-zinc-300 leading-relaxed mb-6">{gift.description}</p>

              {/* Details */}
              <div className="flex gap-6 mb-8 text-sm">
                {gift.duration && (
                  <div className="flex items-center gap-2 text-zinc-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{gift.duration}</span>
                  </div>
                )}
                {gift.format && (
                  <div className="flex items-center gap-2 text-zinc-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                      />
                    </svg>
                    <span>{gift.format}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => setShowConfirmation(true)}
                  disabled={isSubmitting}
                  className="flex-1 bg-gold text-black font-semibold py-3 px-6 rounded-lg hover:bg-gold/90 transition-colors focus:outline-none focus:ring-2 focus:ring-gold/60 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Choose this gift and proceed to confirmation"
                >
                  Choose this gift
                </button>
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 bg-zinc-800 text-zinc-300 font-semibold py-3 px-6 rounded-lg hover:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Return to selection box"
                >
                  Back to selection box
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="border-b border-gold/20 p-8 pb-6">
              <h2 className="text-3xl font-serif text-gold mb-2">Confirm your Gift of Time</h2>
            </div>

            <div className="p-8">
              {/* Gift summary */}
              <div className="bg-black/50 border border-gold/30 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-serif text-gold mb-2">{gift.title}</h3>
                <p className="text-zinc-300">{gift.strapline}</p>
              </div>

              {submissionError === "ALREADY_SELECTED" && (
                <div className="mb-6 p-4 bg-red-950/30 border border-red-500/40 rounded-lg" role="alert">
                  <p className="text-red-300 text-sm mb-4">
                    It looks like a Gift of Time has already been confirmed for this link.
                  </p>
                  <button
                    onClick={handleAlreadySelectedClose}
                    className="w-full bg-zinc-800 text-zinc-300 font-semibold py-2 px-4 rounded-lg hover:bg-zinc-700 transition-colors"
                  >
                    Close and view confirmed gift
                  </button>
                </div>
              )}

              {submissionError === "SERVER_ERROR" && (
                <div className="mb-6 p-4 bg-red-950/30 border border-red-500/40 rounded-lg" role="alert">
                  <p className="text-red-300 text-sm mb-4">
                    Something went wrong while saving your choice. Please try again in a moment.
                  </p>
                  <button
                    onClick={handleConfirmChoice}
                    disabled={isSubmitting}
                    className="w-full bg-gold text-black font-semibold py-2 px-4 rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Retrying..." : "Retry"}
                  </button>
                </div>
              )}

              {isSubmitting && !submissionError && (
                <div
                  className="mb-6 p-4 bg-gold/10 border border-gold/30 rounded-lg flex items-center gap-3"
                  role="status"
                >
                  <div
                    className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin"
                    aria-hidden="true"
                  />
                  <p className="text-gold text-sm">Saving your choice...</p>
                </div>
              )}

              {/* Actions */}
              {!submissionError && (
                <div className="flex gap-4">
                  <button
                    onClick={handleConfirmChoice}
                    disabled={isSubmitting}
                    className="flex-1 bg-gold text-black font-semibold py-3 px-6 rounded-lg hover:bg-gold/90 transition-colors focus:outline-none focus:ring-2 focus:ring-gold/60 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Confirm and submit your gift selection"
                  >
                    {isSubmitting ? "Confirming..." : "Confirm my choice"}
                  </button>
                  <button
                    onClick={() => setShowConfirmation(false)}
                    disabled={isSubmitting}
                    className="flex-1 bg-zinc-800 text-zinc-300 font-semibold py-3 px-6 rounded-lg hover:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Cancel and return to gift details"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
