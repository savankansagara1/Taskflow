import { useState, useEffect, type FormEvent } from 'react'
import { useAuthStore } from '@/store/authStore'
import { updateUser, getCurrentUser } from '@/api/auth'
import { getErrorMessage } from '@/api/client'
import { Avatar } from '@/components/ui/Avatar'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()

  const [username, setUsername] = useState(user?.username || '')
  const [email, setEmail] = useState(user?.email || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setUsername(user.username)
      setEmail(user.email)
    }
  }, [user])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError(null)
    try {
      // Carefully update only current user's profile
      const updated = await updateUser(user.id, {
        username: username.trim(),
        email: email.trim(),
      })

      setUser({
        id: updated.id,
        username: updated.username,
        email: updated.email,
      })

      toast.success('Profile updated successfully')
    } catch (err: unknown) {
      const msg = getErrorMessage(err)
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-container-padding max-w-3xl mx-auto w-full space-y-stack-lg">
      <div>
        <h1 className="font-sans text-headline-lg font-bold text-primary">Profile</h1>
        <p className="font-sans text-body-md text-secondary mt-1">
          Manage your personal account details.
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-card space-y-6">
        {/* User Identity Header */}
        <div className="flex items-center gap-5 pb-6 border-b border-surface-variant">
          <Avatar name={user?.username || 'User'} size="md" className="w-16 h-16 text-xl" />
          <div>
            <h2 className="font-sans text-headline-sm font-semibold text-primary">
              {user?.username}
            </h2>
            <p className="font-sans text-body-md text-secondary">{user?.email}</p>
            <span className="inline-block mt-2 font-mono text-code text-xs px-2 py-0.5 rounded bg-surface-container text-secondary">
              User ID #{user?.id}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded bg-error-container text-error text-label-md">
            {error}
          </div>
        )}

        {/* Update Form */}
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <Input
            label="Username"
            id="profile-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <Input
            label="Email Address"
            id="profile-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="pt-2">
            <Button type="submit" variant="primary" size="md" loading={loading}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

