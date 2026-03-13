"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getProjectSelectOptions } from "@/lib/task-utils"
import type { Project, TaskFiltersState } from "@/lib/types"

interface TaskFiltersProps {
  hideProjectFilter?: boolean
  onChange: (filters: TaskFiltersState) => void
  projects?: Project[]
  value: TaskFiltersState
}

export function TaskFilters({
  projects,
  value,
  onChange,
  hideProjectFilter = false,
}: TaskFiltersProps) {
  const sortedProjects = getProjectSelectOptions(projects)

  return (
    <div className="flex flex-col gap-3 rounded-[1.4rem] border border-border/70 bg-card/75 p-4 lg:flex-row lg:flex-wrap lg:items-center">
      {!hideProjectFilter ? (
        <Select
          items={[
            { value: "all", label: "All projects" },
            ...sortedProjects.map((p) => ({ value: p.id, label: p.name })),
          ]}
          onValueChange={(nextValue) =>
            onChange({
              ...value,
              projectId: nextValue === "all" ? null : nextValue,
            })
          }
          value={value.projectId ?? "all"}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {sortedProjects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      <Select
        items={[
          { value: "dueDate", label: "Sort by due date" },
          { value: "priority", label: "Sort by priority" },
          { value: "project", label: "Sort by project" },
        ]}
        onValueChange={(nextValue) =>
          onChange({
            ...value,
            sortBy: nextValue as TaskFiltersState["sortBy"],
          })
        }
        value={value.sortBy}
      >
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="dueDate">Sort by due date</SelectItem>
          <SelectItem value="priority">Sort by priority</SelectItem>
          <SelectItem value="project">Sort by project</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex flex-wrap gap-2">
        {[
          { label: "All", value: "all" },
          { label: "Active", value: "active" },
          { label: "Completed", value: "completed" },
        ].map((item) => (
          <Button
            key={item.value}
            onClick={() =>
              onChange({
                ...value,
                status: item.value as TaskFiltersState["status"],
              })
            }
            size="sm"
            type="button"
            variant={value.status === item.value ? "default" : "outline"}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { label: "Any priority", value: null },
          { label: "High", value: 5 },
          { label: "Medium", value: 3 },
          { label: "Low", value: 1 },
        ].map((item) => (
          <Button
            key={item.label}
            onClick={() =>
              onChange({
                ...value,
                priority: item.value,
              })
            }
            size="sm"
            type="button"
            variant={value.priority === item.value ? "default" : "outline"}
          >
            {item.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
