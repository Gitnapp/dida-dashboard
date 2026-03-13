"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TaskItem } from "@/components/tasks/task-item"
import type { Task } from "@/lib/types"

interface OverdueTasksProps {
  onComplete: (task: Task) => void | Promise<void>
  projectNames: Map<string, string>
  tasks: Task[]
}

export function OverdueTasks({
  tasks,
  projectNames,
  onComplete,
}: OverdueTasksProps) {
  return (
    <Card className="surface border-destructive/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
            Overdue
          </CardTitle>
          <div className="inline-flex items-center gap-2 rounded-full border border-destructive/20 bg-destructive/10 px-3 py-1 text-xs text-destructive">
            <span className="size-2 rounded-full bg-destructive" />
            {tasks.length}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing overdue right now.</p>
        ) : (
          tasks.map((task) => (
            <TaskItem
              key={task.id}
              onComplete={onComplete}
              projectName={projectNames.get(task.projectId)}
              showProject
              task={task}
            />
          ))
        )}
      </CardContent>
    </Card>
  )
}
