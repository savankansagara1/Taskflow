import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { login, getCurrentUser } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { getErrorMessage } from '@/api/client'
import { PasswordInput } from '@/components/ui/Input'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState(false)

  // Location where user was trying to go before redirect
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // FastAPI login uses OAuth2 form: username field takes email
      const tokenRes = await login({
        username: email.trim(),
        password: password,
      })

      // Store token temporarily so getCurrentUser can send it in headers
      localStorage.setItem('access_token', tokenRes.access_token)

      // Fetch user profile with token
      const userRes = await getCurrentUser()

      // Commit to Zustand auth store
      setAuth(tokenRes.access_token, userRes)
      toast.success(`Welcome back, ${userRes.username}!`)
      navigate(from, { replace: true })
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
            Sign in to your workspace
          </p>
        </div>

        {error && (
          <div className="mb-stack-md p-3 rounded bg-error-container text-error text-label-md flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {forgotPasswordNotice && (
          <div className="mb-stack-md p-3 rounded bg-surface-container text-secondary text-label-md flex items-center justify-between">
            <span>Password reset is unavailable in this environment. Please contact your workspace administrator.</span>
            <button
              onClick={() => setForgotPasswordNotice(false)}
              className="text-primary hover:opacity-70 p-1"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-stack-md">
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
            <div className="flex items-center justify-between mb-unit">
              <label
                className="block font-sans text-label-md font-medium text-on-surface"
                htmlFor="password"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setForgotPasswordNotice(true)}
                className="font-sans text-label-md text-secondary hover:text-primary transition-colors focus:outline-none"
              >
                Forgot Password?
              </button>
            </div>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
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
            Login
          </Button>
        </form>

        {/* Footer Links */}
        <div className="mt-stack-lg text-center">
          <p className="font-sans text-body-md text-secondary">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-primary font-medium hover:underline underline-offset-2"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
