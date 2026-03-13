import { CalendarPageClient } from "@/components/calendar/calendar-page-client"

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const params = await searchParams

  return <CalendarPageClient initialDateString={params.date} />
}
