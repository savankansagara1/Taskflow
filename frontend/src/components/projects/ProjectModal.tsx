import { useState, useEffect, type FormEvent } from 'react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import { createProject, updateProject } from '@/api/projects'
import { getErrorMessage } from '@/api/client'
import type { ProjectResponse } from '@/types/api'
import toast from 'react-hot-toast'

interface ProjectModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (project: ProjectResponse) => void
  initialProject?: ProjectResponse | null
}

export default function ProjectModal({
  open,
  onClose,
  onSuccess,
  initialProject,
}: ProjectModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!initialProject

  useEffect(() => {
    if (initialProject) {
      setName(initialProject.name)
      setDescription(initialProject.description || '')
    } else {
      setName('')
      setDescription('')
    }
    setError(null)
  }, [initialProject, open])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Project name is required')
      return
    }

    setError(null)
    setLoading(true)

    try {
      if (isEditing && initialProject) {
        const updated = await updateProject(initialProject.id, {
          name: name.trim(),
          description: description.trim() || undefined,
        })
        toast.success('Project updated')
        onSuccess(updated)
      } else {
        const created = await createProject({
          name: name.trim(),
          description: description.trim() || undefined,
        })
        toast.success('Project created')
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
      title={isEditing ? 'Edit Project' : 'New Project'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            {isEditing ? 'Save Changes' : 'Create Project'}
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

        <Input
          label="Project Name"
          id="project-name"
          placeholder="e.g. Website Redesign"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Textarea
          label="Description (Optional)"
          id="project-description"
          placeholder="Brief description of the initiative..."
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </form>
    </Modal>
  )
}

