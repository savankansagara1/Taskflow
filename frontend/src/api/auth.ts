import apiClient from './client'
import type {
  LoginRequest,
  TokenResponse,
  UserCreate,
  UserResponse,
  CurrentUser,
  UserUpdate,
  ForgotPasswordRequest,
  ForgotPasswordOtpResponse,
  ForgotPasswordVerify,
  ForgotPasswordReset,
} from '@/types/api'

// ── Login (OAuth2PasswordRequestForm — form-encoded) ──────────────────
export async function login(data: LoginRequest): Promise<TokenResponse> {
  const formData = new URLSearchParams()
  formData.append('username', data.username)  // FastAPI uses 'username' for email
  formData.append('password', data.password)

  const response = await apiClient.post<TokenResponse>('/users/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return response.data
}

// ── Register ──────────────────────────────────────────────────────────
export async function register(data: UserCreate): Promise<UserResponse> {
  const response = await apiClient.post<UserResponse>('/users/', data)
  return response.data
}

// ── Get current user ──────────────────────────────────────────────────
export async function getCurrentUser(): Promise<CurrentUser> {
  const response = await apiClient.get<CurrentUser>('/users/me')
  return response.data
}

// ── Get user by ID ────────────────────────────────────────────────────
export async function getUserById(userId: number): Promise<UserResponse> {
  const response = await apiClient.get<UserResponse>(`/users/${userId}`)
  return response.data
}

// ── Get all users (for assignee dropdown) ────────────────────────────
export async function getAllUsers(): Promise<UserResponse[]> {
  const response = await apiClient.get<UserResponse[]>('/users/')
  return response.data
}

// ── Update user ───────────────────────────────────────────────────────
export async function updateUser(userId: number, data: UserUpdate): Promise<UserResponse> {
  const response = await apiClient.patch<UserResponse>(`/users/${userId}`, data)
  return response.data
}

// ── Forgot Password ──────────────────────────────────────────────────
export async function requestPasswordReset(data: ForgotPasswordRequest): Promise<ForgotPasswordOtpResponse> {
  const response = await apiClient.post<ForgotPasswordOtpResponse>('/users/forgot-password', data)
  return response.data
}

export async function verifyOtp(data: ForgotPasswordVerify): Promise<{ message: string; valid: boolean }> {
  const response = await apiClient.post<{ message: string; valid: boolean }>('/users/verify-otp', data)
  return response.data
}

export async function resetPassword(data: ForgotPasswordReset): Promise<{ message: string }> {
  const response = await apiClient.post<{ message: string }>('/users/reset-password', data)
  return response.data
}

