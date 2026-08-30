import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { getProjectMembers, addProjectMember, removeProjectMember } from '@/api/projects'
import { getAllUsers } from '@/api/auth'
import { getErrorMessage } from '@/api/client'
import type { ProjectResponse, ProjectMemberResponse, UserResponse } from '@/types/api'
import toast from 'react-hot-toast'

interface MemberModalProps {
  open: boolean
  onClose: () => void
  project: ProjectResponse | null
  onMembersUpdated?: () => void
}

export default function MemberModal({
  open,
  onClose,
  project,
  onMembersUpdated,
}: MemberModalProps) {
  const [members, setMembers] = useState<ProjectMemberResponse[]>([])
  const [allUsers, setAllUsers] = useState<UserResponse[]>([])
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    if (!project) return
    setLoading(true)
    try {
      const [membersData, usersData] = await Promise.all([
        getProjectMembers(project.id),
        getAllUsers(),
      ])
      setMembers(membersData)
      setAllUsers(usersData)
    } catch (err: unknown) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && project) {
      loadData()
      setSelectedUserId('')
    }
  }, [open, project])

  const handleAddMember = async () => {
    if (!project || !selectedUserId) return
    setSubmitting(true)
    try {
      await addProjectMember(project.id, Number(selectedUserId))
      toast.success('Member added')
      setSelectedUserId('')
      await loadData()
      onMembersUpdated?.()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveMember = async (userId: number) => {
    if (!project) return
    try {
      await removeProjectMember(project.id, userId)
      toast.success('Member removed')
      await loadData()
      onMembersUpdated?.()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err))
    }
  }

  const getUser = (userId: number) => allUsers.find((u) => u.id === userId)
  const memberUserIds = new Set(members.map((m) => m.user_id))
  // Users not yet added to this project
  const availableUsers = allUsers.filter(
    (u) => !memberUserIds.has(u.id) && u.id !== project?.owner_id
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Team Members — ${project?.name || ''}`}
      size="md"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Add Member Form */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Select
              label="Add New Member"
              id="select-user"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Select a user...</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username} ({u.email})
                </option>
              ))}
            </Select>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={handleAddMember}
            disabled={!selectedUserId}
            loading={submitting}
          >
            Add
          </Button>
        </div>

        {/* Members List */}
        <div>
          <h3 className="font-sans text-label-md font-medium text-secondary uppercase tracking-wider mb-3">
            Current Members ({members.length + 1})
          </h3>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="divide-y divide-surface-variant border border-outline-variant rounded bg-surface-container-lowest">
              {/* Owner */}
              {project && (
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={getUser(project.owner_id)?.username || `User #${project.owner_id}`}
                      size="sm"
                    />
                    <div>
                      <p className="font-sans text-body-md font-medium text-primary">
                        {getUser(project.owner_id)?.username || `User #${project.owner_id}`}
                      </p>
                      <p className="font-sans text-label-sm text-secondary">
                        {getUser(project.owner_id)?.email || 'Project Owner'}
                      </p>
                    </div>
                  </div>
                  <span className="font-sans text-label-sm px-2 py-0.5 rounded bg-surface-container-high text-primary">
                    Owner
                  </span>
                </div>
              )}

              {/* Members */}
              {members.map((m) => {
                const user = getUser(m.user_id)
                return (
                  <div key={m.id} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={user?.username || `User #${m.user_id}`} size="sm" />
                      <div>
                        <p className="font-sans text-body-md text-on-surface">
                          {user?.username || `User #${m.user_id}`}
                        </p>
                        <p className="font-sans text-label-sm text-secondary">{user?.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(m.user_id)}
                      className="text-error hover:bg-error-container hover:text-error"
                      title="Remove member"
                    >
                      <span className="material-symbols-outlined text-[18px]">person_remove</span>
                    </Button>
                  </div>
                )
              })}

              {members.length === 0 && (
                <div className="p-4 text-center text-secondary font-sans text-body-md">
                  No additional members yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

