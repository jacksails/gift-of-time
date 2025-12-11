import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import ClientLayout from "./_client-layout"

export const metadata: Metadata = {
  title: "Gift of Time 2025 | IMA",
  description: "Choose your exclusive Gift of Time session with IMA experts for Q1 2026",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <ClientLayout>{children}</ClientLayout>
}
