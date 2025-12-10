"use client"

import type React from "react"

import { Geist, Cormorant } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"

const _geist = Geist({ subsets: ["latin"] })
// <CHANGE> Added Cormorant serif font for elegant headings
const _cormorant = Cormorant({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] })

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <style jsx global>{`
          .font-serif {
            font-family: ${_cormorant.style.fontFamily};
          }
        `}</style>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
