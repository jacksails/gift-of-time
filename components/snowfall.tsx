"use client"

import { useEffect, useState } from "react"

interface Snowflake {
  id: number
  x: number
  size: number
  duration: number
  delay: number
  opacity: number
}

/**
 * Elegant snowfall effect - sparse, slow-moving, premium feel
 * Inspired by luxury brand holiday campaigns
 */
export default function Snowfall() {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([])

  useEffect(() => {
    // Generate sparse snowflakes - fewer = more elegant
    const flakes: Snowflake[] = Array.from({ length: 35 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: Math.random() * 3 + 2, // 2-5px - subtle sizes
      duration: Math.random() * 15 + 20, // 20-35s - very slow fall
      delay: Math.random() * 20, // Staggered start
      opacity: Math.random() * 0.4 + 0.2, // 0.2-0.6 - subtle
    }))
    setSnowflakes(flakes)
  }, [])

  if (snowflakes.length === 0) return null

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    >
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute rounded-full bg-snow"
          style={{
            left: `${flake.x}%`,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            opacity: flake.opacity,
            animation: `snowfall ${flake.duration}s linear ${flake.delay}s infinite`,
            boxShadow: `0 0 ${flake.size * 2}px rgba(255, 255, 255, 0.3)`,
          }}
        />
      ))}
      
      {/* A few larger, slower "hero" snowflakes for depth */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`hero-${i}`}
          className="absolute rounded-full"
          style={{
            left: `${10 + i * 12}%`,
            width: `${6 + Math.random() * 2}px`,
            height: `${6 + Math.random() * 2}px`,
            opacity: 0.15,
            background: `radial-gradient(circle, var(--snow) 0%, transparent 70%)`,
            animation: `snowfall ${35 + i * 3}s linear ${i * 4}s infinite`,
            filter: 'blur(1px)',
          }}
        />
      ))}
    </div>
  )
}

