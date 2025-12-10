import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import ClientLayout from "./_client-layout"

export function generateMetadata(): Metadata {
  const currentYear = new Date().getFullYear()
  return {
    title: `Gift of Time ${currentYear} | IMA`,
    description: "Choose your exclusive Gift of Time session with our IMA teams.",
    generator: "v0.app",
    icons: {
      icon: {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    },
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <ClientLayout>{children}</ClientLayout>
}
