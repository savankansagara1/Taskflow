import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getProjects } from '@/api/projects'
import { getMyTasks, getProjectTasks } from '@/api/tasks'
import { getTaskActivity } from '@/api/activity'
import { getAllUsers } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { getErrorMessage } from '@/api/client'
import { formatDueDate, formatRelative, isOverdue } from '@/utils/format'
import { StatusBadge } from '@/components/ui/Badge'
import { CardSkeleton, TableSkeleton } from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'
import ProjectModal from '@/components/projects/ProjectModal'
import TaskModal from '@/components/tasks/TaskModal'
import TaskDrawer from '@/components/tasks/TaskDrawer'
import type { TaskResponse, ProjectResponse, ActivityResponse, UserResponse } from '@/types/api'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [myTasks, setMyTasks] = useState<TaskResponse[]>([])
  const [recentActivities, setRecentActivities] = useState<ActivityResponse[]>([])
  const [users, setUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modals & Drawer
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [selectedTaskProjectId, setSelectedTaskProjectId] = useState<number | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [projectsData, tasksData, usersData] = await Promise.all([
        getProjects(),
        getMyTasks(),
        getAllUsers().catch(() => []),
      ])

      setProjects(projectsData)
      setMyTasks(tasksData)
      setUsers(usersData)

      // Collect real activities from the user's top tasks (without inventing new endpoints)
      const topTasks = tasksData.slice(0, 5)
      const activitiesList: ActivityResponse[] = []

      await Promise.all(
        topTasks.map(async (t) => {
          try {
            const acts = await getTaskActivity(t.project_id, t.id)
            activitiesList.push(...acts)
          } catch {
            // ignore if task activity fails
          }
        })
      )

      // Sort activities descending by created_at
      activitiesList.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setRecentActivities(activitiesList.slice(0, 6))
    } catch (err: unknown) {
      const msg = getErrorMessage(err)
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const projectMap = useMemo(() => {
    const map = new Map<number, string>()
    projects.forEach((p) => map.set(p.id, p.name))
    return map
  }, [projects])

  // Calculated Real Statistics
  const stats = useMemo(() => {
    const totalProjects = projects.length
    const totalTasks = myTasks.length
    const completedTasks = myTasks.filter((t) => t.status === 'DONE').length
    const activeTasks = myTasks.filter((t) => t.status !== 'DONE').length

    // Active projects = projects having at least 1 task not in DONE status
    const activeProjects = projects.filter((p) => {
      const pTasks = myTasks.filter((t) => t.project_id === p.id)
      return pTasks.some((t) => t.status !== 'DONE') || pTasks.length === 0
    }).length

    return {
      totalProjects,
      activeProjects,
      myTasks: totalTasks,
      completedTasks,
      activeTasks,
    }
  }, [projects, myTasks])

  // Active tasks for table
  const activeTasksList = useMemo(() => {
    return myTasks.filter((t) => t.status !== 'DONE').slice(0, 6)
  }, [myTasks])

  // Tasks Due Soon (tasks with due_date in the future or today, sorted ascending)
  const tasksDueSoon = useMemo(() => {
    return myTasks
      .filter((t) => t.due_date && t.status !== 'DONE')
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
      .slice(0, 5)
  }, [myTasks])

  // Greeting time
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }, [])

  const getUserName = (userId: number | null | undefined) => {
    if (!userId) return 'User'
    const found = users.find((u) => u.id === userId)
    return found ? found.username : `User #${userId}`
  }

  const handleOpenDrawer = (task: TaskResponse) => {
    setSelectedTaskId(task.id)
    setSelectedTaskProjectId(task.project_id)
    setDrawerOpen(true)
  }

  return (
    <div className="p-container-padding max-w-7xl mx-auto space-y-stack-lg w-full">
      {/* Welcome Header (Stitch Design) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-sans text-headline-lg font-bold text-on-surface">
            {greeting}, {user?.username || 'Alex'}
          </h1>
          <p className="font-sans text-body-md text-secondary mt-1">
            Here's what's happening in your workspace today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setTaskModalOpen(true)}
          >
            Create Task
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => setProjectModalOpen(true)}
          >
            Create Project
          </Button>
        </div>
      </div>

      {/* Metrics Grid (Stitch 4-card grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            {/* Total Projects */}
            <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-lg flex flex-col justify-between shadow-[0px_2px_4px_rgba(0,0,0,0.02)]">
              <span className="font-sans text-label-md text-secondary font-medium">Total Projects</span>
              <div className="mt-2 flex items-end justify-between">
                <span className="font-sans text-display font-semibold text-primary">
                  {stats.totalProjects}
                </span>
                <span className="material-symbols-outlined text-outline text-[28px]">
                  folder_managed
                </span>
              </div>
            </div>

            {/* Active Projects */}
            <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-lg flex flex-col justify-between shadow-[0px_2px_4px_rgba(0,0,0,0.02)]">
              <span className="font-sans text-label-md text-secondary font-medium">Active Projects</span>
              <div className="mt-2 flex items-end justify-between">
                <span className="font-sans text-display font-semibold text-primary">
                  {stats.activeProjects}
                </span>
                <span className="material-symbols-outlined text-outline text-[28px]">
                  trending_up
                </span>
              </div>
            </div>

            {/* My Tasks */}
            <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-lg flex flex-col justify-between shadow-[0px_2px_4px_rgba(0,0,0,0.02)]">
              <span className="font-sans text-label-md text-secondary font-medium">My Tasks</span>
              <div className="mt-2 flex items-end justify-between">
                <span className="font-sans text-display font-semibold text-primary">
                  {stats.myTasks}
                </span>
                <span className="material-symbols-outlined text-outline text-[28px]">
                  assignment
                </span>
              </div>
            </div>

            {/* Completed Tasks */}
            <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-lg flex flex-col justify-between shadow-[0px_2px_4px_rgba(0,0,0,0.02)]">
              <span className="font-sans text-label-md text-secondary font-medium">Completed Tasks</span>
              <div className="mt-2 flex items-end justify-between">
                <span className="font-sans text-display font-semibold text-primary">
                  {stats.completedTasks}
                </span>
                <span className="material-symbols-outlined text-outline text-[28px]">
                  task_alt
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Layout Grid (2 Columns: Tasks Table + Right Sidebar Widgets) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Active Tasks Table) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden shadow-card">
            {/* Card Header */}
            <div className="px-6 py-4 border-b border-surface-variant flex justify-between items-center bg-surface">
              <h3 className="font-sans text-headline-sm font-semibold text-on-surface">
                My Active Tasks
              </h3>
              <Link
                to="/tasks"
                className="font-sans text-label-md text-secondary hover:text-primary transition-colors font-medium"
              >
                View All
              </Link>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-bright border-b border-surface-variant">
                    <th className="px-6 py-3 font-sans text-label-sm text-secondary uppercase tracking-wider w-1/2">
                      Task Name
                    </th>
                    <th className="px-6 py-3 font-sans text-label-sm text-secondary uppercase tracking-wider w-1/4">
                      Project
                    </th>
                    <th className="px-6 py-3 font-sans text-label-sm text-secondary uppercase tracking-wider w-1/4">
                      Status
                    </th>
                  </tr>
                </thead>

                {loading ? (
                  <TableSkeleton rows={4} cols={3} />
                ) : activeTasksList.length > 0 ? (
                  <tbody className="divide-y divide-surface-variant font-sans text-body-md text-on-surface">
                    {activeTasksList.map((task) => (
                      <tr
                        key={task.id}
                        onClick={() => handleOpenDrawer(task)}
                        className="hover:bg-surface transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-3 font-medium text-on-surface group-hover:underline">
                          {task.title}
                        </td>
                        <td className="px-6 py-3 text-secondary">
                          {projectMap.get(task.project_id) || `Project #${task.project_id}`}
                        </td>
                        <td className="px-6 py-3">
                          <StatusBadge status={task.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                ) : (
                  <tbody>
                    <tr>
                      <td colSpan={3} className="py-10 text-center text-secondary font-sans text-body-md">
                        No active tasks. You're all caught up!
                      </td>
                    </tr>
                  </tbody>
                )}
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (Tasks Due Soon & Activity Feed) */}
        <div className="space-y-6">
          {/* Tasks Due Soon Widget (Stitch design) */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 shadow-card">
            <h3 className="font-sans text-headline-sm font-semibold text-on-surface mb-4">
              Tasks Due Soon
            </h3>

            {loading ? (
              <div className="space-y-3">
                <div className="h-10 bg-surface-container animate-pulse rounded" />
                <div className="h-10 bg-surface-container animate-pulse rounded" />
              </div>
            ) : tasksDueSoon.length > 0 ? (
              <ul className="space-y-4">
                {tasksDueSoon.map((task) => {
                  const overdue = isOverdue(task.due_date)
                  return (
                    <li
                      key={task.id}
                      onClick={() => handleOpenDrawer(task)}
                      className="flex justify-between items-start cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <div className="pr-2">
                        <p className="font-sans text-body-md font-medium text-on-surface leading-snug">
                          {task.title}
                        </p>
                        <p className="font-sans text-label-sm text-secondary mt-0.5">
                          {projectMap.get(task.project_id) || `Project #${task.project_id}`}
                        </p>
                      </div>
                      <span
                        className={`font-sans text-label-sm whitespace-nowrap ${
                          overdue ? 'text-error font-semibold' : 'text-primary font-medium'
                        }`}
                      >
                        {formatDueDate(task.due_date)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="font-sans text-body-md text-secondary italic">
                No upcoming deadlines.
              </p>
            )}
          </div>

          {/* Activity Feed Widget (Stitch design) */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 shadow-card">
            <h3 className="font-sans text-headline-sm font-semibold text-on-surface mb-4">
              Recent Activity
            </h3>

            {loading ? (
              <div className="space-y-3">
                <div className="h-8 bg-surface-container animate-pulse rounded" />
                <div className="h-8 bg-surface-container animate-pulse rounded" />
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-2.5 before:w-px before:bg-surface-variant">
                {recentActivities.map((act) => (
                  <div key={act.id} className="relative flex gap-4">
                    <div className="w-5 h-5 rounded-full bg-surface-container-lowest border-2 border-primary flex-shrink-0 z-10 mt-0.5" />
                    <div>
                      <p className="font-sans text-body-md text-on-surface">
                        <span className="font-semibold">{getUserName(act.user_id)}</span>{' '}
                        <span>{act.action}</span>
                      </p>
                      <p className="font-sans text-label-sm text-secondary mt-0.5">
                        {formatRelative(act.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-secondary font-sans text-body-md space-y-2">
                <p>Activity timeline is recorded on individual tasks.</p>
                <p className="text-label-sm text-outline">
                  Open any task in <Link to="/tasks" className="underline text-secondary">My Tasks</Link> to view comments and update history.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Modal */}
      <ProjectModal
        open={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onSuccess={() => fetchDashboardData()}
      />

      {/* Task Modal */}
      <TaskModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSuccess={() => fetchDashboardData()}
      />

      {/* Task Drawer */}
      <TaskDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        taskId={selectedTaskId}
        projectId={selectedTaskProjectId}
        onTaskUpdated={() => fetchDashboardData()}
        onTaskDeleted={() => fetchDashboardData()}
      />
    </div>
  )
}
