"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TaskItem } from "@/components/tasks/task-item"
import { groupTasksByCompletionDate } from "@/lib/task-utils"
import type { Task } from "@/lib/types"

interface CompletedListProps {
  projectNames: Map<string, string>
  tasks: Task[]
}

export function CompletedList({ tasks, projectNames }: CompletedListProps) {
  const groups = groupTasksByCompletionDate(tasks)

  return (
    <Card className="surface">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
          Completed history
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">No completed tasks in this range.</p>
        ) : (
          groups.map((group) => (
            <section key={group.key} className="space-y-2">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-medium">{group.label}</h3>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-3">
                {group.tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    projectName={projectNames.get(task.projectId)}
                    showCompletedTime
                    showProject
                    showDueDate={false}
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
