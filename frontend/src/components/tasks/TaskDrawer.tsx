import { useState, useEffect, useCallback, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { getTaskById, changeTaskStatus, changeTaskPriority, deleteTask } from '@/api/tasks'
import { getComments, createComment, deleteComment } from '@/api/comments'
import { getTaskActivity } from '@/api/activity'
import { getProjectById, getProjects } from '@/api/projects'
import { getAllUsers } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { getErrorMessage } from '@/api/client'
import { formatDate, formatRelative, formatDueDate, getTaskKey } from '@/utils/format'
import { TaskIdBadge, StatusBadge, PriorityBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'
import type {
  TaskResponse,
  CommentResponse,
  ActivityResponse,
  ProjectResponse,
  UserResponse,
  TaskStatus,
  TaskPriority,
} from '@/types/api'
import toast from 'react-hot-toast'

interface TaskDrawerProps {
  taskId: number | null
  projectId?: number | null
  open: boolean
  onClose: () => void
  onTaskUpdated?: (task: TaskResponse) => void
  onTaskDeleted?: (taskId: number) => void
  onEditTask?: (task: TaskResponse) => void
}

export default function TaskDrawer({
  taskId,
  projectId: propProjectId,
  open,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
  onEditTask,
}: TaskDrawerProps) {
  const { user: currentUser } = useAuthStore()

  const [task, setTask] = useState<TaskResponse | null>(null)
  const [project, setProject] = useState<ProjectResponse | null>(null)
  const [comments, setComments] = useState<CommentResponse[]>([])
  const [activities, setActivities] = useState<ActivityResponse[]>([])
  const [users, setUsers] = useState<UserResponse[]>([])

  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Status & priority quick toggle dropdowns
  const [changingStatus, setChangingStatus] = useState(false)
  const [changingPriority, setChangingPriority] = useState(false)

  // Load all drawer data
  const loadDrawerData = useCallback(async () => {
    if (!taskId) return
    setLoading(true)
    setError(null)

    try {
      // 1. Fetch all users for resolving names
      const usersData = await getAllUsers()
      setUsers(usersData)

      // 2. Resolve project ID from prop or tasks/me
      let pId = propProjectId
      if (!pId) {
        // If no propProjectId, fetch task via /tasks/me or need to find project_id
        // Try fallback: we'll get it from my tasks or users
      }

      // If we have pId, fetch directly
      if (pId) {
        const [taskData, projectData, commentsData, activityData] = await Promise.all([
          getTaskById(pId, taskId),
          getProjectById(pId).catch(() => null),
          getComments(pId, taskId).catch(() => []),
          getTaskActivity(pId, taskId).catch(() => []),
        ])
        setTask(taskData)
        setProject(projectData)
        setComments(commentsData)
        setActivities(activityData)
      } else {
        const allProjects = await getProjects()
        for (const p of allProjects) {
          try {
            const t = await getTaskById(p.id, taskId)
            if (t) {
              setTask(t)
              setProject(p)
              const [c, a] = await Promise.all([
                getComments(p.id, taskId).catch(() => []),
                getTaskActivity(p.id, taskId).catch(() => []),
              ])
              setComments(c)
              setActivities(a)
              break
            }
          } catch {
            // continue search
          }
        }
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [taskId, propProjectId])

  useEffect(() => {
    if (open && taskId) {
      loadDrawerData()
      setNewComment('')
    }
  }, [open, taskId, loadDrawerData])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  // Status Change Handler
  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!task) return
    setChangingStatus(true)
    try {
      const updated = await changeTaskStatus(task.project_id, task.id, { status: newStatus })
      setTask(updated)
      onTaskUpdated?.(updated)
      toast.success(`Status updated to ${newStatus}`)
      // Refresh activity
      getTaskActivity(task.project_id, task.id)
        .then(setActivities)
        .catch(() => {})
    } catch (err: unknown) {
      toast.error(getErrorMessage(err))
    } finally {
      setChangingStatus(false)
    }
  }

  // Priority Change Handler
  const handlePriorityChange = async (newPriority: TaskPriority) => {
    if (!task) return
    setChangingPriority(true)
    try {
      const updated = await changeTaskPriority(task.project_id, task.id, { priority: newPriority })
      setTask(updated)
      onTaskUpdated?.(updated)
      toast.success(`Priority updated to ${newPriority}`)
      getTaskActivity(task.project_id, task.id)
        .then(setActivities)
        .catch(() => {})
    } catch (err: unknown) {
      toast.error(getErrorMessage(err))
    } finally {
      setChangingPriority(false)
    }
  }

  // Delete Task Handler
  const handleDeleteTask = async () => {
    if (!task) return
    if (!window.confirm('Are you sure you want to delete this task?')) return

    try {
      await deleteTask(task.project_id, task.id)
      toast.success('Task deleted')
      onTaskDeleted?.(task.id)
      onClose()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err))
    }
  }

  // Add Comment Handler
  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault()
    if (!task || !newComment.trim()) return

    setSubmittingComment(true)
    try {
      const created = await createComment(task.project_id, task.id, {
        content: newComment.trim(),
      })
      setComments((prev) => [...prev, created])
      setNewComment('')
      toast.success('Comment added')
      // Refresh activity
      getTaskActivity(task.project_id, task.id)
        .then(setActivities)
        .catch(() => {})
    } catch (err: unknown) {
      toast.error(getErrorMessage(err))
    } finally {
      setSubmittingComment(false)
    }
  }

  // Delete Comment Handler
  const handleDeleteComment = async (commentId: number) => {
    if (!task) return
    try {
      await deleteComment(task.project_id, task.id, commentId)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
      toast.success('Comment deleted')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err))
    }
  }

  const getUserName = (userId: number | null | undefined) => {
    if (!userId) return 'Unassigned'
    const found = users.find((u) => u.id === userId)
    return found ? found.username : `User #${userId}`
  }

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 bg-inverse-surface/40 z-50 flex justify-end transition-opacity"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Drawer Panel (600px desktop, full width mobile) */}
      <aside className="relative bg-surface-container-lowest w-full md:w-[600px] h-full shadow-drawer border-l border-outline-variant flex flex-col z-50 overflow-hidden">
        {/* Drawer Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-surface-variant bg-surface-container-lowest shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {task && <TaskIdBadge taskId={task.id} />}
            <h2 className="font-sans text-headline-sm font-semibold text-primary truncate m-0">
              {task?.title || 'Task Details'}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            {task && onEditTask && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditTask(task)}
                title="Edit task"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </Button>
            )}
            {task && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteTask}
                className="text-error hover:bg-error-container hover:text-error"
                title="Delete task"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </Button>
            )}
            <button
              onClick={onClose}
              className="text-secondary hover:text-primary transition-colors p-1 rounded focus:outline-none"
              aria-label="Close drawer"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>
        </header>

        {/* Drawer Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="space-y-6">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : error ? (
            <div className="p-4 rounded bg-error-container text-error text-body-md">
              {error}
            </div>
          ) : task ? (
            <>
              {/* Metadata Grid (Stitch 2-col style) */}
              <section className="grid grid-cols-2 gap-y-4 gap-x-6 bg-surface-container-low p-4 rounded border border-outline-variant">
                {/* Status */}
                <div className="flex flex-col">
                  <span className="font-sans text-label-sm text-secondary uppercase tracking-wider mb-1">
                    Status
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={task.status}
                      disabled={changingStatus}
                      onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                      className="bg-transparent border border-outline-variant rounded px-2 py-0.5 font-sans text-label-sm text-primary font-medium focus:outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>
                </div>

                {/* Priority */}
                <div className="flex flex-col">
                  <span className="font-sans text-label-sm text-secondary uppercase tracking-wider mb-1">
                    Priority
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={task.priority}
                      disabled={changingPriority}
                      onChange={(e) => handlePriorityChange(e.target.value as TaskPriority)}
                      className="bg-transparent border border-outline-variant rounded px-2 py-0.5 font-sans text-label-sm text-primary font-medium focus:outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                </div>

                {/* Assignee */}
                <div className="flex flex-col">
                  <span className="font-sans text-label-sm text-secondary uppercase tracking-wider mb-1">
                    Assignee
                  </span>
                  <div className="flex items-center gap-2">
                    <Avatar name={getUserName(task.assignee_id)} size="xs" />
                    <span className="font-sans text-body-md text-on-surface">
                      {getUserName(task.assignee_id)}
                    </span>
                  </div>
                </div>

                {/* Project */}
                <div className="flex flex-col">
                  <span className="font-sans text-label-sm text-secondary uppercase tracking-wider mb-1">
                    Project
                  </span>
                  <span className="font-sans text-body-md text-on-surface">
                    {project?.name || `Project #${task.project_id}`}
                  </span>
                </div>

                {/* Due Date */}
                <div className="flex flex-col">
                  <span className="font-sans text-label-sm text-secondary uppercase tracking-wider mb-1">
                    Due Date
                  </span>
                  <span className="font-sans text-body-md text-on-surface">
                    {task.due_date ? formatDueDate(task.due_date) : 'No due date'}
                  </span>
                </div>

                {/* Created */}
                <div className="flex flex-col">
                  <span className="font-sans text-label-sm text-secondary uppercase tracking-wider mb-1">
                    Created
                  </span>
                  <span className="font-sans text-body-md text-secondary">
                    {formatDate(task.created_at)}
                  </span>
                </div>
              </section>

              {/* Description Section */}
              <section>
                <h3 className="font-sans text-label-md font-semibold text-primary mb-2 uppercase tracking-wide">
                  Description
                </h3>
                <div className="bg-surface-container-lowest border border-outline-variant rounded p-4">
                  <p className="font-sans text-body-md text-on-surface leading-relaxed whitespace-pre-wrap">
                    {task.description || (
                      <span className="text-secondary italic">No description provided.</span>
                    )}
                  </p>
                </div>
              </section>

              <hr className="border-t border-surface-variant my-4" />

              {/* Comments Section */}
              <section>
                <h3 className="font-sans text-label-md font-semibold text-primary mb-4 uppercase tracking-wide">
                  Comments ({comments.length})
                </h3>

                <div className="space-y-4">
                  {comments.map((comment) => {
                    const isAuthor = currentUser?.id === comment.author_id
                    return (
                      <div
                        key={comment.id}
                        className="bg-surface-container-low border border-outline-variant rounded p-4 flex gap-3 items-start"
                      >
                        <Avatar name={getUserName(comment.author_id)} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-sans text-label-md font-semibold text-primary">
                              {getUserName(comment.author_id)}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-sans text-label-sm text-secondary">
                                {formatRelative(comment.created_at)}
                              </span>
                              {isAuthor && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-secondary hover:text-error transition-colors p-0.5"
                                  title="Delete comment"
                                >
                                  <span className="material-symbols-outlined text-[16px]">
                                    delete
                                  </span>
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="font-sans text-body-md text-on-surface whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    )
                  })}

                  {comments.length === 0 && (
                    <p className="text-secondary font-sans text-body-md italic text-center py-4">
                      No comments yet. Leave a note below.
                    </p>
                  )}
                </div>
              </section>

              <hr className="border-t border-surface-variant my-4" />

              {/* Activity Timeline Section (Stitch Style) */}
              <section>
                <h3 className="font-sans text-label-md font-semibold text-primary mb-4 uppercase tracking-wide">
                  Activity Timeline
                </h3>

                <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-4 before:w-px before:bg-surface-variant">
                  {activities.map((act) => {
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
                          <p className="font-sans text-body-md text-on-surface">
                            <span className="font-medium">{getUserName(act.user_id)}</span>{' '}
                            <span>{act.action}</span>
                            {act.detail && (
                              <span className="text-secondary ml-1">({act.detail})</span>
                            )}
                          </p>
                          <span className="font-sans text-label-sm text-secondary block mt-0.5">
                            {formatRelative(act.created_at)}
                          </span>
                        </div>
                      </div>
                    )
                  })}

                  {activities.length === 0 && (
                    <div className="relative flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center shrink-0 z-10">
                        <span className="material-symbols-outlined text-secondary text-[18px]">
                          history
                        </span>
                      </div>
                      <p className="font-sans text-body-md text-secondary pt-1">
                        No activity recorded yet.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : null}
        </div>

        {/* Drawer Footer (Comment Input - Stitch design) */}
        {task && (
          <div className="p-4 border-t border-surface-variant bg-surface-container-lowest shrink-0">
            <form onSubmit={handleAddComment} className="flex gap-3 items-end">
              <Avatar
                name={currentUser?.username || 'You'}
                size="sm"
                className="mb-1"
              />
              <div className="flex-1 bg-surface border border-outline-variant rounded focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <textarea
                  rows={2}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full bg-transparent border-none focus:ring-0 resize-none py-2 px-3 font-sans text-body-md text-on-surface placeholder:text-secondary outline-none"
                />
                <div className="flex justify-between items-center px-3 pb-2 pt-1 border-t border-surface-variant">
                  <div className="flex gap-1 text-secondary text-label-sm">
                    <span>Press Enter to comment</span>
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={submittingComment}
                    disabled={!newComment.trim()}
                  >
                    Comment
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}
      </aside>
    </div>,
    document.body
  )
}
