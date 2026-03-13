"use client"

import { ColumnLane } from "@/components/kanban/column-lane"
import type { Column, Task } from "@/lib/types"

interface BoardProps {
  columns: Column[]
  onSelectTask: (task: Task) => void
  tasks: Task[]
}

export function Board({ columns, tasks, onSelectTask }: BoardProps) {
  const lanes = columns.map((column) => ({
    id: column.id,
    name: column.name,
    tasks: tasks.filter((task) => task.columnId === column.id && task.status === 0),
  }))
  const uncategorizedTasks = tasks.filter((task) => task.status === 0 && !task.columnId)

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-4">
        {lanes.map((lane) => (
          <ColumnLane
            key={lane.id}
            name={lane.name}
            onSelectTask={onSelectTask}
            tasks={lane.tasks}
          />
        ))}
        {uncategorizedTasks.length ? (
          <ColumnLane
            name="Uncategorized"
            onSelectTask={onSelectTask}
            tasks={uncategorizedTasks}
          />
        ) : null}
      </div>
    </div>
  )
}
