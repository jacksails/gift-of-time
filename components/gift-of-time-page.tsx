"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import type { Client, Gift, SubmissionError } from "@/types/gift"
import { fetchClientAndGifts, submitGiftSelection } from "@/api/client-api"
import DesktopOnlyGuard from "./desktop-only-guard"
import Header from "./header"
import SelectionBoxShell from "./selection-box-shell"
import GiftConfirmationView from "./gift-confirmation-view"
import Snowfall from "./snowfall"

type PageStatus = "loading" | "ready" | "error" | "landing"
type ErrorType = "NOT_FOUND" | "SERVER_ERROR" | null

export default function GiftOfTimePage() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<PageStatus>("loading")
  const [errorType, setErrorType] = useState<ErrorType>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [gifts, setGifts] = useState<Gift[]>([])

  const [finalSelection, setFinalSelection] = useState<Gift | null>(null)
  const [isSubmittingSelection, setIsSubmittingSelection] = useState(false)
  const [submissionError, setSubmissionError] = useState<SubmissionError>(null)

  useEffect(() => {
    const token = searchParams.get("t")

    if (!token) {
      setStatus("landing")
      setErrorType(null)
      return
    }

    fetchClientAndGifts(token)
      .then((data) => {
        setClient(data.client)
        setGifts(data.gifts)
        setStatus("ready")

        if (data.client.hasSelectedGift && data.client.selectedGiftId) {
          const selectedGift = data.gifts.find((g) => g.id === data.client.selectedGiftId)
          if (selectedGift) {
            setFinalSelection(selectedGift)
          }
        }
      })
      .catch((error) => {
        setStatus("error")
        if (error.message === "NOT_FOUND") {
          setErrorType("NOT_FOUND")
        } else {
          setErrorType("SERVER_ERROR")
        }
      })
  }, [searchParams])

  const handleSubmitSelection = async (giftId: string) => {
    const token = searchParams.get("t")
    if (!token) return

    setIsSubmittingSelection(true)
    setSubmissionError(null)

    try {
      await submitGiftSelection({ token, giftId })

      const selectedGift = gifts.find((g) => g.id === giftId)
      if (selectedGift) {
        setFinalSelection(selectedGift)
        setClient((prev) =>
          prev
            ? {
                ...prev,
                hasSelectedGift: true,
                selectedGiftId: giftId,
              }
            : null,
        )
      }
    } catch (error: any) {
      if (error.message === "ALREADY_SELECTED") {
        setSubmissionError("ALREADY_SELECTED")

        const token = searchParams.get("t")
        if (token) {
          try {
            const data = await fetchClientAndGifts(token)
            setClient(data.client)
            if (data.client.selectedGiftId) {
              const selectedGift = data.gifts.find((g) => g.id === data.client.selectedGiftId)
              if (selectedGift) {
                setFinalSelection(selectedGift)
              }
            }
          } catch (fetchError) {
            // Error fetching updated data
          }
        }
      } else {
        setSubmissionError("SERVER_ERROR")
      }
    } finally {
      setIsSubmittingSelection(false)
    }
  }

  const handleRetry = () => {
    const token = searchParams.get("t")
    if (!token) return

    setStatus("loading")
    setErrorType(null)

    fetchClientAndGifts(token)
      .then((data) => {
        setClient(data.client)
        setGifts(data.gifts)
        setStatus("ready")
      })
      .catch((error) => {
        setStatus("error")
        if (error.message === "NOT_FOUND") {
          setErrorType("NOT_FOUND")
        } else {
          setErrorType("SERVER_ERROR")
        }
      })
  }

  return (
    <DesktopOnlyGuard>
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black flex flex-col relative overflow-hidden">
        {/* Subtle Christmas gradient overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse at 0% 0%, oklch(0.15 0.05 15 / 0.4) 0%, transparent 50%),
              radial-gradient(ellipse at 100% 100%, oklch(0.12 0.04 145 / 0.3) 0%, transparent 50%)
            `,
          }}
          aria-hidden="true"
        />
        <Snowfall />
        <Header />
        <main className="flex-1 flex items-center justify-center px-8 py-12">
          {status === "landing" && (
            <div className="max-w-2xl text-center space-y-5 text-white relative z-10">
              <p className="text-sm uppercase tracking-[0.25em] text-gold">
                <span className="text-cranberry">✦</span>
                {" "}IMA Gift of Time{" "}
                <span className="text-forest">✦</span>
              </p>
              <h1 className="text-4xl md:text-5xl font-semibold font-serif">
                A personal invitation to choose your session
              </h1>
              <p className="text-lg text-zinc-200 font-serif">
                We’ve curated a set of one-to-one experiences for our partners this season. Please open the unique link
                we sent you to view the sessions and confirm your choice. Each link is personal, so you won’t need to
                sign in or create an account.
              </p>
              <p className="text-sm text-zinc-300">
                If you can’t find your link, contact your IMA partner team or email{" "}
                <a className="underline text-gold" href="mailto:reception@ima.global">
                  reception@ima.global
                </a>{" "}
                and we’ll resend it right away.
              </p>
            </div>
          )}
          {status === "loading" && (
            <div className="text-center max-w-md">
              <div className="mb-6 flex justify-center">
                <div
                  className="w-12 h-12 border-4 border-gold/30 border-t-gold rounded-full animate-spin"
                  role="status"
                  aria-label="Loading your gift selection"
                />
              </div>
              <h2 className="text-3xl font-serif text-gold mb-4">Preparing your selection box</h2>
              <p className="text-zinc-400 leading-relaxed">Please wait a moment while we load your Gift of Time.</p>
            </div>
          )}

          {status === "error" && errorType === "NOT_FOUND" && (
            <div
              className="text-center max-w-lg bg-zinc-950/80 backdrop-blur border-2 border-gold/40 rounded-2xl p-12"
              role="alert"
            >
              <h2 className="text-3xl font-serif text-gold mb-6">We cannot find your Gift of Time invite</h2>
              <p className="text-zinc-300 leading-relaxed mb-4">
                Your link may be incorrect or expired. Please contact your IMA team so we can resend it.
              </p>
              <p className="text-sm text-zinc-500">
                If you believe this is an error, please check the link in your invitation email.
              </p>
            </div>
          )}

          {status === "error" && errorType === "SERVER_ERROR" && (
            <div
              className="text-center max-w-lg bg-zinc-950/80 backdrop-blur border-2 border-gold/40 rounded-2xl p-12"
              role="alert"
            >
              <h2 className="text-3xl font-serif text-gold mb-6">Something went wrong</h2>
              <p className="text-zinc-300 leading-relaxed mb-6">
                We encountered an error while loading your gift selection. Please try again.
              </p>
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-gold/90 transition-colors focus:outline-none focus:ring-2 focus:ring-gold/60 focus:ring-offset-2 focus:ring-offset-black"
                aria-label="Retry loading gift selection"
              >
                Try Again
              </button>
            </div>
          )}

          {status === "ready" && client && finalSelection && (
            <GiftConfirmationView gift={finalSelection} client={client} />
          )}

          {status === "ready" && client && !finalSelection && (
            <SelectionBoxShell
              client={client}
              gifts={gifts}
              onSubmitSelection={handleSubmitSelection}
              isSubmitting={isSubmittingSelection}
              submissionError={submissionError}
            />
          )}
        </main>
        <footer className="py-6 text-center relative z-10">
          <p className="text-zinc-500 text-sm">
            <span className="text-cranberry-light">✦</span>
            {" "}Season's Greetings from all at IMA{" "}
            <span className="text-forest-light">✦</span>
          </p>
        </footer>
      </div>
    </DesktopOnlyGuard>
  )
}
