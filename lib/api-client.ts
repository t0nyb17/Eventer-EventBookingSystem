export interface ApiUser {
  userId: string
  email: string
  name: string
}

export interface ApiEvent {
  id: string
  name: string
  dateTime: string
  venue: string
  totalSeats: number
  description?: string
  availableSeats?: number
}

export type SeatStatus = "available" | "reserved" | "booked"

export interface ApiSeat {
  id: string
  seatNumber: string
  status: SeatStatus
}

export interface ApiReservation {
  id: string
  eventId: string
  seatNumbers: string[]
  expiresAt: string
}

export interface ApiBooking {
  reservationId: string
  eventId: string
  seatNumbers: string[]
  bookedAt: string
}

async function handle<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const error = new Error(data?.error || "Request failed") as Error & {
      status?: number
      unavailableSeats?: string[]
    }
    error.status = res.status
    error.unavailableSeats = data?.unavailableSeats
    throw error
  }
  return data as T
}

export const api = {
  me: () => fetch("/api/auth/me").then((r) => handle<{ user: ApiUser | null }>(r)),
  login: (email: string, password: string) =>
    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).then((r) => handle<{ user: ApiUser }>(r)),
  register: (name: string, email: string, password: string) =>
    fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    }).then((r) => handle<{ user: ApiUser }>(r)),
  logout: () => fetch("/api/auth/logout", { method: "POST" }).then((r) => handle<{ ok: boolean }>(r)),
  events: () => fetch("/api/events").then((r) => handle<{ events: ApiEvent[] }>(r)),
  event: (id: string) => fetch(`/api/events/${id}`).then((r) => handle<{ event: ApiEvent; seats: ApiSeat[] }>(r)),
  reserve: (eventId: string, seatNumbers: string[]) =>
    fetch("/api/reserve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, seatNumbers }),
    }).then((r) => handle<{ reservation: ApiReservation }>(r)),
  book: (reservationId: string) =>
    fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservationId }),
    }).then((r) => handle<{ booking: ApiBooking }>(r)),
}
