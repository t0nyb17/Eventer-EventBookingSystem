import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDb } from "@/lib/mongodb"
import { releaseExpiredReservations } from "@/lib/reservations"
import type { EventDoc, SeatDoc, SeatJSON } from "@/lib/models"

// GET /api/events/:id - event details + seat map
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid event id." }, { status: 400 })
    }
    const eventId = new ObjectId(id)
    const db = await getDb()

    const event = await db.collection<EventDoc>("events").findOne({ _id: eventId })
    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 })
    }

    // Free up any seats whose reservation has expired before reading state.
    await releaseExpiredReservations(eventId)

    const seats = await db.collection<SeatDoc>("seats").find({ eventId }).toArray()

    // Natural sort by row letter then seat number.
    seats.sort((a, b) => {
      const ra = a.seatNumber.charCodeAt(0)
      const rb = b.seatNumber.charCodeAt(0)
      if (ra !== rb) return ra - rb
      return Number(a.seatNumber.slice(1)) - Number(b.seatNumber.slice(1))
    })

    const seatJSON: SeatJSON[] = seats.map((s) => ({
      id: s._id!.toString(),
      seatNumber: s.seatNumber,
      status: s.status,
    }))

    return NextResponse.json({
      event: {
        id: event._id!.toString(),
        name: event.name,
        dateTime: event.dateTime,
        venue: event.venue,
        totalSeats: event.totalSeats,
        description: event.description,
      },
      seats: seatJSON,
    })
  } catch (err) {
    console.log("GET /api/events/:id error:", (err as Error).message)
    return NextResponse.json({ error: "Failed to load event." }, { status: 500 })
  }
}
