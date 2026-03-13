"use client"

import { subDays } from "date-fns"
import type { DateRange } from "react-day-picker"

import { Button, buttonVariants } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getRangeLabel } from "@/lib/task-utils"
import { cn } from "@/lib/utils"

interface DateRangeFilterProps {
  onChange: (nextRange: DateRange | undefined) => void
  value?: DateRange
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  return (
    <div className="flex flex-col gap-3 rounded-[1.4rem] border border-border/70 bg-card/75 p-4">
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => onChange({ from: subDays(new Date(), 6), to: new Date() })}
          size="sm"
          type="button"
          variant="outline"
        >
          Last 7 days
        </Button>
        <Button
          onClick={() => onChange({ from: subDays(new Date(), 29), to: new Date() })}
          size="sm"
          type="button"
          variant="outline"
        >
          Last 30 days
        </Button>
        <Button onClick={() => onChange(undefined)} size="sm" type="button" variant="outline">
          Reset
        </Button>
      </div>

      <Popover>
        <PopoverTrigger
          className={cn(buttonVariants({ variant: "outline" }), "justify-start rounded-full")}
        >
          {getRangeLabel(value?.from, value?.to)}
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-3">
          <Calendar mode="range" numberOfMonths={2} onSelect={onChange} selected={value} />
        </PopoverContent>
      </Popover>
    </div>
  )
}
