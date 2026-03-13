"use client"

import { useRouter } from "next/navigation"

import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCalendarDots } from "@/lib/task-utils"
import type { Task } from "@/lib/types"
import { toDayKey } from "@/lib/date"

interface CalendarMiniProps {
  tasks: Task[]
}

export function CalendarMini({ tasks }: CalendarMiniProps) {
  const router = useRouter()
  const taskDots = getCalendarDots(tasks)

  return (
    <Card className="surface">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
          Calendar mini
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          className="w-full"
          classNames={{
            root: "w-full",
            day: "group/day relative flex-1",
          }}
          mode="single"
          modifiers={{
            hasTask: (date) => taskDots.has(toDayKey(date)),
          }}
          modifiersClassNames={{
            hasTask:
              "after:absolute after:bottom-1 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-foreground after:z-20",
          }}
          onSelect={(date) => {
            if (date) {
              router.push(`/calendar?date=${toDayKey(date)}`)
            }
          }}
          selected={new Date()}
        />
      </CardContent>
    </Card>
  )
}
