import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getDb } from "@/lib/mongodb"
import { ensureIndexes } from "@/lib/seed"
import { signToken, setAuthCookie } from "@/lib/auth"
import type { UserDoc } from "@/lib/models"

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const name = String(body?.name ?? "").trim()
    const email = String(body?.email ?? "").trim().toLowerCase()
    const password = String(body?.password ?? "")

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 400 })
    }
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 })
    }

    await ensureIndexes()
    const db = await getDb()

    const existing = await db.collection<UserDoc>("users").findOne({ email })
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const result = await db.collection<UserDoc>("users").insertOne({
      name,
      email,
      passwordHash,
      createdAt: new Date(),
    })

    const user = { userId: result.insertedId.toString(), email, name }
    const token = signToken(user)
    await setAuthCookie(token)

    return NextResponse.json({ user })
  } catch (err) {
    console.log("register error:", (err as Error).message)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
