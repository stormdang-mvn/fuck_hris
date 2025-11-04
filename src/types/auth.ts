export interface LoginRequest {
  username: string
  password: string
  rememberMe: boolean
}

export interface Operation {
  id: string
  name: string
  value: string
}

export interface Module {
  id: string
  moduleName: string
  isPermission: boolean
  sortOrder: number
}

export interface ModuleOperation {
  id: string
  module: Module
  dataValue: string | null
  isSentEmail: boolean
  operations: Array<{
    id: string
    groupModuleID: string
    groupModule: any
    operationID: string
    operation: Operation
  }>
}

export interface Permission {
  id: string
  positionJobID: string | null
  positionJob: any
  userID: string | null
  userPermission: any
  isEnabled: boolean
  isSentEmail: boolean
  moduleOperations: ModuleOperation[]
}

export interface LoginResponse {
  id: string
  email: string
  username: string
  fullName: string
  language: string
  permission: Permission
  token: string
  employeeID: string
  companyLanguage: string
  operations: Operation[]
  modules: Module[]
}

export interface User {
  id: string
  email: string
  username: string
  fullName: string
  employeeID: string
  token: string
}
