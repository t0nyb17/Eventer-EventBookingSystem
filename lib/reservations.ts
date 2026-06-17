import { getDb } from "./mongodb"
import type { ObjectId } from "mongodb"

/**
 * Releases any expired reservations for an event by flipping their seats
 * back to "available". This keeps seat state correct without a background job.
 */
export async function releaseExpiredReservations(eventId: ObjectId) {
  const db = await getDb()
  const now = new Date()

  // Reset seats whose reservation window has passed and are still "reserved".
  await db.collection("seats").updateMany(
    {
      eventId,
      status: "reserved",
      reservedUntil: { $lte: now },
    },
    {
      $set: { status: "available", reservationId: null, reservedUntil: null },
    },
  )

  // Mark reservation docs as expired.
  await db.collection("reservations").updateMany(
    { eventId, status: "active", expiresAt: { $lte: now } },
    { $set: { status: "expired" } },
  )
}
