"use client"

import { TaskCard } from "@/components/kanban/task-card"
import type { Task } from "@/lib/types"

interface ColumnLaneProps {
  name: string
  onSelectTask: (task: Task) => void
  tasks: Task[]
}

export function ColumnLane({ name, tasks, onSelectTask }: ColumnLaneProps) {
  return (
    <section className="surface flex h-[34rem] w-80 shrink-0 flex-col overflow-hidden rounded-[1.6rem] border">
      <div className="shrink-0 border-b border-border/70 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm uppercase tracking-[0.24em] text-muted-foreground">{name}</h3>
          <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
            {tasks.length}
          </span>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks in this lane.</p>
          ) : (
            tasks.map((task) => <TaskCard key={task.id} onSelect={onSelectTask} task={task} />)
          )}
        </div>
      </div>
    </section>
  )
}
