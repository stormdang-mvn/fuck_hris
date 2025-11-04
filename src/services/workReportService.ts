import axios from 'axios'
import type { WorkReportResponse } from '@/types/work-report'

const API_BASE_URL = '/api'

export interface WorkReportRequest {
  fromDate: string // YYYY-MM-DD
  toDate: string // YYYY-MM-DD
  employeeIDs: string[]
  originalGroupID?: string[]
  projectID?: string | null
  featureID?: string | null
  workTypeID?: string | null
}

export async function getWorkBlocks(
  token: string,
  request: WorkReportRequest
): Promise<WorkReportResponse> {
  const response = await axios.post<WorkReportResponse>(
    `${API_BASE_URL}/WorkBlock/GetWorkBlocks`,
    request,
    {
      headers: {
        'authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
        'content-type': 'application/json',
        'Accept': '*/*'
      }
    }
  )
  return response.data
}
