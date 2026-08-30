import apiClient from './client'
import type {
  TaskCreate,
  TaskUpdate,
  TaskStatusUpdate,
  TaskPriorityUpdate,
  TaskAssign,
  TaskResponse,
} from '@/types/api'

// ── My Tasks (across all projects) ───────────────────────────────────
export async function getMyTasks(): Promise<TaskResponse[]> {
  const response = await apiClient.get<TaskResponse[]>('/tasks/me')
  return response.data
}

// ── Project Tasks ─────────────────────────────────────────────────────
export async function getProjectTasks(projectId: number): Promise<TaskResponse[]> {
  const response = await apiClient.get<TaskResponse[]>(`/projects/${projectId}/tasks/`)
  return response.data
}

export async function getTaskById(projectId: number, taskId: number): Promise<TaskResponse> {
  const response = await apiClient.get<TaskResponse>(`/projects/${projectId}/tasks/${taskId}`)
  return response.data
}

export async function createTask(projectId: number, data: TaskCreate): Promise<TaskResponse> {
  const response = await apiClient.post<TaskResponse>(`/projects/${projectId}/tasks/`, data)
  return response.data
}

export async function updateTask(projectId: number, taskId: number, data: TaskUpdate): Promise<TaskResponse> {
  const response = await apiClient.patch<TaskResponse>(`/projects/${projectId}/tasks/${taskId}`, data)
  return response.data
}

export async function deleteTask(projectId: number, taskId: number): Promise<void> {
  await apiClient.delete(`/projects/${projectId}/tasks/${taskId}`)
}

export async function changeTaskStatus(
  projectId: number,
  taskId: number,
  data: TaskStatusUpdate
): Promise<TaskResponse> {
  const response = await apiClient.patch<TaskResponse>(
    `/projects/${projectId}/tasks/${taskId}/status`,
    data
  )
  return response.data
}

export async function changeTaskPriority(
  projectId: number,
  taskId: number,
  data: TaskPriorityUpdate
): Promise<TaskResponse> {
  const response = await apiClient.patch<TaskResponse>(
    `/projects/${projectId}/tasks/${taskId}/priority`,
    data
  )
  return response.data
}

export async function assignTask(
  projectId: number,
  taskId: number,
  data: TaskAssign
): Promise<TaskResponse> {
  const response = await apiClient.patch<TaskResponse>(
    `/projects/${projectId}/tasks/${taskId}/assign`,
    data
  )
  return response.data
}

