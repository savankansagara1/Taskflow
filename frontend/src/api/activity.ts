import apiClient from './client'
import type { ActivityResponse } from '@/types/api'

export async function getTaskActivity(projectId: number, taskId: number): Promise<ActivityResponse[]> {
  const response = await apiClient.get<ActivityResponse[]>(
    `/projects/${projectId}/tasks/${taskId}/activity/`
  )
  return response.data
}

