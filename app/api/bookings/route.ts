import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDb } from "@/lib/mongodb"
import { requireSession } from "@/lib/auth"
import type { ReservationDoc, SeatDoc } from "@/lib/models"

// POST /api/bookings  { reservationId }
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession().catch(() => null)
    if (!session) {
      return NextResponse.json({ error: "You must be signed in to book seats." }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const reservationId = String(body?.reservationId ?? "")
    if (!ObjectId.isValid(reservationId)) {
      return NextResponse.json({ error: "Invalid reservation id." }, { status: 400 })
    }

    const db = await getDb()
    const resObjectId = new ObjectId(reservationId)
    const userObjectId = new ObjectId(session.userId)
    const now = new Date()

    // Atomically claim the reservation: must be active, owned by the user,
    // and not expired. This prevents booking on expired/duplicate requests.
    const reservation = await db.collection<ReservationDoc>("reservations").findOneAndUpdate(
      { _id: resObjectId, userId: userObjectId, status: "active", expiresAt: { $gt: now } },
      { $set: { status: "booked" } },
      { returnDocument: "after" },
    )

    if (!reservation) {
      // Determine why it failed for a clearer message.
      const existing = await db.collection<ReservationDoc>("reservations").findOne({ _id: resObjectId })
      if (!existing) {
        return NextResponse.json({ error: "Reservation not found." }, { status: 404 })
      }
      if (existing.status === "booked") {
        return NextResponse.json({ error: "These seats have already been booked." }, { status: 409 })
      }
      return NextResponse.json(
        { error: "Your reservation has expired. Please select your seats again." },
        { status: 410 },
      )
    }

    // Mark the held seats as booked. Only convert seats still tied to this
    // reservation and currently reserved.
    await db.collection<SeatDoc>("seats").updateMany(
      { eventId: reservation.eventId, reservationId: resObjectId, status: "reserved" },
      { $set: { status: "booked", bookedBy: userObjectId, reservationId: null, reservedUntil: null } },
    )

    return NextResponse.json({
      booking: {
        reservationId,
        eventId: reservation.eventId.toString(),
        seatNumbers: reservation.seatNumbers,
        bookedAt: now.toISOString(),
      },
    })
  } catch (err) {
    console.log("POST /api/bookings error:", (err as Error).message)
    return NextResponse.json({ error: "Failed to confirm booking." }, { status: 500 })
  }
}
