"use client"

import type { Gift } from "@/types/gift"

interface GiftTileProps {
  gift: Gift
  onClick: () => void
  animationDelay?: number
}

export default function GiftTile({ gift, onClick, animationDelay = 0 }: GiftTileProps) {
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${animationDelay}ms` }}
      className="aspect-square bg-black/60 border-2 border-gold/40 rounded-xl p-6 hover:border-gold hover:bg-zinc-900/60 hover:scale-[1.02] hover:shadow-xl hover:shadow-gold/25 transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-black text-left opacity-0 animate-fade-in-up"
      aria-label={`View details for ${gift.title}`}
    >
      <div className="flex flex-col h-full">
        <h3 className="text-xl font-serif text-gold mb-3 text-balance group-hover:text-gold/90 transition-colors leading-snug">
          {gift.title}
        </h3>
        <p className="text-sm text-zinc-400 mb-4 leading-relaxed flex-1">{gift.strapline}</p>
        <p className="text-xs text-zinc-500 group-hover:text-gold/70 transition-colors mt-auto">
          Led by {gift.ledByName}
        </p>
      </div>
    </button>
  )
}
