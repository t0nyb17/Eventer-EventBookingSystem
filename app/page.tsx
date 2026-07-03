import { SiteHeader } from "@/components/site-header"
import { EventsList } from "@/components/events-list"

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
        <section className="flex flex-col gap-3 border-b border-border pb-10">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Live seat booking
          </span>
          <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-5xl">
            Find your seat. Reserve it. Book it.
          </h1>
          <p className="max-w-2xl text-pretty text-muted-foreground">
            Browse upcoming events, pick your seats from a live map, and lock them in with a
            10-minute reservation hold before you confirm.
          </p>
        </section>

        <section className="pt-10">
          <h2 className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Upcoming events
          </h2>
          <EventsList />
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6 font-mono text-xs uppercase tracking-wide text-muted-foreground">
          <span>Eventer</span>
          <span>Built with Next.js + MongoDB by tnmybngr github:t0nyb17</span>
        </div>
      </footer>
    </div>
  )
}
