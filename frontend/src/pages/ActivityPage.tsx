import { useState, useEffect } from 'react'
import { getMyTasks } from '@/api/tasks'
import { getTaskActivity } from '@/api/activity'
import { getAllUsers } from '@/api/auth'
import { getErrorMessage } from '@/api/client'
import { formatRelative, getTaskKey } from '@/utils/format'
import { TaskIdBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import Select from '@/components/ui/Select'
import TaskDrawer from '@/components/tasks/TaskDrawer'
import type { TaskResponse, ActivityResponse, UserResponse } from '@/types/api'
import toast from 'react-hot-toast'

export default function ActivityPage() {
  const [tasks, setTasks] = useState<TaskResponse[]>([])
  const [selectedTaskKey, setSelectedTaskKey] = useState<string>('ALL')
  const [activities, setActivities] = useState<(ActivityResponse & { taskTitle?: string; projectId?: number })[]>([])
  const [users, setUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)

  // Drawer
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [selectedTaskProjectId, setSelectedTaskProjectId] = useState<number | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const loadActivities = async () => {
    setLoading(true)
    try {
      const [tasksData, usersData] = await Promise.all([
        getMyTasks(),
        getAllUsers().catch(() => []),
      ])

      setTasks(tasksData)
      setUsers(usersData)

      // Fetch activity for top tasks
      const allActs: (ActivityResponse & { taskTitle?: string; projectId?: number })[] = []

      await Promise.all(
        tasksData.map(async (task) => {
          try {
            const acts = await getTaskActivity(task.project_id, task.id)
            acts.forEach((a) => {
              allActs.push({
                ...a,
                taskTitle: task.title,
                projectId: task.project_id,
              })
            })
          } catch {
            // ignore
          }
        })
      )

      allActs.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setActivities(allActs)
    } catch (err: unknown) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadActivities()
  }, [])

  const getUserName = (userId: number) => {
    const found = users.find((u) => u.id === userId)
    return found ? found.username : `User #${userId}`
  }

  const filteredActivities = activities.filter((a) => {
    if (selectedTaskKey === 'ALL') return true
    return String(a.task_id) === selectedTaskKey
  })

  const handleOpenTask = (taskId: number, projectId?: number) => {
    setSelectedTaskId(taskId)
    setSelectedTaskProjectId(projectId || null)
    setDrawerOpen(true)
  }

  return (
    <div className="p-container-padding max-w-4xl mx-auto w-full space-y-stack-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-sans text-headline-lg font-bold text-primary">Activity Stream</h1>
          <p className="font-sans text-body-md text-secondary mt-1">
            Real-time audit log of comments, status transitions, and task lifecycle events.
          </p>
        </div>

        {tasks.length > 0 && (
          <div className="w-64">
            <Select
              id="filter-activity-task"
              value={selectedTaskKey}
              onChange={(e) => setSelectedTaskKey(e.target.value)}
            >
              <option value="ALL">All Active Tasks</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  TF-{t.id}: {t.title}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {/* Activity Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-card">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : filteredActivities.length > 0 ? (
          <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-4 before:w-px before:bg-surface-variant">
            {filteredActivities.map((act) => {
              const isComment = act.action.toLowerCase().includes('comment')
              const isStatus = act.action.toLowerCase().includes('status')
              const isCreated = act.action.toLowerCase().includes('create')

              const iconName = isComment
                ? 'chat_bubble_outline'
                : isStatus
                ? 'update'
                : isCreated
                ? 'add_task'
                : 'fiber_manual_record'

              return (
                <div key={act.id} className="relative flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center shrink-0 z-10">
                    <span className="material-symbols-outlined text-secondary text-[18px]">
                      {iconName}
                    </span>
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-sans text-body-md font-semibold text-primary">
                        {getUserName(act.user_id)}
                      </span>
                      <span className="font-sans text-body-md text-on-surface">
                        {act.action}
                      </span>
                      {act.taskTitle && (
                        <button
                          onClick={() => handleOpenTask(act.task_id, act.projectId)}
                          className="font-sans text-label-sm px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-primary font-medium flex items-center gap-1 transition-colors"
                        >
                          <TaskIdBadge taskId={act.task_id} className="text-[10px] px-1 py-0" />
                          <span>{act.taskTitle}</span>
                        </button>
                      )}
                    </div>
                    {act.detail && (
                      <p className="font-sans text-body-md text-secondary mt-1 bg-surface-container-low p-2 rounded border border-outline-variant inline-block">
                        {act.detail}
                      </p>
                    )}
                    <span className="font-sans text-label-sm text-secondary block mt-1">
                      {formatRelative(act.created_at)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-4xl text-outline mb-3">
              switch_account
            </span>
            <h3 className="font-sans text-headline-sm font-medium text-primary mb-1">
              No Activity Recorded
            </h3>
            <p className="font-sans text-body-md text-secondary max-w-sm mx-auto">
              Activity events are recorded when tasks are created, statuses are updated, or comments are added.
            </p>
          </div>
        )}
      </div>

      {/* Task Drawer */}
      <TaskDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        taskId={selectedTaskId}
        projectId={selectedTaskProjectId}
        onTaskUpdated={() => loadActivities()}
      />
    </div>
  )
}

