"use client"

import { useState } from "react"
import Link from "next/link"
import { Ticket } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { AuthDialog } from "@/components/auth-dialog"
import { Button } from "@/components/ui/button"

export function SiteHeader() {
  const { user, logout, loading } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Ticket className="size-5" aria-hidden="true" />
          <span className="font-mono text-base font-semibold uppercase tracking-tight">Eventer</span>
        </Link>

        <div className="flex items-center gap-3">
          {loading ? null : user ? (
            <>
              <span className="hidden font-mono text-xs uppercase tracking-wide text-muted-foreground sm:inline">
                {user.name}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                className="font-mono text-xs uppercase tracking-wide"
              >
                Log out
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => setAuthOpen(true)}
              className="font-mono text-xs uppercase tracking-wide"
            >
              Log in
            </Button>
          )}
        </div>
      </div>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </header>
  )
}
