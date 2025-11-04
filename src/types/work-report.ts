export interface ReportStatus {
  requesterID: string
  fromDate: string
  toDate: string
  status: number
}

export interface WorkBlock {
  id: string
  status: boolean
  assigneeID: string
  reporterID: string
  originalProjectID: string
  workTypeID: string
  featureID: string
  subFeatureID: string
  targetID: string | null
  cityID: string | null
  startDate: string
  endDate: string
  hours: number
  type: number
  realData: number
  description: string
  task: any | null
  createDate: string
}

export interface WorkReportResponse {
  employeeIDs: string[]
  reportStatus: ReportStatus[]
  wBlocks: WorkBlock[] // API returns "wBlocks", not "workBlocks"
}

export interface EmployeeWorkSummary {
  employeeID: string
  employeeName: string
  employeeAvatar?: string
  totalHours: number
  workDays: number
  workBlocks: WorkBlock[]
}
