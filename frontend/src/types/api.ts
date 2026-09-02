// ── Auth Types ────────────────────────────────────────────────────────
export interface LoginRequest {
  username: string  // FastAPI OAuth2PasswordRequestForm uses 'username' field
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface UserCreate {
  username: string
  email: string
  password: string
}

export interface UserResponse {
  id: number
  username: string
  email: string
}

export interface UserUpdate {
  username?: string
  email?: string
}

export interface CurrentUser {
  id: number
  username: string
  email: string
}

// ── Forgot Password Types ─────────────────────────────────────────────
export interface ForgotPasswordRequest {
  email: string
}

export interface ForgotPasswordOtpResponse {
  message: string
  otp: string
}

export interface ForgotPasswordVerify {
  email: string
  otp: string
}

export interface ForgotPasswordReset {
  email: string
  otp: string
  new_password: string
}

// ── Project Types ─────────────────────────────────────────────────────
export interface ProjectCreate {
  name: string
  description?: string
}

export interface ProjectUpdate {
  name?: string
  description?: string
}

export interface ProjectResponse {
  id: number
  name: string
  description: string | null
  owner_id: number
  created_at: string
  updated_at: string
}

// ── Project Member Types ──────────────────────────────────────────────
export interface ProjectMemberResponse {
  id: number
  project_id: number
  user_id: number
  user?: UserResponse  // enriched client-side
}

// ── Task Types ────────────────────────────────────────────────────────
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export interface TaskCreate {
  title: string
  description?: string
  priority?: TaskPriority
  assignee_id?: number | null
  due_date?: string | null
}

export interface TaskUpdate {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  assignee_id?: number | null
  due_date?: string | null
}

export interface TaskStatusUpdate {
  status: TaskStatus
}

export interface TaskPriorityUpdate {
  priority: TaskPriority
}

export interface TaskAssign {
  assignee_id: number | null
}

export interface TaskResponse {
  id: number
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  project_id: number
  creator_id: number
  assignee_id: number | null
  due_date: string | null
  created_at: string
  updated_at: string
}

// ── Comment Types ─────────────────────────────────────────────────────
export interface CommentCreate {
  content: string
}

export interface CommentUpdate {
  content: string
}

export interface CommentResponse {
  id: number
  content: string
  task_id: number
  author_id: number
  created_at: string
  updated_at: string
  author?: UserResponse  // enriched client-side
}

// ── Activity Types ────────────────────────────────────────────────────
export interface ActivityResponse {
  id: number
  task_id: number
  user_id: number
  action: string
  detail: string | null
  created_at: string
  user?: UserResponse  // enriched client-side
}

// ── API Error ─────────────────────────────────────────────────────────
export interface ApiError {
  detail: string | { msg: string; type: string }[]
}

