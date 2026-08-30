import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getProjectById, getProjectMembers } from '@/api/projects'
import { getProjectTasks, changeTaskStatus, deleteTask } from '@/api/tasks'
import { getAllUsers } from '@/api/auth'
import { getErrorMessage } from '@/api/client'
import { formatDate, formatDueDate, getTaskKey } from '@/utils/format'
import { StatusBadge, PriorityBadge, TaskIdBadge } from '@/components/ui/Badge'
import { Avatar, AvatarStack } from '@/components/ui/Avatar'
import { TableSkeleton, Skeleton } from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import TaskModal from '@/components/tasks/TaskModal'
import TaskDrawer from '@/components/tasks/TaskDrawer'
import MemberModal from '@/components/projects/MemberModal'
import type {
  ProjectResponse,
  TaskResponse,
  UserResponse,
  ProjectMemberResponse,
  TaskStatus,
} from '@/types/api'
import toast from 'react-hot-toast'

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const pId = Number(projectId)

  const [project, setProject] = useState<ProjectResponse | null>(null)
  const [tasks, setTasks] = useState<TaskResponse[]>([])
  const [members, setMembers] = useState<ProjectMemberResponse[]>([])
  const [users, setUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals & Drawer
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskResponse | null>(null)
  const [memberModalOpen, setMemberModalOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const loadProjectData = async () => {
    if (!pId) return
    setLoading(true)
    setError(null)
    try {
      const [projectData, tasksData, membersData, usersData] = await Promise.all([
        getProjectById(pId),
        getProjectTasks(pId),
        getProjectMembers(pId).catch(() => []),
        getAllUsers().catch(() => []),
      ])
      setProject(projectData)
      setTasks(tasksData)
      setMembers(membersData)
      setUsers(usersData)
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjectData()
  }, [pId])

  const getUserName = (userId: number | null | undefined) => {
    if (!userId) return 'Unassigned'
    const found = users.find((u) => u.id === userId)
    return found ? found.username : `User #${userId}`
  }

  const memberNames = members.map((m) => {
    const u = users.find((user) => user.id === m.user_id)
    return u ? u.username : `User #${m.user_id}`
  })

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const doneTasks = tasks.filter((t) => t.status === 'DONE').length
  const progressPercent = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0

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
      toast.success(`Task moved to ${nextStatus}`)
    } catch (err: unknown) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleDeleteTask = async (e: React.MouseEvent, taskId: number) => {
    e.stopPropagation()
    if (!window.confirm('Delete this task?')) return

    try {
      await deleteTask(pId, taskId)
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
      toast.success('Task deleted')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleOpenDrawer = (taskId: number) => {
    setSelectedTaskId(taskId)
    setDrawerOpen(true)
  }

  if (error) {
    return (
      <div className="p-container-padding max-w-7xl mx-auto">
        <div className="bg-surface-container-lowest border border-outline-variant p-8 rounded-xl text-center">
          <p className="text-error font-sans text-body-md mb-4">{error}</p>
          <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-container-padding max-w-7xl mx-auto w-full space-y-stack-lg">
      {/* Breadcrumb / Back Link */}
      <div className="flex items-center gap-2 text-label-md text-secondary">
        <Link to="/projects" className="hover:text-primary transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Projects
        </Link>
        <span>/</span>
        <span className="text-primary font-medium">{project?.name || 'Project Details'}</span>
      </div>

      {/* Project Banner Header */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-card">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        ) : project ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-surface-container-high flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-2xl">folder_managed</span>
                </div>
                <div>
                  <h1 className="font-sans text-headline-lg font-bold text-primary leading-tight">
                    {project.name}
                  </h1>
                  <p className="font-sans text-body-md text-secondary">
                    {project.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              {/* Progress and metadata */}
              <div className="flex flex-wrap items-center gap-6 pt-2 text-label-md text-secondary">
                <div className="flex items-center gap-2">
                  <span>Progress:</span>
                  <div className="w-28 h-2 bg-surface-container-highest rounded-full overflow-hidden inline-block align-middle">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="font-mono text-code text-xs text-primary font-semibold">
                    {progressPercent}%
                  </span>
                </div>
                <div>
                  <span>Tasks: </span>
                  <strong className="text-primary">{tasks.length}</strong> ({doneTasks} completed)
                </div>
                <div className="flex items-center gap-2">
                  <span>Team:</span>
                  <AvatarStack names={memberNames} max={4} size="xs" />
                  <button
                    onClick={() => setMemberModalOpen(true)}
                    className="font-sans text-label-sm text-primary underline underline-offset-2 ml-1"
                  >
                    Manage
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="md"
                icon="group"
                onClick={() => setMemberModalOpen(true)}
              >
                Team ({members.length + 1})
              </Button>
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
          </div>
        ) : null}
      </div>

      {/* Tasks Section */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-card">
        {/* Table Filters */}
        <div className="p-4 border-b border-surface-variant flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <span className="material-symbols-outlined text-secondary text-[20px]">search</span>
            <input
              type="text"
              placeholder="Search tasks by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none font-sans text-body-md text-on-surface placeholder:text-secondary focus:ring-0 flex-1"
            />
          </div>

          <div className="flex items-center gap-3">
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
                  Status
                </th>
                <th className="py-3 px-4 font-sans text-label-sm text-secondary uppercase tracking-wider">
                  Priority
                </th>
                <th className="py-3 px-4 font-sans text-label-sm text-secondary uppercase tracking-wider">
                  Assignee
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
              <TableSkeleton rows={4} cols={7} />
            ) : filteredTasks.length > 0 ? (
              <tbody className="divide-y divide-outline-variant">
                {filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => handleOpenDrawer(task.id)}
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

                    <td className="py-3 px-4" onClick={(e) => handleStatusToggle(e, task)}>
                      <StatusBadge status={task.status} className="cursor-pointer hover:opacity-80" />
                    </td>

                    <td className="py-3 px-4">
                      <PriorityBadge priority={task.priority} />
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Avatar name={getUserName(task.assignee_id)} size="xs" />
                        <span className="font-sans text-body-md text-secondary">
                          {getUserName(task.assignee_id)}
                        </span>
                      </div>
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
                          onClick={(e) => handleDeleteTask(e, task.id)}
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

        {!loading && filteredTasks.length === 0 && (
          <EmptyState
            icon="assignment"
            title="No tasks in this project"
            description="Create your first task to start organizing and tracking work."
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
        defaultProjectId={pId}
        onSuccess={() => loadProjectData()}
      />

      {/* Task Drawer */}
      <TaskDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        taskId={selectedTaskId}
        projectId={pId}
        onTaskUpdated={() => loadProjectData()}
        onTaskDeleted={() => loadProjectData()}
        onEditTask={(task) => {
          setDrawerOpen(false)
          setEditingTask(task)
          setTaskModalOpen(true)
        }}
      />

      {/* Members Modal */}
      <MemberModal
        open={memberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        project={project}
        onMembersUpdated={() => loadProjectData()}
      />
    </div>
  )
}

