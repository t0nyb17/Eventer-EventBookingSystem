"use client"

import { cn } from "@/lib/utils"
import type { ApiSeat, SeatStatus } from "@/lib/api-client"

const statusStyles: Record<SeatStatus | "selected", string> = {
  available: "bg-seat-available text-seat-available-foreground hover:ring-2 hover:ring-ring cursor-pointer",
  selected: "bg-seat-selected text-seat-selected-foreground ring-2 ring-seat-selected cursor-pointer",
  reserved: "bg-seat-reserved text-seat-reserved-foreground cursor-not-allowed",
  booked: "bg-seat-booked text-seat-booked-foreground cursor-not-allowed line-through",
}

function Legend() {
  const items: { label: string; key: SeatStatus | "selected" }[] = [
    { label: "Available", key: "available" },
    { label: "Selected", key: "selected" },
    { label: "Reserved", key: "reserved" },
    { label: "Booked", key: "booked" },
  ]
  return (
    <div className="flex flex-wrap gap-4">
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-2">
          <span className={cn("size-4 rounded-sm", statusStyles[item.key].split(" ")[0])} aria-hidden="true" />
          <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export function SeatGrid({
  seats,
  selected,
  onToggle,
  disabled,
}: {
  seats: ApiSeat[]
  selected: Set<string>
  onToggle: (seatNumber: string) => void
  disabled?: boolean
}) {
  // Group seats by row (first character of seat number).
  const rows = new Map<string, ApiSeat[]>()
  for (const seat of seats) {
    const row = seat.seatNumber.charAt(0)
    if (!rows.has(row)) rows.set(row, [])
    rows.get(row)!.push(seat)
  }

  return (
    <div className="flex flex-col gap-6">
      <Legend />

      <div className="overflow-x-auto">
        <div className="mx-auto mb-6 w-full max-w-md border-b-2 border-foreground/40 pb-2 text-center font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Stage
        </div>

        <div className="flex flex-col items-center gap-2">
          {Array.from(rows.entries()).map(([row, rowSeats]) => (
            <div key={row} className="flex items-center gap-2">
              <span className="w-5 shrink-0 text-center font-mono text-xs text-muted-foreground">{row}</span>
              <div className="flex gap-2">
                {rowSeats.map((seat) => {
                  const isSelected = selected.has(seat.seatNumber)
                  const visualStatus = isSelected ? "selected" : seat.status
                  const isInteractive = seat.status === "available" && !disabled
                  return (
                    <button
                      key={seat.id}
                      type="button"
                      disabled={!isInteractive && !isSelected}
                      onClick={() => onToggle(seat.seatNumber)}
                      aria-label={`Seat ${seat.seatNumber} - ${visualStatus}`}
                      aria-pressed={isSelected}
                      className={cn(
                        "flex size-9 items-center justify-center rounded-sm text-[10px] font-medium transition-all",
                        statusStyles[visualStatus],
                        disabled && !isSelected && "opacity-60",
                      )}
                    >
                      {seat.seatNumber.slice(1)}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
