import apiClient from './client'
import type {
  ProjectCreate,
  ProjectUpdate,
  ProjectResponse,
  ProjectMemberResponse,
} from '@/types/api'

// ── Projects ──────────────────────────────────────────────────────────
export async function getProjects(): Promise<ProjectResponse[]> {
  const response = await apiClient.get<ProjectResponse[]>('/projects/')
  return response.data
}

export async function getProjectById(projectId: number): Promise<ProjectResponse> {
  const response = await apiClient.get<ProjectResponse>(`/projects/${projectId}`)
  return response.data
}

export async function createProject(data: ProjectCreate): Promise<ProjectResponse> {
  const response = await apiClient.post<ProjectResponse>('/projects/', data)
  return response.data
}

export async function updateProject(projectId: number, data: ProjectUpdate): Promise<ProjectResponse> {
  const response = await apiClient.patch<ProjectResponse>(`/projects/${projectId}`, data)
  return response.data
}

export async function deleteProject(projectId: number): Promise<void> {
  await apiClient.delete(`/projects/${projectId}`)
}

// ── Project Members ───────────────────────────────────────────────────
export async function getProjectMembers(projectId: number): Promise<ProjectMemberResponse[]> {
  const response = await apiClient.get<ProjectMemberResponse[]>(`/projects/${projectId}/members`)
  return response.data
}

// Note: user_id is a query param per the backend implementation
export async function addProjectMember(projectId: number, userId: number): Promise<ProjectMemberResponse> {
  const response = await apiClient.post<ProjectMemberResponse>(
    `/projects/${projectId}/members?user_id=${userId}`
  )
  return response.data
}

export async function removeProjectMember(projectId: number, userId: number): Promise<void> {
  await apiClient.delete(`/projects/${projectId}/members/${userId}`)
}

