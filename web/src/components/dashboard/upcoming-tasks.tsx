"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TaskItem } from "@/components/tasks/task-item"
import { groupTasksByDueDate } from "@/lib/task-utils"
import type { Task } from "@/lib/types"
import { cn } from "@/lib/utils"

interface UpcomingTasksProps {
  className?: string
  onComplete: (task: Task) => void | Promise<void>
  projectNames: Map<string, string>
  tasks: Task[]
}

export function UpcomingTasks({
  className,
  tasks,
  projectNames,
  onComplete,
}: UpcomingTasksProps) {
  const groups = groupTasksByDueDate(tasks)

  return (
    <Card className={cn("surface", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
          Upcoming 7 days
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">The next week is still clear.</p>
        ) : (
          groups.map((group) => (
            <section key={group.key} className="space-y-1.5">
              <div className="flex items-center gap-3">
                <p className="text-xs font-medium text-muted-foreground">{group.label}</p>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-1.5">
                {group.tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    compact
                    onComplete={onComplete}
                    projectName={projectNames.get(task.projectId)}
                    showProject
                    task={task}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </CardContent>
    </Card>
  )
}
