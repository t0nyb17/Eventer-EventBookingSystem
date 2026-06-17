"use client"

import { useCallback, useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { ArrowLeft, CalendarDays, CheckCircle2, MapPin } from "lucide-react"
import { api, type ApiReservation } from "@/lib/api-client"
import { formatEventDate } from "@/lib/format"
import { useAuth } from "@/components/auth-provider"
import { AuthDialog } from "@/components/auth-dialog"
import { SeatGrid } from "@/components/seat-grid"
import { CountdownTimer } from "@/components/countdown-timer"
import { Button, buttonVariants } from "@/components/ui/button"

type Phase = "selecting" | "reserved" | "booked"

export function BookingFlow({ eventId }: { eventId: string }) {
  const { user } = useAuth()
  const { data, error, isLoading, mutate } = useSWR(
    ["event", eventId],
    () => api.event(eventId),
    { refreshInterval: 15000 },
  )

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [phase, setPhase] = useState<Phase>("selecting")
  const [reservation, setReservation] = useState<ApiReservation | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const toggleSeat = useCallback(
    (seatNumber: string) => {
      if (phase !== "selecting") return
      setActionError(null)
      setSelected((prev) => {
        const next = new Set(prev)
        if (next.has(seatNumber)) next.delete(seatNumber)
        else next.add(seatNumber)
        return next
      })
    },
    [phase],
  )

  async function handleReserve() {
    if (!user) {
      setAuthOpen(true)
      return
    }
    setActionError(null)
    setBusy(true)
    try {
      const res = await api.reserve(eventId, Array.from(selected))
      setReservation(res.reservation)
      setPhase("reserved")
      mutate()
    } catch (err) {
      const e = err as Error & { unavailableSeats?: string[] }
      setActionError(
        e.unavailableSeats?.length
          ? `${e.message} Unavailable: ${e.unavailableSeats.join(", ")}`
          : e.message,
      )
      // Refresh seat map so the user sees the latest statuses.
      mutate()
    } finally {
      setBusy(false)
    }
  }

  async function handleBook() {
    if (!reservation) return
    setActionError(null)
    setBusy(true)
    try {
      await api.book(reservation.id)
      setPhase("booked")
      mutate()
    } catch (err) {
      setActionError((err as Error).message)
      mutate()
    } finally {
      setBusy(false)
    }
  }

  const handleExpire = useCallback(() => {
    setPhase("selecting")
    setReservation(null)
    setSelected(new Set())
    setActionError("Your reservation expired. Please select your seats again.")
    mutate()
  }, [mutate])

  function reset() {
    setPhase("selecting")
    setReservation(null)
    setSelected(new Set())
    setActionError(null)
    mutate()
  }

  if (isLoading) {
    return <div className="h-96 animate-pulse border border-border bg-muted" />
  }

  if (error || !data) {
    return (
      <div className="border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
        Failed to load this event.{" "}
        <Link href="/" className="underline underline-offset-4">
          Back to events
        </Link>
      </div>
    )
  }

  const { event, seats } = data

  if (phase === "booked" && reservation) {
    return (
      <div className="flex flex-col items-center gap-6 border border-border bg-card p-10 text-center">
        <CheckCircle2 className="size-12 text-seat-selected" aria-hidden="true" />
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold">Booking confirmed</h2>
          <p className="text-pretty text-muted-foreground">
            You booked {reservation.seatNumbers.length} seat
            {reservation.seatNumbers.length > 1 ? "s" : ""} for {event.name}.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {reservation.seatNumbers.map((s) => (
            <span
              key={s}
              className="bg-seat-selected px-3 py-1 font-mono text-sm text-seat-selected-foreground"
            >
              {s}
            </span>
          ))}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={reset} className="font-mono text-xs uppercase tracking-wide">
            Book more seats
          </Button>
          <Link
            href="/"
            className={buttonVariants({ className: "font-mono text-xs uppercase tracking-wide" })}
          >
            Browse events
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link
          href="/"
          className="flex w-fit items-center gap-1 font-mono text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          All events
        </Link>
        <h1 className="text-balance text-3xl font-semibold leading-tight">{event.name}</h1>
        <dl className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-wide text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            <dd>{formatEventDate(event.dateTime)}</dd>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="size-3.5" aria-hidden="true" />
            <dd>{event.venue}</dd>
          </div>
        </dl>
      </div>

      <div className="border border-border bg-card p-6">
        <SeatGrid seats={seats} selected={selected} onToggle={toggleSeat} disabled={phase === "reserved"} />
      </div>

      {actionError && (
        <p role="alert" className="border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {actionError}
        </p>
      )}

      <div className="sticky bottom-0 flex flex-col gap-4 border border-border bg-background/95 p-6 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            {selected.size === 0
              ? "No seats selected"
              : `${selected.size} seat${selected.size > 1 ? "s" : ""} selected`}
          </span>
          {selected.size > 0 && (
            <span className="font-mono text-sm">{Array.from(selected).sort().join(", ")}</span>
          )}
          {phase === "reserved" && reservation && (
            <CountdownTimer expiresAt={reservation.expiresAt} onExpire={handleExpire} />
          )}
        </div>

        <div className="flex gap-3">
          {phase === "selecting" && (
            <Button
              onClick={handleReserve}
              disabled={selected.size === 0 || busy}
              className="font-mono text-xs uppercase tracking-wide"
            >
              {busy ? "Reserving..." : user ? "Reserve seats" : "Log in to reserve"}
            </Button>
          )}
          {phase === "reserved" && (
            <>
              <Button
                variant="outline"
                onClick={reset}
                disabled={busy}
                className="font-mono text-xs uppercase tracking-wide"
              >
                Cancel
              </Button>
              <Button onClick={handleBook} disabled={busy} className="font-mono text-xs uppercase tracking-wide">
                {busy ? "Confirming..." : "Confirm booking"}
              </Button>
            </>
          )}
        </div>
      </div>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  )
}
