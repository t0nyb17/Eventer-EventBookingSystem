import { getDb } from "./mongodb"
import type { EventDoc, SeatDoc } from "./models"

// Generates seat numbers like A1..A10, B1..B10 based on totalSeats (rows of 10).
function generateSeatNumbers(totalSeats: number): string[] {
  const seats: string[] = []
  const perRow = 10
  const rows = Math.ceil(totalSeats / perRow)
  for (let r = 0; r < rows; r++) {
    const rowLetter = String.fromCharCode(65 + r) // A, B, C...
    for (let c = 1; c <= perRow; c++) {
      if (seats.length >= totalSeats) break
      seats.push(`${rowLetter}${c}`)
    }
  }
  return seats
}

export async function ensureIndexes() {
  const db = await getDb()
  await db.collection("users").createIndex({ email: 1 }, { unique: true })
  await db.collection("seats").createIndex({ eventId: 1, seatNumber: 1 }, { unique: true })
  await db.collection("reservations").createIndex({ expiresAt: 1 })
}

export async function seedDatabase() {
  const db = await getDb()
  await ensureIndexes()

  const existing = await db.collection("events").countDocuments()
  if (existing > 0) {
    return { seeded: false, message: "Events already exist" }
  }

  const events: EventDoc[] = [
    {
      name: "Midnight Synth — Live in Concert",
      dateTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
      venue: "Aurora Arena, Downtown",
      totalSeats: 40,
      description: "An electric night of synthwave and neon visuals.",
    },
    {
      name: "The Grand Tech Summit",
      dateTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
      venue: "Innovation Hall, Tech Park",
      totalSeats: 30,
      description: "Talks from industry leaders on the future of software.",
    },
    {
      name: "Stand-Up Comedy Showcase",
      dateTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
      venue: "The Laugh Lounge",
      totalSeats: 20,
      description: "An evening of laughs with rising comedy stars.",
    },
  ]

  const result = await db.collection<EventDoc>("events").insertMany(events)

  // Create seats for each event
  for (const [index, id] of Object.entries(result.insertedIds)) {
    const event = events[Number(index)]
    const seatNumbers = generateSeatNumbers(event.totalSeats)
    const seatDocs: SeatDoc[] = seatNumbers.map((seatNumber) => ({
      eventId: id,
      seatNumber,
      status: "available",
      reservationId: null,
      reservedUntil: null,
      bookedBy: null,
    }))
    await db.collection<SeatDoc>("seats").insertMany(seatDocs)
  }

  return { seeded: true, eventCount: events.length }
}
