"use client"

import { FormEvent, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getProjectSelectOptions } from "@/lib/task-utils"
import type { Project } from "@/lib/types"

interface AddTaskRowProps {
  defaultProjectId?: string | null
  onCreate: (payload: { content?: string; projectId: string; title: string }) => Promise<void>
  projects?: Project[]
}

export function AddTaskRow({
  projects,
  onCreate,
  defaultProjectId = null,
}: AddTaskRowProps) {
  const [title, setTitle] = useState("")
  const [projectId, setProjectId] = useState(defaultProjectId ?? projects?.[0]?.id ?? "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!title.trim() || !projectId) {
      setError("Choose a project and enter a title.")
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await onCreate({
        projectId,
        title,
      })
      setTitle("")
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to create task.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const sortedProjects = getProjectSelectOptions(projects)

  return (
    <form className="surface space-y-3 rounded-[1.6rem] border p-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-3 lg:flex-row">
        <Input
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a task title"
          value={title}
        />
        <Select
          items={sortedProjects.map((p) => ({ value: p.id, label: p.name }))}
          onValueChange={(nextValue) => setProjectId(nextValue ?? "")}
          value={projectId}
        >
          <SelectTrigger className="w-full lg:w-56">
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {sortedProjects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Creating..." : "Create task"}
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  )
}
