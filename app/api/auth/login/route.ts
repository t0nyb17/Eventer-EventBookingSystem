import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getDb } from "@/lib/mongodb"
import { signToken, setAuthCookie } from "@/lib/auth"
import type { UserDoc } from "@/lib/models"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const email = String(body?.email ?? "").trim().toLowerCase()
    const password = String(body?.password ?? "")

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 })
    }

    const db = await getDb()
    const user = await db.collection<UserDoc>("users").findOne({ email })
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 })
    }

    const sessionUser = { userId: user._id!.toString(), email: user.email, name: user.name }
    const token = signToken(sessionUser)
    await setAuthCookie(token)

    return NextResponse.json({ user: sessionUser })
  } catch (err) {
    console.log("login error:", (err as Error).message)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
