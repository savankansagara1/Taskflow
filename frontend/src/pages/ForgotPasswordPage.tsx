import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { requestPasswordReset, resetPassword } from '@/api/auth'
import { getErrorMessage } from '@/api/client'
import { PasswordInput } from '@/components/ui/Input'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

type Step = 'email' | 'show-otp' | 'reset' | 'success'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')          // OTP returned from backend
  const [otpInput, setOtpInput] = useState('') // OTP entered by user
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1: Request OTP
  const handleRequestOtp = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await requestPasswordReset({ email: email.trim() })
      setOtp(res.otp)
      setStep('show-otp')
      toast.success('OTP generated successfully!')
    } catch (err: unknown) {
      const msg = getErrorMessage(err)
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // Step 2 → Step 3: User acknowledges the OTP
  const handleProceedToReset = () => {
    setStep('reset')
  }

  // Step 3: Reset password with OTP
  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters')
      return
    }

    setLoading(true)

    try {
      await resetPassword({
        email: email.trim(),
        otp: otpInput,
        new_password: newPassword,
      })
      setStep('success')
      toast.success('Password reset successfully!')
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
            {step === 'email' && 'Reset your password'}
            {step === 'show-otp' && 'Your verification code'}
            {step === 'reset' && 'Set new password'}
            {step === 'success' && 'Password updated!'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-stack-md p-3 rounded bg-error-container text-error text-label-md flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* ── Step 1: Enter Email ──────────────────────────────────── */}
        {step === 'email' && (
          <form onSubmit={handleRequestOtp} className="space-y-stack-md">
            <Input
              label="Email address"
              id="forgot-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="w-full h-10 mt-stack-lg"
            >
              Send Verification Code
            </Button>
          </form>
        )}

        {/* ── Step 2: Show OTP ─────────────────────────────────────── */}
        {step === 'show-otp' && (
          <div className="space-y-stack-md">
            <div className="p-4 rounded-lg bg-surface-container border border-outline-variant text-center">
              <p className="font-sans text-label-md text-secondary mb-3">
                Your temporary verification code is:
              </p>
              <div className="flex items-center justify-center gap-2">
                {otp.split('').map((digit, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center justify-center w-11 h-14 bg-surface-container-lowest border-2 border-primary rounded-lg font-sans text-headline-md font-bold text-primary"
                  >
                    {digit}
                  </span>
                ))}
              </div>
              <p className="font-sans text-label-sm text-secondary mt-3">
                <span className="material-symbols-outlined text-[14px] align-middle mr-1">info</span>
                This code expires in 5 minutes
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              size="md"
              className="w-full h-10"
              onClick={handleProceedToReset}
            >
              Continue to Reset Password
            </Button>
          </div>
        )}

        {/* ── Step 3: Enter OTP + New Password ─────────────────────── */}
        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-stack-md">
            <Input
              label="Verification Code"
              id="otp-input"
              name="otp"
              type="text"
              placeholder="Enter 6-digit code"
              required
              maxLength={6}
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
            />

            <div>
              <div className="mb-unit">
                <label
                  className="block font-sans text-label-md font-medium text-on-surface"
                  htmlFor="new-password"
                >
                  New Password
                </label>
              </div>
              <PasswordInput
                id="new-password"
                name="new-password"
                autoComplete="new-password"
                placeholder="••••••••"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <div className="mb-unit">
                <label
                  className="block font-sans text-label-md font-medium text-on-surface"
                  htmlFor="confirm-password"
                >
                  Confirm New Password
                </label>
              </div>
              <PasswordInput
                id="confirm-password"
                name="confirm-password"
                autoComplete="new-password"
                placeholder="••••••••"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="w-full h-10 mt-stack-lg"
            >
              Reset Password
            </Button>
          </form>
        )}

        {/* ── Step 4: Success ──────────────────────────────────────── */}
        {step === 'success' && (
          <div className="space-y-stack-md text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[32px] text-primary">check_circle</span>
              </div>
            </div>
            <p className="font-sans text-body-md text-secondary">
              Your password has been reset successfully. You can now log in with your new password.
            </p>
            <Button
              type="button"
              variant="primary"
              size="md"
              className="w-full h-10"
              onClick={() => navigate('/login')}
            >
              Go to Login
            </Button>
          </div>
        )}

        {/* Footer Links */}
        <div className="mt-stack-lg text-center">
          <p className="font-sans text-body-md text-secondary">
            Remember your password?{' '}
            <Link
              to="/login"
              className="text-primary font-medium hover:underline underline-offset-2"
            >
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
