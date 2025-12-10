"use client"

import type { Gift } from "@/types/gift"
import GiftTile from "./gift-tile"

interface GiftGridProps {
  gifts: Gift[]
  onGiftClick: (gift: Gift) => void
}

export default function GiftGrid({ gifts, onGiftClick }: GiftGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
      {gifts
        .filter((gift) => gift.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((gift, index) => (
          <GiftTile key={gift.id} gift={gift} onClick={() => onGiftClick(gift)} animationDelay={index * 50} />
        ))}
    </div>
  )
}
