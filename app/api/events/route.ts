import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { seedDatabase } from "@/lib/seed"
import type { EventDoc, EventJSON } from "@/lib/models"

// GET /api/events - list all events (auto-seeds on first run)
export async function GET() {
  try {
    const db = await getDb()

    let count = await db.collection("events").countDocuments()
    if (count === 0) {
      await seedDatabase()
      count = await db.collection("events").countDocuments()
    }

    const events = await db.collection<EventDoc>("events").find({}).sort({ dateTime: 1 }).toArray()

    // Compute available seat counts in one aggregation.
    const availability = await db
      .collection("seats")
      .aggregate([
        { $match: { status: "available" } },
        { $group: { _id: "$eventId", count: { $sum: 1 } } },
      ])
      .toArray()

    const availabilityMap = new Map(availability.map((a) => [a._id.toString(), a.count as number]))

    const json: EventJSON[] = events.map((e) => ({
      id: e._id!.toString(),
      name: e.name,
      dateTime: e.dateTime,
      venue: e.venue,
      totalSeats: e.totalSeats,
      description: e.description,
      availableSeats: availabilityMap.get(e._id!.toString()) ?? 0,
    }))

    return NextResponse.json({ events: json })
  } catch (err) {
    console.log("GET /api/events error:", (err as Error).message)
    return NextResponse.json({ error: "Failed to load events." }, { status: 500 })
  }
}
