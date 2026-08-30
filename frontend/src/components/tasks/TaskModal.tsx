import { useState, useEffect, type FormEvent } from 'react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { createTask, updateTask } from '@/api/tasks'
import { getProjects } from '@/api/projects'
import { getAllUsers } from '@/api/auth'
import { getErrorMessage } from '@/api/client'
import type { TaskResponse, TaskPriority, ProjectResponse, UserResponse } from '@/types/api'
import toast from 'react-hot-toast'

interface TaskModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (task: TaskResponse) => void
  initialTask?: TaskResponse | null
  defaultProjectId?: number | null
}

export default function TaskModal({
  open,
  onClose,
  onSuccess,
  initialTask,
  defaultProjectId,
}: TaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM')
  const [projectId, setProjectId] = useState<number | ''>('')
  const [assigneeId, setAssigneeId] = useState<number | ''>('')
  const [dueDate, setDueDate] = useState('')
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [users, setUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!initialTask

  useEffect(() => {
    if (open) {
      // Fetch projects & users for dropdowns
      getProjects()
        .then(setProjects)
        .catch(() => {})
      getAllUsers()
        .then(setUsers)
        .catch(() => {})

      if (initialTask) {
        setTitle(initialTask.title)
        setDescription(initialTask.description || '')
        setPriority(initialTask.priority)
        setProjectId(initialTask.project_id)
        setAssigneeId(initialTask.assignee_id ?? '')
        setDueDate(
          initialTask.due_date ? initialTask.due_date.slice(0, 10) : ''
        )
      } else {
        setTitle('')
        setDescription('')
        setPriority('MEDIUM')
        setProjectId(defaultProjectId || '')
        setAssigneeId('')
        setDueDate('')
      }
      setError(null)
    }
  }, [open, initialTask, defaultProjectId])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Task title is required')
      return
    }

    const targetProjectId = projectId || defaultProjectId
    if (!targetProjectId) {
      setError('Please select a project for this task')
      return
    }

    setError(null)
    setLoading(true)

    try {
      if (isEditing && initialTask) {
        const updated = await updateTask(initialTask.project_id, initialTask.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          priority: priority,
          assignee_id: assigneeId !== '' ? Number(assigneeId) : null,
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
        })
        toast.success('Task updated')
        onSuccess(updated)
      } else {
        const created = await createTask(Number(targetProjectId), {
          title: title.trim(),
          description: description.trim() || undefined,
          priority: priority,
          assignee_id: assigneeId !== '' ? Number(assigneeId) : null,
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
        })
        toast.success('Task created')
        onSuccess(created)
      }
      onClose()
    } catch (err: unknown) {
      const msg = getErrorMessage(err)
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit Task' : 'New Task'}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            {isEditing ? 'Save Changes' : 'Create Task'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-stack-md">
        {error && (
          <div className="p-3 rounded bg-error-container text-error text-label-md">
            {error}
          </div>
        )}

        {/* Project Selector (if not fixed) */}
        {!defaultProjectId && !isEditing && (
          <Select
            label="Project"
            id="task-project"
            required
            value={projectId}
            onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">Select a project...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        )}

        {/* Title */}
        <Input
          label="Task Title"
          id="task-title"
          placeholder="e.g. Implement API Rate Limiting"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Description */}
        <Textarea
          label="Description"
          id="task-description"
          placeholder="Provide context and requirements..."
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Priority */}
          <Select
            label="Priority"
            id="task-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </Select>

          {/* Assignee */}
          <Select
            label="Assignee (Optional)"
            id="task-assignee"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username}
              </option>
            ))}
          </Select>
        </div>

        {/* Due Date */}
        <Input
          label="Due Date (Optional)"
          id="task-due-date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </form>
    </Modal>
  )
}

