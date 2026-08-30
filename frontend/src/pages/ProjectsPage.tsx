import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getProjects, deleteProject, getProjectMembers } from '@/api/projects'
import { getProjectTasks } from '@/api/tasks'
import { getAllUsers } from '@/api/auth'
import { getErrorMessage } from '@/api/client'
import { formatDate } from '@/utils/format'
import { AvatarStack } from '@/components/ui/Avatar'
import { TableSkeleton } from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import ProjectModal from '@/components/projects/ProjectModal'
import MemberModal from '@/components/projects/MemberModal'
import type { ProjectResponse, TaskResponse, UserResponse } from '@/types/api'
import toast from 'react-hot-toast'

interface ProjectWithStats extends ProjectResponse {
  tasks: TaskResponse[]
  memberNames: string[]
  progress: number
  derivedStatus: 'Planning' | 'In Progress' | 'Completed'
}

export default function ProjectsPage() {
  const navigate = useNavigate()

  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [projectStats, setProjectStats] = useState<Record<number, { tasks: TaskResponse[]; memberNames: string[] }>>({})
  const [allUsers, setAllUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchFilter, setSearchFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  // Modals
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectResponse | null>(null)
  const [memberModalOpen, setMemberModalOpen] = useState(false)
  const [managingMembersProject, setManagingMembersProject] = useState<ProjectResponse | null>(null)

  const fetchProjects = async () => {
    setLoading(true)
    setError(null)
    try {
      const [projectsData, usersData] = await Promise.all([
        getProjects(),
        getAllUsers().catch(() => []),
      ])
      setProjects(projectsData)
      setAllUsers(usersData)

      // Fetch tasks & members for each project to calculate progress & show avatars
      const statsMap: Record<number, { tasks: TaskResponse[]; memberNames: string[] }> = {}

      await Promise.all(
        projectsData.map(async (p) => {
          try {
            const [tasks, members] = await Promise.all([
              getProjectTasks(p.id).catch(() => []),
              getProjectMembers(p.id).catch(() => []),
            ])

            // Resolve member names
            const memberNames = members.map((m) => {
              const u = usersData.find((user) => user.id === m.user_id)
              return u ? u.username : `User #${m.user_id}`
            })

            statsMap[p.id] = { tasks, memberNames }
          } catch {
            statsMap[p.id] = { tasks: [], memberNames: [] }
          }
        })
      )

      setProjectStats(statsMap)
    } catch (err: unknown) {
      const msg = getErrorMessage(err)
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  // Calculate derived stats for each project
  const enrichedProjects: ProjectWithStats[] = useMemo(() => {
    return projects.map((p) => {
      const stats = projectStats[p.id] || { tasks: [], memberNames: [] }
      const totalTasks = stats.tasks.length
      const doneTasks = stats.tasks.filter((t) => t.status === 'DONE').length

      const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

      let derivedStatus: 'Planning' | 'In Progress' | 'Completed' = 'Planning'
      if (totalTasks > 0) {
        if (doneTasks === totalTasks) {
          derivedStatus = 'Completed'
        } else if (doneTasks > 0 || stats.tasks.some((t) => t.status === 'IN_PROGRESS')) {
          derivedStatus = 'In Progress'
        }
      }

      return {
        ...p,
        tasks: stats.tasks,
        memberNames: stats.memberNames,
        progress,
        derivedStatus,
      }
    })
  }, [projects, projectStats])

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return enrichedProjects.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchFilter.toLowerCase()))

      const matchesStatus =
        statusFilter === 'ALL' || p.derivedStatus === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [enrichedProjects, searchFilter, statusFilter])

  const handleDelete = async (e: React.MouseEvent, projectId: number) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this project? All associated tasks will also be deleted.')) {
      return
    }

    try {
      await deleteProject(projectId)
      setProjects((prev) => prev.filter((p) => p.id !== projectId))
      toast.success('Project deleted')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleEdit = (e: React.MouseEvent, project: ProjectResponse) => {
    e.stopPropagation()
    setEditingProject(project)
    setProjectModalOpen(true)
  }

  const handleManageMembers = (e: React.MouseEvent, project: ProjectResponse) => {
    e.stopPropagation()
    setManagingMembersProject(project)
    setMemberModalOpen(true)
  }

  return (
    <div className="p-container-padding max-w-7xl mx-auto w-full">
      {/* Page Header (Stitch design) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-stack-lg">
        <div>
          <h2 className="font-sans text-headline-lg font-bold text-primary">Projects</h2>
          <p className="font-sans text-body-md text-secondary mt-1">
            Manage and track all team initiatives.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant text-primary font-sans text-label-md px-3 py-2 rounded focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="In Progress">In Progress</option>
            <option value="Planning">Planning</option>
            <option value="Completed">Completed</option>
          </select>

          {/* New Project Button */}
          <Button
            variant="primary"
            size="md"
            icon="add"
            onClick={() => {
              setEditingProject(null)
              setProjectModalOpen(true)
            }}
          >
            New Project
          </Button>
        </div>
      </div>

      {/* Projects Table Container */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-card">
        {/* Search Bar inside table */}
        <div className="p-4 border-b border-surface-variant flex items-center gap-3">
          <span className="material-symbols-outlined text-secondary text-[20px]">search</span>
          <input
            type="text"
            placeholder="Filter projects by name or description..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none font-sans text-body-md text-on-surface placeholder:text-secondary focus:ring-0"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low/50">
                <th className="py-3 px-4 font-sans text-label-sm text-secondary uppercase tracking-wider">
                  Project Name
                </th>
                <th className="py-3 px-4 font-sans text-label-sm text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="py-3 px-4 font-sans text-label-sm text-secondary uppercase tracking-wider">
                  Progress
                </th>
                <th className="py-3 px-4 font-sans text-label-sm text-secondary uppercase tracking-wider">
                  Team
                </th>
                <th className="py-3 px-4 font-sans text-label-sm text-secondary uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="py-3 px-4 font-sans text-label-sm text-secondary uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>

            {loading ? (
              <TableSkeleton rows={4} cols={6} />
            ) : error ? (
              <tbody>
                <tr>
                  <td colSpan={6} className="p-8 text-center text-error font-sans text-body-md">
                    {error}
                  </td>
                </tr>
              </tbody>
            ) : filteredProjects.length > 0 ? (
              <tbody className="divide-y divide-outline-variant">
                {filteredProjects.map((project) => {
                  const isCompleted = project.derivedStatus === 'Completed'
                  return (
                    <tr
                      key={project.id}
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="hover:bg-surface transition-colors group cursor-pointer"
                    >
                      {/* Project Name & Icon */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                            <span className="material-symbols-outlined text-[18px]">
                              {isCompleted ? 'verified' : 'folder_managed'}
                            </span>
                          </div>
                          <div>
                            <p
                              className={`font-sans text-label-md font-semibold text-primary group-hover:underline ${
                                isCompleted ? 'line-through opacity-75' : ''
                              }`}
                            >
                              {project.name}
                            </p>
                            {project.description && (
                              <p className="font-sans text-label-sm text-secondary font-normal truncate max-w-xs">
                                {project.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {project.derivedStatus === 'Completed' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary text-on-primary font-sans text-label-sm">
                            Completed
                          </span>
                        ) : project.derivedStatus === 'In Progress' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-highest text-primary font-sans text-label-sm">
                            In Progress
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-outline-variant text-secondary font-sans text-label-sm bg-surface">
                            Planning
                          </span>
                        )}
                      </td>

                      {/* Progress Bar */}
                      <td className="py-3 px-4 w-48">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-300"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                          <span className="font-mono text-code text-secondary text-xs w-8 text-right">
                            {project.progress}%
                          </span>
                        </div>
                      </td>

                      {/* Team Avatars */}
                      <td className="py-3 px-4">
                        {project.memberNames.length > 0 ? (
                          <AvatarStack names={project.memberNames} max={3} size="xs" />
                        ) : (
                          <span className="font-sans text-label-sm text-secondary">Owner only</span>
                        )}
                      </td>

                      {/* Last Updated */}
                      <td className="py-3 px-4 font-sans text-body-md text-secondary">
                        {formatDate(project.updated_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleManageMembers(e, project)}
                            title="Manage team members"
                          >
                            <span className="material-symbols-outlined text-[18px]">group_add</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleEdit(e, project)}
                            title="Edit project"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDelete(e, project.id)}
                            className="text-error hover:bg-error-container hover:text-error"
                            title="Delete project"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            ) : null}
          </table>
        </div>

        {/* Empty State (Matching Stitch Design) */}
        {!loading && !error && filteredProjects.length === 0 && (
          <EmptyState
            icon="folder_off"
            title="No projects found"
            description="Get started by creating a new project to track your team's work and collaborate effectively."
            action={{
              label: 'Create New Project',
              onClick: () => {
                setEditingProject(null)
                setProjectModalOpen(true)
              },
            }}
          />
        )}
      </div>

      {/* Project Modal */}
      <ProjectModal
        open={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        initialProject={editingProject}
        onSuccess={() => fetchProjects()}
      />

      {/* Member Modal */}
      <MemberModal
        open={memberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        project={managingMembersProject}
        onMembersUpdated={() => fetchProjects()}
      />
    </div>
  )
}
