import axios, { type InternalAxiosRequestConfig } from 'axios'
import type { LoginRequest, LoginResponse } from '@/types/auth'
import type { GetInitialDataRequest, GetInitialDataResponse } from '@/types/initial-data'

const api = axios.create({
  baseURL: '/api', // Sử dụng proxy thay vì URL trực tiếp
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

export default api
