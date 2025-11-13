import axios, { type InternalAxiosRequestConfig } from 'axios'
import type { LoginRequest, LoginResponse } from '@/types/auth'
import type { GetInitialDataRequest, GetInitialDataResponse } from '@/types/initial-data'

// Use environment variable or fallback to proxy in development
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': '*/*'
  }
})

// Interceptor để thêm token vào mọi request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = token
  } else {
    config.headers.Authorization = 'null'
  }
  return config
})

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/account/signin', credentials)
    return response.data
  }
}

export const initialDataApi = {
  getInitialData: async (request: GetInitialDataRequest): Promise<GetInitialDataResponse> => {
    const response = await api.post<GetInitialDataResponse>('/Home/GetInitialData', request)
    return response.data
  }
}

export interface Holiday {
  holidayID: string
  date: string
  type: number
  description: string
  companyID: string
}

export const holidayApi = {
  getAll: async (year: number): Promise<Holiday[]> => {
    const response = await api.get<Holiday[]>(`/holiday/GetAll?year=${year}`)
    return response.data
  }
}

export interface LeaveInfo {
  annualLeave: {
    overUsedLastYear: number
    grant: number
    grantInAdvance: number
    use: number
    originUse: number
    useByMonth: number
    remain: number
    unusedAnnualLeave: number
    originUnusedAnnualLeave: number
    unusedLastYearUseThisYear: number
    usedAnnualLeave: number
  }
  refreshLeave: {
    grant: number
    use: number
    remain: number
  }
  maternityLeave: {
    use: number
    pregnancyCheckGrant: number
    pregnancyCheckPaidGrant: number
    pregnancyCheckUse: number
    birthLeaveStartDate: string | null
    birthLeaveUse: number
    birthLeaveEndDate: string | null
    fosteringChildUse: number
    childSickGrant: number
    childSickUse: number
    otherUse: number
  }
  officalLeave: {
    grant: number
    use: number
    remain: number
  }
  sickLeave: {
    grant: number
    use: number
    remain: number
  }
  congratsCondolenceLeave: {
    use: number
    birthUse: number
    birthStartDate: string | null
    birthEndDate: string | null
    marriageOwnUse: number
    marriageChildUse: number
    marriageParentsUse: number
    marriageSibilingUse: number
    funeralChildUse: number
    funeralSpouseUse: number
    funeralParentsUse: number
    funeralSiblingUse: number
    funeralGrandParentsUse: number
  }
  others: {
    grant: number
    use: number
    remain: number
  }
}

export const leaveApi = {
  getLeaveInfoByYear: async (year: number, employeeID: string): Promise<LeaveInfo> => {
    const response = await api.post<LeaveInfo>('/Leave/GetLeaveInfoByYear', {
      year,
      id: employeeID
    })
    return response.data
  }
}

export default api
