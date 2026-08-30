import { useState, useEffect, useMemo } from 'react'
import { getMyTasks, changeTaskStatus, deleteTask } from '@/api/tasks'
import { getProjects } from '@/api/projects'
import { getErrorMessage } from '@/api/client'
import { formatDueDate, getTaskKey } from '@/utils/format'
import { StatusBadge, PriorityBadge, TaskIdBadge } from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import TaskModal from '@/components/tasks/TaskModal'
import TaskDrawer from '@/components/tasks/TaskDrawer'
import type { TaskResponse, ProjectResponse, TaskStatus } from '@/types/api'
import toast from 'react-hot-toast'

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskResponse[]>([])
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL')
  const [projectFilter, setProjectFilter] = useState<string>('ALL')

  // Modals & Drawer
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskResponse | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [selectedTaskProjectId, setSelectedTaskProjectId] = useState<number | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const fetchTasks = async () => {
    setLoading(true)
    setError(null)
    try {
      const [tasksData, projectsData] = await Promise.all([
        getMyTasks(),
        getProjects().catch(() => []),
      ])
      setTasks(tasksData)
      setProjects(projectsData)
    } catch (err: unknown) {
      const msg = getErrorMessage(err)
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const projectMap = useMemo(() => {
    const map = new Map<number, string>()
    projects.forEach((p) => map.set(p.id, p.name))
    return map
  }, [projects])

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter
      const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter
      const matchesProject =
        projectFilter === 'ALL' || String(t.project_id) === projectFilter

      return matchesSearch && matchesStatus && matchesPriority && matchesProject
    })
  }, [tasks, searchQuery, statusFilter, priorityFilter, projectFilter])

  const handleStatusToggle = async (e: React.MouseEvent, task: TaskResponse) => {
    e.stopPropagation()
    const nextStatus: TaskStatus =
      task.status === 'TODO'
        ? 'IN_PROGRESS'
        : task.status === 'IN_PROGRESS'
        ? 'DONE'
        : 'TODO'

    try {
      const updated = await changeTaskStatus(task.project_id, task.id, { status: nextStatus })
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)))
      toast.success(`Status updated to ${nextStatus}`)
    } catch (err: unknown) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleDeleteTask = async (e: React.MouseEvent, task: TaskResponse) => {
    e.stopPropagation()
    if (!window.confirm('Delete this task?')) return

    try {
      await deleteTask(task.project_id, task.id)
      setTasks((prev) => prev.filter((t) => t.id !== task.id))
      toast.success('Task deleted')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleOpenDrawer = (task: TaskResponse) => {
    setSelectedTaskId(task.id)
    setSelectedTaskProjectId(task.project_id)
    setDrawerOpen(true)
  }

  return (
    <div className="p-container-padding max-w-7xl mx-auto w-full space-y-stack-lg">
      {/* Page Header (Stitch design) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-sans text-headline-lg font-bold text-primary">My Tasks</h2>
          <p className="font-sans text-body-md text-secondary mt-1">
            All tasks assigned to you across your projects.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon="add"
          onClick={() => {
            setEditingTask(null)
            setTaskModalOpen(true)
          }}
        >
          Create Task
        </Button>
      </div>

      {/* Main Card Container */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-card">
        {/* Filters Bar */}
        <div className="p-4 border-b border-surface-variant flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <span className="material-symbols-outlined text-secondary text-[20px]">search</span>
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none font-sans text-body-md text-on-surface placeholder:text-secondary focus:ring-0 flex-1"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-surface border border-outline-variant rounded px-3 py-1.5 font-sans text-label-md text-primary cursor-pointer outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-surface border border-outline-variant rounded px-3 py-1.5 font-sans text-label-md text-primary cursor-pointer outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>

            {/* Project Filter */}
            {projects.length > 0 && (
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="bg-surface border border-outline-variant rounded px-3 py-1.5 font-sans text-label-md text-primary cursor-pointer outline-none"
              >
                <option value="ALL">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Tasks Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low/50">
                <th className="py-3 px-4 font-sans text-label-sm text-secondary uppercase tracking-wider w-24">
                  Key
                </th>
                <th className="py-3 px-4 font-sans text-label-sm text-secondary uppercase tracking-wider">
                  Task Title
                </th>
                <th className="py-3 px-4 font-sans text-label-sm text-secondary uppercase tracking-wider">
                  Project
                </th>
                <th className="py-3 px-4 font-sans text-label-sm text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="py-3 px-4 font-sans text-label-sm text-secondary uppercase tracking-wider">
                  Priority
                </th>
                <th className="py-3 px-4 font-sans text-label-sm text-secondary uppercase tracking-wider">
                  Due Date
                </th>
                <th className="py-3 px-4 font-sans text-label-sm text-secondary uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>

            {loading ? (
              <TableSkeleton rows={5} cols={7} />
            ) : error ? (
              <tbody>
                <tr>
                  <td colSpan={7} className="p-8 text-center text-error font-sans text-body-md">
                    {error}
                  </td>
                </tr>
              </tbody>
            ) : filteredTasks.length > 0 ? (
              <tbody className="divide-y divide-outline-variant">
                {filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => handleOpenDrawer(task)}
                    className="hover:bg-surface transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono text-code text-secondary">
                      <TaskIdBadge taskId={task.id} />
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-sans text-body-md font-medium text-on-surface group-hover:underline">
                        {task.title}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-sans text-body-md text-secondary">
                      {projectMap.get(task.project_id) || `Project #${task.project_id}`}
                    </td>

                    <td className="py-3 px-4" onClick={(e) => handleStatusToggle(e, task)}>
                      <StatusBadge status={task.status} className="cursor-pointer hover:opacity-80" />
                    </td>

                    <td className="py-3 px-4">
                      <PriorityBadge priority={task.priority} />
                    </td>

                    <td className="py-3 px-4 font-sans text-body-md text-secondary">
                      {task.due_date ? formatDueDate(task.due_date) : '—'}
                    </td>

                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingTask(task)
                            setTaskModalOpen(true)
                          }}
                          title="Edit task"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteTask(e, task)}
                          className="text-error hover:bg-error-container hover:text-error"
                          title="Delete task"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            ) : null}
          </table>
        </div>

        {!loading && !error && filteredTasks.length === 0 && (
          <EmptyState
            icon="assignment"
            title="No tasks found"
            description="You don't have any tasks matching the current filters."
            action={{
              label: 'Create Task',
              onClick: () => {
                setEditingTask(null)
                setTaskModalOpen(true)
              },
            }}
          />
        )}
      </div>

      {/* Task Creation/Editing Modal */}
      <TaskModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        initialTask={editingTask}
        onSuccess={() => fetchTasks()}
      />

      {/* Task Drawer */}
      <TaskDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        taskId={selectedTaskId}
        projectId={selectedTaskProjectId}
        onTaskUpdated={() => fetchTasks()}
        onTaskDeleted={() => fetchTasks()}
        onEditTask={(task) => {
          setDrawerOpen(false)
          setEditingTask(task)
          setTaskModalOpen(true)
        }}
      />
    </div>
  )
}
