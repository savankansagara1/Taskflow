import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register, login, getCurrentUser } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { getErrorMessage } from '@/api/client'
import { PasswordInput } from '@/components/ui/Input'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // 1. Create user account
      await register({
        username: username.trim(),
        email: email.trim(),
        password: password,
      })

      // 2. Automatically log in the user
      const tokenRes = await login({
        username: email.trim(),
        password: password,
      })

      localStorage.setItem('access_token', tokenRes.access_token)
      const userRes = await getCurrentUser()
      setAuth(tokenRes.access_token, userRes)

      toast.success('Account created successfully!')
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const msg = getErrorMessage(err)
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-on-background antialiased font-sans p-container-padding">
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant p-stack-lg rounded-xl shadow-[0px_2px_4px_rgba(0,0,0,0.05)]">
        {/* Header */}
        <div className="text-center mb-stack-lg">
          <h1 className="font-sans text-headline-lg font-bold text-primary tracking-tight">
            TaskFlow
          </h1>
          <p className="font-sans text-body-md text-secondary mt-unit">
            Create your workspace account
          </p>
        </div>

        {error && (
          <div className="mb-stack-md p-3 rounded bg-error-container text-error text-label-md flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-stack-md">
          {/* Username Field */}
          <Input
            label="Username"
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            placeholder="johndoe"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          {/* Email Field */}
          <Input
            label="Email address"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="name@company.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Password Field */}
          <div>
            <label
              className="block font-sans text-label-md font-medium text-on-surface mb-unit"
              htmlFor="password"
            >
              Password
            </label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            className="w-full h-10 mt-stack-lg"
          >
            Create Account
          </Button>
        </form>

        {/* Footer Links */}
        <div className="mt-stack-lg text-center">
          <p className="font-sans text-body-md text-secondary">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary font-medium hover:underline underline-offset-2"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
