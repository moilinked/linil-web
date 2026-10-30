"use client"

import Link from "next/link"
import { useState } from "react"

import { BrandLogo } from "@/components/layout/brand-logo"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"

export function SiteLogo() {
  const [isSpinning, setIsSpinning] = useState(false)

  function handleClick() {
    setIsSpinning(false)
    requestAnimationFrame(() => {
      setIsSpinning(true)
    })
  }

  return (
    <Link
      href="/notes"
      aria-label={siteConfig.name}
      className="w-fit rounded-full transition-opacity outline-none hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/50"
      onClick={handleClick}
    >
      <span className="inline-flex size-9 items-center justify-center overflow-hidden rounded-full bg-[#1f2937]/90">
        <BrandLogo
          priority
          className={cn(isSpinning && "animate-[spin_0.7s_ease-in-out]")}
          onAnimationEnd={() => setIsSpinning(false)}
        />
      </span>
    </Link>
  )
}
