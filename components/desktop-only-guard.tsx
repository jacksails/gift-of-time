"use client"

import type React from "react"

import { useEffect, useState } from "react"

interface DesktopOnlyGuardProps {
  children: React.ReactNode
}

export default function DesktopOnlyGuard({ children }: DesktopOnlyGuardProps) {
  const [isDesktop, setIsDesktop] = useState(true)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)

    const checkViewport = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }

    checkViewport()
    window.addEventListener("resize", checkViewport)

    return () => window.removeEventListener("resize", checkViewport)
  }, [])

  // Prevent hydration mismatch by showing nothing until client-side
  if (!isClient) {
    return null
  }

  if (!isDesktop) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="mb-6 inline-block">
            <div className="w-16 h-16 border-2 border-gold rounded-lg flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gold"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-serif text-gold mb-4 text-balance">This experience is designed for desktop</h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            To choose your Gift of Time, please open this link on a laptop or desktop computer so you can see the full
            selection box.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
