import type { Employee, CompanyGroup, DecompressedInitialData } from '@/types/initial-data'

export interface TeamMember {
  employee: Employee
  isDirect: boolean // true if leader of a PART, false otherwise
  partName?: string // Name of the PART they belong to
  isPartLeader?: boolean // true if they are leader of the PART
}

export interface PartInfo {
  group: CompanyGroup
  leader: Employee | null
  members: Employee[]
}

export interface TeamStructure {
  team: CompanyGroup | null
  teamLeader: Employee | null
  parts: PartInfo[]
  directReports: TeamMember[] // All members in TEAM.employees (including Part Leaders)
  indirectReports: TeamMember[] // Members in PART.employees (excluding those in TEAM.employees)
  allMembers: Employee[]
}

/**
 * Build organization chart for a team leader
 * @param data Initial data from HRIS
 * @param employeeID The ID of the team leader
 * @returns Team structure with hierarchy information
 */
export function buildTeamOrgChart(
  data: DecompressedInitialData,
  employeeID: string
): TeamStructure {
  const result: TeamStructure = {
    team: null,
    teamLeader: null,
    parts: [],
    directReports: [],
    indirectReports: [],
    allMembers: []
  }

  const companyGroups = data.companyGroups?.companyGroups || []
  const employeeList = data.employeeList || []

  // Step 1: Find TEAM where leaderID = employeeID
  const myTeam = companyGroups.find(
    group => group.levelName === 'TEAM' && group.leaderID === employeeID
  )

  if (!myTeam) {
    console.log('❌ No TEAM found where you are the leader')
    return result
  }

  result.team = myTeam
  result.teamLeader = employeeList.find((emp: Employee) => emp.employeeID === employeeID) || null

  console.log('✅ Found your TEAM:', myTeam.groupName, 'ID:', myTeam.oldGroupID)

  // Step 2: Get all direct reports from TEAM.employees
  const teamEmployeeMap = new Map<string, Employee>()
  employeeList.forEach((emp: Employee) => teamEmployeeMap.set(emp.employeeID, emp))
  
  const teamDirectReports: Employee[] = []
  if (myTeam.employees && Array.isArray(myTeam.employees)) {
    myTeam.employees.forEach((empObj: any) => {
      const empId = empObj.employeeID || empObj.id
      const emp = teamEmployeeMap.get(empId)
      if (emp && emp.employeeID !== employeeID) { // Exclude yourself
        teamDirectReports.push(emp)
      }
    })
  }

  console.log(`👥 Direct team members: ${teamDirectReports.length}`)

  // Step 3: Find all PARTs that belong to this TEAM
  const teamParts = companyGroups.filter(
    (group: CompanyGroup) => group.levelName === 'PART' && group.parentGroupID === myTeam.oldGroupID
  )

  console.log(`📦 Found ${teamParts.length} PARTs in your TEAM`)

  // Step 4: Build employee lookup map for faster access
  const employeeMap = new Map<string, Employee>()
  employeeList.forEach((emp: Employee) => employeeMap.set(emp.employeeID, emp))

  // Step 5: Track which employees are Part Leaders
  const partLeaderIds = new Set<string>()
  
  // Step 6: Process each PART
  teamParts.forEach((part: CompanyGroup) => {
    const partLeader = part.leaderID ? employeeMap.get(part.leaderID) : null
    const partMembers: Employee[] = []

    // Track part leader
    if (part.leaderID) {
      partLeaderIds.add(part.leaderID)
    }

    // Get all employees in this PART
    // Note: employees is an array of objects with { id, employeeID, ... }
    if (part.employees && Array.isArray(part.employees)) {
      part.employees.forEach((empObj: any) => {
        const empId = empObj.employeeID || empObj.id // Try employeeID first, fallback to id
        const emp = employeeMap.get(empId)
        if (emp) {
          partMembers.push(emp)
        }
      })
    }

    result.parts.push({
      group: part,
      leader: partLeader || null,
      members: partMembers
    })
  })

  // Step 7: Categorize team members
  // Direct reports: All employees in TEAM.employees (including Part Leaders)
  teamDirectReports.forEach((emp: Employee) => {
    const isPartLeader = partLeaderIds.has(emp.employeeID)
    const partName = isPartLeader 
      ? result.parts.find(p => p.group.leaderID === emp.employeeID)?.group.groupName 
      : undefined

    const teamMember: TeamMember = {
      employee: emp,
      isDirect: true,
      partName: partName,
      isPartLeader: isPartLeader
    }
    result.directReports.push(teamMember)
    result.allMembers.push(emp)
  })

  // Indirect reports: Members in PARTs who are NOT in TEAM.employees
  const teamDirectReportIds = new Set(teamDirectReports.map(e => e.employeeID))
  
  result.parts.forEach((part: PartInfo) => {
    part.members.forEach((emp: Employee) => {
      // If not in direct reports and not the team leader themselves
      if (!teamDirectReportIds.has(emp.employeeID) && emp.employeeID !== employeeID) {
        const teamMember: TeamMember = {
          employee: emp,
          isDirect: false,
          partName: part.group.groupName,
          isPartLeader: false
        }
        result.indirectReports.push(teamMember)
        result.allMembers.push(emp)
      }
    })
  })

  console.log(`👥 Direct Reports (PART Leaders): ${result.directReports.length}`)
  console.log(`👥 Indirect Reports (PART Members): ${result.indirectReports.length}`)
  console.log(`👥 Total Team Members: ${result.allMembers.length}`)

  return result
}

