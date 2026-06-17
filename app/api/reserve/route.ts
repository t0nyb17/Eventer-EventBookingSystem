import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDb } from "@/lib/mongodb"
import { requireSession } from "@/lib/auth"
import { releaseExpiredReservations } from "@/lib/reservations"
import type { ReservationDoc, SeatDoc } from "@/lib/models"

const RESERVATION_MINUTES = 10

// POST /api/reserve  { eventId, seatNumbers: string[] }
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession().catch(() => null)
    if (!session) {
      return NextResponse.json({ error: "You must be signed in to reserve seats." }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const eventId = String(body?.eventId ?? "")
    const seatNumbers: string[] = Array.isArray(body?.seatNumbers) ? body.seatNumbers.map(String) : []

    if (!ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: "Invalid event id." }, { status: 400 })
    }
    if (seatNumbers.length === 0) {
      return NextResponse.json({ error: "Please select at least one seat." }, { status: 400 })
    }
    if (seatNumbers.length > 8) {
      return NextResponse.json({ error: "You can reserve up to 8 seats at a time." }, { status: 400 })
    }

    const db = await getDb()
    const eventObjectId = new ObjectId(eventId)
    const userObjectId = new ObjectId(session.userId)

    // Clean up expired reservations first so freed seats can be reserved.
    await releaseExpiredReservations(eventObjectId)

    const now = new Date()
    const expiresAt = new Date(now.getTime() + RESERVATION_MINUTES * 60 * 1000)
    const reservationId = new ObjectId()

    // ATOMIC CLAIM: only flip seats that are currently "available".
    // matchedCount tells us how many we actually grabbed.
    const claim = await db.collection<SeatDoc>("seats").updateMany(
      {
        eventId: eventObjectId,
        seatNumber: { $in: seatNumbers },
        status: "available",
      },
      {
        $set: {
          status: "reserved",
          reservationId,
          reservedUntil: expiresAt,
        },
      },
    )

    // If we didn't claim every requested seat, some were taken between
    // selection and reservation -> roll back and report which are unavailable.
    if (claim.modifiedCount !== seatNumbers.length) {
      await db.collection<SeatDoc>("seats").updateMany(
        { eventId: eventObjectId, reservationId },
        { $set: { status: "available", reservationId: null, reservedUntil: null } },
      )

      const taken = await db
        .collection<SeatDoc>("seats")
        .find({ eventId: eventObjectId, seatNumber: { $in: seatNumbers }, status: { $ne: "available" } })
        .toArray()

      return NextResponse.json(
        {
          error: "Some seats are no longer available. Please review your selection.",
          unavailableSeats: taken.map((s) => s.seatNumber),
        },
        { status: 409 },
      )
    }

    const reservation: ReservationDoc = {
      _id: reservationId,
      userId: userObjectId,
      eventId: eventObjectId,
      seatNumbers,
      expiresAt,
      status: "active",
      createdAt: now,
    }
    await db.collection<ReservationDoc>("reservations").insertOne(reservation)

    return NextResponse.json({
      reservation: {
        id: reservationId.toString(),
        eventId,
        seatNumbers,
        expiresAt: expiresAt.toISOString(),
      },
    })
  } catch (err) {
    console.log("POST /api/reserve error:", (err as Error).message)
    return NextResponse.json({ error: "Failed to reserve seats." }, { status: 500 })
  }
}
