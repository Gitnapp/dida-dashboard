"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TaskItem } from "@/components/tasks/task-item"
import type { Task } from "@/lib/types"

interface RecentCompletionsProps {
  projectNames: Map<string, string>
  tasks: Task[]
}

export function RecentCompletions({
  tasks,
  projectNames,
}: RecentCompletionsProps) {
  return (
    <Card className="surface">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
          Recent changes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Completed tasks will surface here.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {tasks.map((task) => (
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
        )}
      </CardContent>
    </Card>
  )
}
