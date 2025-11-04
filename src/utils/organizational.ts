import type { Employee, CompanyGroup } from '@/types/initial-data'

/**
 * Find all subordinates (direct and indirect) under a manager
 * @param managerId - Employee ID của manager
 * @param allEmployees - Danh sách tất cả employees
 * @param companyGroups - Danh sách company groups (organizational structure)
 * @param includeIndirect - Include indirect reports (reports of reports)
 * @returns Array of subordinate employees
 */
export function getSubordinates(
  managerId: string,
  allEmployees: Employee[],
  companyGroups: CompanyGroup[],
  includeIndirect: boolean = true
): Employee[] {
  const subordinates: Employee[] = []
  const processed = new Set<string>()

  // Helper function để tìm direct reports
  function findDirectReports(empId: string): Employee[] {
    return allEmployees.filter((emp) => {
      // Check various manager field possibilities
      const hasManager =
        (emp as any).managerID === empId ||
        (emp as any).supervisorID === empId ||
        (emp as any).reportToID === empId ||
        emp.employeeProfile?.managerID === empId
      
      return hasManager && !processed.has(emp.employeeID)
    })
  }

  // Recursive function để tìm tất cả subordinates
  function findAllSubordinates(empId: string) {
    const directReports = findDirectReports(empId)
    
    directReports.forEach((employee) => {
      if (!processed.has(employee.employeeID)) {
        processed.add(employee.employeeID)
        subordinates.push(employee)
        
        // Nếu include indirect, tiếp tục tìm subordinates của subordinate này
        if (includeIndirect) {
          findAllSubordinates(employee.employeeID)
        }
      }
    })
  }

  // Bắt đầu tìm từ manager ID
  findAllSubordinates(managerId)

  return subordinates
}

/**
 * Build organizational tree/hierarchy
 * @param managerId - Root manager ID
 * @param allEmployees - All employees
 * @param companyGroups - Company groups
 * @returns Hierarchical tree structure
 */
export interface OrgNode {
  employee: Employee
  subordinates: OrgNode[]
  level: number
}

export function buildOrgTree(
  managerId: string,
  allEmployees: Employee[],
  companyGroups: CompanyGroup[]
): OrgNode | null {
  const manager = allEmployees.find((emp) => emp.employeeID === managerId)
  if (!manager) return null

  function buildNode(employee: Employee, level: number = 0): OrgNode {
    const directReports = allEmployees.filter((emp) => {
      return (
        (emp as any).managerID === employee.employeeID ||
        (emp as any).supervisorID === employee.employeeID ||
        (emp as any).reportToID === employee.employeeID ||
        emp.employeeProfile?.managerID === employee.employeeID
      )
    })

    return {
      employee,
      level,
      subordinates: directReports.map((report) => buildNode(report, level + 1))
    }
  }

  return buildNode(manager)
}

/**
 * Get employee by ID
 * @param employeeId - Employee ID
 * @param allEmployees - All employees
 * @returns Employee or null
 */
export function getEmployeeById(employeeId: string, allEmployees: Employee[]): Employee | null {
  return allEmployees.find((emp) => emp.employeeID === employeeId) || null
}

/**
 * Get employees by company group
 * @param groupId - Company group ID
 * @param allEmployees - All employees
 * @returns Array of employees
 */
export function getEmployeesByGroup(groupId: string, allEmployees: Employee[]): Employee[] {
  return allEmployees.filter((emp) => {
    return (
      (emp as any).companyGroupID === groupId ||
      (emp as any).departmentID === groupId ||
      (emp as any).divisionID === groupId
    )
  })
}
