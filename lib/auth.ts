import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"

const JWT_SECRET = process.env.JWT_SECRET || process.env.MONGODB_URI || "dev-insecure-secret-change-me"
const COOKIE_NAME = "ett_token"
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export interface SessionUser {
  userId: string
  email: string
  name: string
}

export function signToken(user: SessionUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: MAX_AGE })
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  })
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionUser & { iat: number; exp: number }
    return { userId: decoded.userId, email: decoded.email, name: decoded.name }
  } catch {
    return null
  }
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) {
    throw new Error("UNAUTHORIZED")
  }
  return session
}

export function toObjectId(id: string): ObjectId {
  return new ObjectId(id)
}
