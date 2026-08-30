import apiClient from './client'
import type { CommentCreate, CommentUpdate, CommentResponse } from '@/types/api'

export async function getComments(projectId: number, taskId: number): Promise<CommentResponse[]> {
  const response = await apiClient.get<CommentResponse[]>(
    `/projects/${projectId}/tasks/${taskId}/comments/`
  )
  return response.data
}

export async function createComment(
  projectId: number,
  taskId: number,
  data: CommentCreate
): Promise<CommentResponse> {
  const response = await apiClient.post<CommentResponse>(
    `/projects/${projectId}/tasks/${taskId}/comments/`,
    data
  )
  return response.data
}

export async function updateComment(
  projectId: number,
  taskId: number,
  commentId: number,
  data: CommentUpdate
): Promise<CommentResponse> {
  const response = await apiClient.patch<CommentResponse>(
    `/projects/${projectId}/tasks/${taskId}/comments/${commentId}`,
    data
  )
  return response.data
}

export async function deleteComment(
  projectId: number,
  taskId: number,
  commentId: number
): Promise<void> {
  await apiClient.delete(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`)
}

