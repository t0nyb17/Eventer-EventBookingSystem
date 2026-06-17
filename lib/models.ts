import type { ObjectId } from "mongodb"

export type SeatStatus = "available" | "reserved" | "booked"

export interface EventDoc {
  _id?: ObjectId
  name: string
  dateTime: string // ISO string
  venue: string
  totalSeats: number
  description?: string
}

export interface SeatDoc {
  _id?: ObjectId
  eventId: ObjectId
  seatNumber: string
  status: SeatStatus
  // Tracks which reservation currently holds this seat (if reserved).
  reservationId?: ObjectId | null
  // Denormalized expiry to make atomic checks simple.
  reservedUntil?: Date | null
  // Set once a seat is booked.
  bookedBy?: ObjectId | null
}

export interface ReservationDoc {
  _id?: ObjectId
  userId: ObjectId
  eventId: ObjectId
  seatNumbers: string[]
  expiresAt: Date
  status: "active" | "booked" | "expired" | "cancelled"
  createdAt: Date
}

export interface UserDoc {
  _id?: ObjectId
  name: string
  email: string
  passwordHash: string
  createdAt: Date
}

// Plain JSON-safe shapes returned by the API
export interface EventJSON {
  id: string
  name: string
  dateTime: string
  venue: string
  totalSeats: number
  description?: string
  availableSeats?: number
}

export interface SeatJSON {
  id: string
  seatNumber: string
  status: SeatStatus
}
