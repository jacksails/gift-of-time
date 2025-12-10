import { Suspense } from "react"
import GiftOfTimePage from "@/components/gift-of-time-page"

export default function Home() {
  return (
    <Suspense fallback={null}>
      <GiftOfTimePage />
    </Suspense>
  )
}
