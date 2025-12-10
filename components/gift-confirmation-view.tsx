"use client"

import type { Gift, Client } from "@/types/gift"
import { useEffect, useRef } from "react"

interface GiftConfirmationViewProps {
  gift: Gift
  client: Client
}

export default function GiftConfirmationView({ gift, client }: GiftConfirmationViewProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Focus heading on mount for accessibility
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-scale">
      <div className="bg-zinc-950/80 backdrop-blur border-2 border-gold/40 rounded-2xl p-12 shadow-2xl shadow-gold/20">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-4xl font-serif text-gold mb-6 text-center focus:outline-none text-balance"
        >
          Thank you, your Gift of Time is confirmed
        </h2>

        <p className="text-center text-zinc-300 text-lg leading-relaxed mb-10">
          We will be in touch shortly to arrange your session in Q1 2026. If anything changes in the meantime, please
          contact your usual IMA team.
        </p>

        {/* Gift Summary Card */}
        <div className="bg-black/50 border border-gold/30 rounded-xl p-8 mb-8">
          <h3 className="text-2xl font-serif text-gold mb-3 text-balance">{gift.title}</h3>
          <p className="text-lg text-zinc-300 mb-4">{gift.strapline}</p>
          <p className="text-zinc-400 leading-relaxed mb-6">{gift.description}</p>

          <div className="border-t border-gold/20 pt-6 mb-6">
            <p className="text-sm text-zinc-400 mb-4">
              Led by <span className="text-gold font-medium">{gift.ledByName}</span>, {gift.ledByRole}
            </p>

            <div className="flex gap-6 text-sm text-zinc-400">
              {gift.duration && (
                <div className="flex items-center gap-2">
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
                <div className="flex items-center gap-2">
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
          </div>

          <div className="bg-gold/10 border border-gold/30 rounded-lg p-4">
            <p className="text-gold text-sm flex items-start gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>
                Confirmed for {client.firstName} {client.lastName} at {client.companyName}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
