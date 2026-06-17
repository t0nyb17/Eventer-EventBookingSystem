"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"
import { formatCountdown } from "@/lib/format"
import { cn } from "@/lib/utils"

export function CountdownTimer({
  expiresAt,
  onExpire,
}: {
  expiresAt: string
  onExpire: () => void
}) {
  const [remaining, setRemaining] = useState(() => new Date(expiresAt).getTime() - Date.now())

  useEffect(() => {
    setRemaining(new Date(expiresAt).getTime() - Date.now())
    const interval = setInterval(() => {
      const next = new Date(expiresAt).getTime() - Date.now()
      setRemaining(next)
      if (next <= 0) {
        clearInterval(interval)
        onExpire()
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [expiresAt, onExpire])

  const urgent = remaining <= 60_000

  return (
    <div
      className={cn(
        "flex items-center gap-2 font-mono text-sm tabular-nums",
        urgent ? "text-destructive" : "text-foreground",
      )}
      role="timer"
      aria-live="polite"
    >
      <Clock className="size-4" aria-hidden="true" />
      <span>Reservation expires in {formatCountdown(remaining)}</span>
    </div>
  )
}
