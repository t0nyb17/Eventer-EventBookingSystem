"use client"

import useSWR from "swr"
import Link from "next/link"
import { CalendarDays, MapPin, ArrowRight } from "lucide-react"
import { api, type ApiEvent } from "@/lib/api-client"
import { formatEventDate } from "@/lib/format"

function EventCard({ event }: { event: ApiEvent }) {
  const soldOut = (event.availableSeats ?? 0) === 0
  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex flex-col justify-between gap-6 border border-border bg-card p-6 transition-colors hover:bg-accent"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            {soldOut ? "Sold out" : `${event.availableSeats} seats left`}
          </span>
          <ArrowRight
            className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        </div>
        <h2 className="text-pretty text-xl font-semibold leading-tight">{event.name}</h2>
        {event.description && <p className="text-pretty text-sm text-muted-foreground">{event.description}</p>}
      </div>

      <dl className="flex flex-col gap-2 font-mono text-xs uppercase tracking-wide text-muted-foreground">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-3.5" aria-hidden="true" />
          <dd>{formatEventDate(event.dateTime)}</dd>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="size-3.5" aria-hidden="true" />
          <dd>{event.venue}</dd>
        </div>
      </dl>
    </Link>
  )
}

export function EventsList() {
  const { data, error, isLoading } = useSWR("events", () => api.events())

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-56 animate-pulse border border-border bg-muted" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
        Failed to load events. Please refresh the page.
      </div>
    )
  }

  const events = data?.events ?? []

  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No events available right now.</p>
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  )
}
