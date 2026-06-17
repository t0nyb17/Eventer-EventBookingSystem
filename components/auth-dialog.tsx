"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AuthDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (mode === "login") {
        await login(email, password)
      } else {
        await register(name, email, password)
      }
      onOpenChange(false)
      resetForm()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setName("")
    setEmail("")
    setPassword("")
    setError(null)
  }

  function switchMode() {
    setMode((m) => (m === "login" ? "register" : "login"))
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl uppercase tracking-tight">
            {mode === "login" ? "Log in" : "Sign up"}
          </DialogTitle>
          <DialogDescription className="text-pretty">
            {mode === "login"
              ? "Sign in to reserve and book your seats."
              : "Create an account to reserve and book seats."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "register" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="name" className="font-mono text-xs uppercase tracking-wide">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                autoComplete="name"
                required
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="font-mono text-xs uppercase tracking-wide">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="font-mono text-xs uppercase tracking-wide">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" disabled={submitting} className="font-mono uppercase tracking-wide">
            {submitting ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button type="button" onClick={switchMode} className="font-medium text-foreground underline underline-offset-4">
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </p>
      </DialogContent>
    </Dialog>
  )
}