/**
 * Get PART information for a specific employee
 */
export function getEmployeePart(
  employeeID: string,
  teamStructure: TeamStructure
): PartInfo | null {
  for (const part of teamStructure.parts) {
    const isMember = part.members.some(emp => emp.id === employeeID)
    if (isMember) {
      return part
    }
  }
  return null
}

/**
 * Check if an employee is a direct report (PART leader)
 */
export function isDirectReport(
  employeeID: string,
  teamStructure: TeamStructure
): boolean {
  return teamStructure.directReports.some(member => member.employee.employeeID === employeeID)
}

/**
 * Format org chart as text tree
 */
export function formatOrgChartAsText(teamStructure: TeamStructure): string {
  if (!teamStructure.team) {
    return 'No team found'
  }

  let text = ''
  text += `📊 ORGANIZATION CHART\n`
  text += `═══════════════════════════════════════\n\n`
  text += `🏢 TEAM: ${teamStructure.team.groupName}\n`
  
  if (teamStructure.teamLeader) {
    text += `👤 Team Leader: ${teamStructure.teamLeader.name} (${teamStructure.teamLeader.employeeCode})\n`
  }
  
  text += `\n📈 TEAM STATISTICS:\n`
  text += `   • Parts: ${teamStructure.parts.length}\n`
  text += `   • Direct Reports: ${teamStructure.directReports.length}\n`
  text += `   • Indirect Reports: ${teamStructure.indirectReports.length}\n`
  text += `   • Total Members: ${teamStructure.allMembers.length}\n`
  text += `\n`

  // List each PART
  teamStructure.parts.forEach((part, index) => {
    text += `\n📦 PART ${index + 1}: ${part.group.groupName}\n`
    text += `   Code: ${part.group.groupCode}\n`
    
    if (part.leader) {
      text += `   👤 Leader: ${part.leader.name} (${part.leader.employeeCode})\n`
    }
    
    text += `   👥 Members (${part.members.length}):\n`
    part.members.forEach(emp => {
      const isLeader = emp.employeeID === part.group.leaderID
      const prefix = isLeader ? '      ├─ 👑' : '      ├─ •'
      text += `${prefix} ${emp.name} - ${emp.employeeCode}\n`
    })
  })

  return text
}

/**
 * Export org chart data for visualization
 */
export interface OrgChartNode {
  id: string
  name: string
  title: string
  type: 'leader' | 'part-leader' | 'member'
  partName?: string
  children?: OrgChartNode[]
}

export function buildOrgChartTree(teamStructure: TeamStructure): OrgChartNode | null {
  if (!teamStructure.team || !teamStructure.teamLeader) {
    return null
  }

  const rootNode: OrgChartNode = {
    id: teamStructure.teamLeader.employeeID,
    name: teamStructure.teamLeader.name,
    title: `Team Leader - ${teamStructure.team.groupName}`,
    type: 'leader',
    children: []
  }

  // Add each PART as a subtree
  teamStructure.parts.forEach(part => {
    if (part.leader) {
      const partLeaderNode: OrgChartNode = {
        id: part.leader.employeeID,
        name: part.leader.name,
        title: `${part.group.groupName} Leader`,
        type: 'part-leader',
        partName: part.group.groupName,
        children: []
      }

      // Add members under this PART leader
      part.members.forEach(member => {
        if (member.employeeID !== part.leader?.employeeID) { // Skip the leader themselves
          partLeaderNode.children!.push({
            id: member.employeeID,
            name: member.name,
            title: part.group.groupName,
            type: 'member',
            partName: part.group.groupName
          })
        }
      })

      rootNode.children!.push(partLeaderNode)
    }
  })

  return rootNode
}
