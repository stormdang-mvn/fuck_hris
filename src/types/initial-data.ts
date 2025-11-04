export interface GetInitialDataRequest {
  hashValue: string | null
  language: {
    key: string | null
  }
}

export interface GetInitialDataResponse {
  initialCompressedData?: string // Base64 compressed data
  hashValue: string
  hashMatched: boolean
}

export interface FieldDataValue {
  id: string
  value: string
  [key: string]: any
}

export interface FieldConfig {
  id: string
  fieldName: string
  fieldDataValues: FieldDataValue[]
  [key: string]: any
}

export interface CompanyGroupEmployee {
  id: string
  employeeID: string
  companyGroupID: string
  mainGroup: boolean
  fromDate: string
  toDate: string
  isInactive: boolean
  [key: string]: any
}

export interface CompanyGroup {
  id: string
  name: string
  groupName: string
  groupCode: string
  orgCode?: string
  levelName: string // "TEAM", "PART", etc.
  levelNameID?: string
  leaderID?: string
  oldGroupID?: string
  parentGroupID?: string
  employees?: CompanyGroupEmployee[] // Array of employee objects, not just IDs
  status?: number
  email?: string
  groupDesc?: string
  fromDate?: string
  toDate?: string
  isInactive?: boolean
  [key: string]: any
}

export interface EmployeeProfile {
  pictureUrl?: string
  position?: string
  positionID?: string
  [key: string]: any
}

export interface Employee {
  employeeID: string // Primary identifier for employee
  userID: string // Reference to user account
  employeeCode: string
  englishName: string
  loginID: string
  name: string
  status: string | number
  email?: string
  dateOfJoin?: string
  dateOfResignation?: string
  salaryType?: any
  employeeProfile: EmployeeProfile
  subsidiaryCompanyID?: string
  orgCompanyID?: string
  teamParts?: any[]
  [key: string]: any
}

export interface SimpleEmployee {
  id: string
  name: string
  employeeCode: string
  [key: string]: any
}

export interface WorkWeek {
  [key: string]: any
}

export interface OrgConfig {
  [key: string]: any
}

export interface EmployeeGlobal {
  [key: string]: any
}

export interface CompanyGroupsData {
  companyGroups: CompanyGroup[]
  approvalChange?: any
  waitingApprovals?: any
  waitingApprovalID?: any
  files?: any
  [key: string]: any
}

export interface DecompressedInitialData {
  companyGroups: CompanyGroupsData
  employeeList: Employee[]
  fieldConfigs: FieldConfig[]
  listWorkWeek: WorkWeek[]
  orgConfigs: OrgConfig[]
  employeeGlobals: EmployeeGlobal[]
}

export interface CachedInitialData {
  fieldConfigs: FieldConfig[]
  companyGroups: CompanyGroupsData
  listWorkWeek: WorkWeek[]
  simpleEmpList: SimpleEmployee[]
  orgConfigs: OrgConfig[]
  employeeGlobals: EmployeeGlobal[]
  employeeList: Employee[]
}
