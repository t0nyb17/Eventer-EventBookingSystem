import { SiteHeader } from "@/components/site-header"
import { BookingFlow } from "@/components/booking-flow"

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
        <BookingFlow eventId={id} />
      </main>
    </div>
  )
}
