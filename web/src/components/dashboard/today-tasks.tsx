"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TaskItem } from "@/components/tasks/task-item"
import type { Task } from "@/lib/types"

interface TodayTasksProps {
  onComplete: (task: Task) => void | Promise<void>
  projectNames: Map<string, string>
  tasks: Task[]
}

export function TodayTasks({ tasks, projectNames, onComplete }: TodayTasksProps) {
  return (
    <Card className="surface">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
          Today
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks land on today.</p>
        ) : (
          tasks.map((task) => (
            <TaskItem
              key={task.id}
              onComplete={onComplete}
              projectName={projectNames.get(task.projectId)}
              showProject
              showDueDate={false}
              task={task}
            />
          ))
        )}
      </CardContent>
    </Card>
  )
}
