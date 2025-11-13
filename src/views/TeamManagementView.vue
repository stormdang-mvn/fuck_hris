<template>
  <div class="team-management">
    <!-- Header -->
    <PageHeader>
      <template #left>
        <div class="page-title">
          <div class="title-row">
            <router-link to="/" class="back-button">
              ← Back
            </router-link>
            <h1>👥 Team Management</h1>
          </div>
          <p class="subtitle">Employee profiles and leave information</p>
        </div>
      </template>
    </PageHeader>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading team data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-box">
        ❌ {{ error }}
        <button @click="loadTeamData" class="retry-button">🔄 Retry</button>
      </div>
    </div>

    <!-- Team Table -->
    <div v-else-if="teamMembers.length > 0" class="team-container">
      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-icon">👥</div>
          <div class="summary-value">{{ teamMembers.length }}</div>
          <div class="summary-label">Team Members</div>
        </div>
        <div class="summary-card highlight">
          <div class="summary-icon">📅</div>
          <div class="summary-value">{{ totalLeaveDaysUsed.toFixed(1) }}</div>
          <div class="summary-label">Total Days Used</div>
        </div>
        <div class="summary-card accent">
          <div class="summary-icon">🏖️</div>
          <div class="summary-value">{{ totalLeaveDaysRemaining.toFixed(1) }}</div>
          <div class="summary-label">Total Days Remaining</div>
        </div>
      </div>

      <!-- Employee Table -->
      <div class="table-container">
        <table class="team-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Name</th>
              <th>English Name</th>
              <th>Birth Year</th>
              <th>Seniority</th>
              <th>Job Grade</th>
              <th>Grade Seniority</th>
              <th>Part</th>
              <th>Leave Days Used</th>
              <th>Leave Days Available</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(member, index) in teamMembers" 
              :key="member.employeeID"
              :style="{ animationDelay: `${index * 0.05}s` }"
              class="table-row-animated"
            >
              <td class="text-center">{{ index + 1 }}</td>
              <td>
                <div class="employee-cell">
                  <img 
                    v-if="member.avatar" 
                    :src="member.avatar" 
                    :alt="member.name"
                    class="employee-avatar"
                    @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"
                  />
                  <div 
                    v-else 
                    class="employee-avatar avatar-placeholder"
                  >
                    {{ member.name.charAt(0).toUpperCase() }}
                  </div>
                  <div class="employee-name">{{ member.name }}</div>
                </div>
              </td>
              <td>{{ member.englishName || '-' }}</td>
              <td class="text-center">{{ member.birthYear }}</td>
              <td class="text-center">
                <span class="seniority-badge">{{ member.seniority }}</span>
              </td>
              <td class="text-center">
                <span class="grade-badge" :class="member.jobGrade.toLowerCase()">{{ member.jobGrade }}</span>
              </td>
              <td class="text-center">
                <span class="grade-seniority-badge">{{ member.gradeSeniority }}</span>
              </td>
              <td>{{ member.partName || '-' }}</td>
              <td class="text-center">
                <span class="leave-badge used">{{ member.daysUsed.toFixed(1) }}</span>
              </td>
              <td class="text-center">
                <span class="leave-badge remaining">{{ member.daysRemaining.toFixed(1) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-icon">📭</div>
      <p>No team members found</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useInitialDataStore } from '@/stores/initialData'
import { buildTeamOrgChart } from '@/utils/organizationChart'
import { leaveApi } from '@/services/api'
import PageHeader from '@/components/PageHeader.vue'

const authStore = useAuthStore()
const initialDataStore = useInitialDataStore()

interface TeamMember {
  employeeID: string
  name: string
  englishName: string
  avatar?: string
  birthYear: number
  dateOfJoin: string
  seniority: string
  jobGrade: string
  gradeSeniority: string
  partName: string
  daysUsed: number
  daysRemaining: number
}

const loading = ref(false)
const error = ref<string | null>(null)
const teamMembers = ref<TeamMember[]>([])

const totalLeaveDaysUsed = computed(() => {
  return teamMembers.value.reduce((sum, member) => sum + member.daysUsed, 0)
})

const totalLeaveDaysRemaining = computed(() => {
  return teamMembers.value.reduce((sum, member) => sum + member.daysRemaining, 0)
})

// Job Grade mapping - match với fieldDataValues trong initialData
const gradeMap: Record<string, string> = {
  'ecd4977e-8f28-4c84-8301-eb5ac1ddacb0': 'Senior',
  'd499d1dd-147d-4287-a6c8-37571066f2e7': 'IM',
  'c3d044ba-a09d-4255-a919-d09222d9eba8': 'JR'
}

// PART level ID
const PART_LEVEL_ID = '15c42a23-9776-463b-8127-0aecd7b0babe'

function getJobGradeName(jobGradeID?: string): string {
  if (!jobGradeID) return 'N/A'
  return gradeMap[jobGradeID] || 'Unknown'
}

function getPartName(teamParts?: any[]): string {
  if (!teamParts || teamParts.length === 0) return 'N/A'
  
  // Find the PART level group in teamParts
  const partGroup = teamParts.find(tp => tp.levelNameID === PART_LEVEL_ID)
  return partGroup?.groupName || 'N/A'
}

function getBirthYear(emp: any): number {
  // Try employeeProfile.birthDate first
  if (emp.employeeProfile?.birthDate) {
    const year = new Date(emp.employeeProfile.birthDate).getFullYear()
    if (year && year > 1900) return year
  }
  
  // Fallback to dateOfBirth
  if (emp.dateOfBirth) {
    const year = new Date(emp.dateOfBirth).getFullYear()
    if (year && year > 1900) return year
  }
  
  return 0
}

function formatMonthsToSeniority(months?: number): string {
  if (months === undefined || months === null) return 'N/A'
  
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12
  
  if (years > 0 && remainingMonths > 0) {
    return `${years}y ${remainingMonths}m`
  } else if (years > 0) {
    return `${years} year${years > 1 ? 's' : ''}`
  } else {
    return `${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`
  }
}

function calculateSeniority(dateOfJoin: string): string {
  const joinDate = new Date(dateOfJoin)
  const now = new Date()
  
  const years = now.getFullYear() - joinDate.getFullYear()
  const months = now.getMonth() - joinDate.getMonth()
  
  let totalYears = years
  let totalMonths = months
  
  if (totalMonths < 0) {
    totalYears--
    totalMonths += 12
  }
  
  if (totalYears > 0 && totalMonths > 0) {
    return `${totalYears}y ${totalMonths}m`
  } else if (totalYears > 0) {
    return `${totalYears} year${totalYears > 1 ? 's' : ''}`
  } else {
    return `${totalMonths} month${totalMonths > 1 ? 's' : ''}`
  }
}

async function loadTeamData() {
  if (!authStore.token) {
    error.value = 'Not authenticated'
    return
  }

  loading.value = true
  error.value = null

  try {
    // Load initial data if not loaded
    if (!initialDataStore.data) {
      await initialDataStore.fetchInitialData()
    }

    if (!initialDataStore.data || !authStore.user?.employeeID) {
      error.value = 'Missing required data'
      loading.value = false
      return
    }

    // Build team org chart
    const teamStructure = buildTeamOrgChart(initialDataStore.data, authStore.user.employeeID)
    console.log('👥 Team members:', teamStructure.allMembers.length)

    // Create map from employeeID to partName from directReports and indirectReports
    const employeePartMap = new Map<string, string>()
    
    // For direct reports, find their PART from parts array
    teamStructure.directReports.forEach(member => {
      let partName = member.partName
      
      // If partName is undefined, try to find which PART they belong to
      if (!partName) {
        // Check if they are a PART leader
        if (member.isPartLeader) {
          const leadingPart = teamStructure.parts.find(p => p.group.leaderID === member.employee.employeeID)
          partName = leadingPart?.group.groupName
        } else {
          // Check if they are a member of any PART
          const belongingPart = teamStructure.parts.find(p => 
            p.members.some(m => m.employeeID === member.employee.employeeID)
          )
          partName = belongingPart?.group.groupName
        }
      }
      
      // If still no part name, they belong directly to TEAM (not in any PART)
      if (!partName && teamStructure.team) {
        partName = teamStructure.team.groupName + ' (Direct)'
      }
      
      employeePartMap.set(member.employee.employeeID, partName || 'N/A')
    })
    
    // For indirect reports (PART members), they already have partName
    teamStructure.indirectReports.forEach(member => {
      employeePartMap.set(member.employee.employeeID, member.partName || 'N/A')
    })
    
    console.log('📋 Created part name map:', {
      size: employeePartMap.size,
      sample: Array.from(employeePartMap.entries()).slice(0, 3)
    })

    // Load leave info for each team member
    const currentYear = new Date().getFullYear()
    const membersWithLeave: TeamMember[] = []

    for (const emp of teamStructure.allMembers) {
      try {
        // Get part name from the map (already computed in buildTeamOrgChart)
        const partName = employeePartMap.get(emp.employeeID) || 'N/A'
        
        // Get leave info
        const leaveInfo = await leaveApi.getLeaveInfoByYear(currentYear, emp.employeeID)
        
        // Calculate days used and remaining
        const daysUsed = leaveInfo.annualLeave.originUse + leaveInfo.refreshLeave.use
        const daysRemaining = leaveInfo.annualLeave.remain + leaveInfo.refreshLeave.remain
        
        // Get birth year from employeeProfile.birthDate
        const birthYear = getBirthYear(emp)
        
        // Get job grade and grade seniority
        const jobGrade = getJobGradeName(emp.employeeProfile?.jobGradeID)
        const gradeSeniority = formatMonthsToSeniority(emp.employeeProfile?.jobGradeSeniority)
        
        membersWithLeave.push({
          employeeID: emp.employeeID,
          name: emp.name,
          englishName: emp.englishName || emp.name,
          avatar: emp.employeeProfile?.pictureUrl,
          birthYear,
          dateOfJoin: emp.dateOfJoin || '',
          seniority: emp.dateOfJoin ? calculateSeniority(emp.dateOfJoin) : 'N/A',
          jobGrade,
          gradeSeniority,
          partName,
          daysUsed,
          daysRemaining
        })
      } catch (err) {
        console.error(`Failed to load leave info for ${emp.name}:`, err)
        
        // Still add member but with 0 days
        membersWithLeave.push({
          employeeID: emp.employeeID,
          name: emp.name,
          englishName: emp.englishName || emp.name,
          avatar: emp.employeeProfile?.pictureUrl,
          birthYear: getBirthYear(emp),
          dateOfJoin: emp.dateOfJoin || '',
          seniority: emp.dateOfJoin ? calculateSeniority(emp.dateOfJoin) : 'N/A',
          jobGrade: getJobGradeName(emp.employeeProfile?.jobGradeID),
          gradeSeniority: formatMonthsToSeniority(emp.employeeProfile?.jobGradeSeniority),
          partName: employeePartMap.get(emp.employeeID) || 'N/A',
          daysUsed: 0,
          daysRemaining: 0
        })
      }
    }

    teamMembers.value = membersWithLeave

  } catch (err: any) {
    console.error('Error loading team data:', err)
    error.value = err.message || 'Failed to load team data'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadTeamData()
})
</script>

<style scoped>
.team-management {
  min-height: 100vh;
  background: #f5f7fa;
}

/* Page Title */
.page-title {
  flex: 1;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.back-button {
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s;
  backdrop-filter: blur(10px);
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: white;
  transform: translateX(-4px);
}

.page-title h1 {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
}

.subtitle {
  margin: 0;
  opacity: 0.95;
  font-size: 14px;
  font-weight: 500;
}

/* Loading */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 24px;
  margin-top: 100px;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-container p {
  font-size: 16px;
  font-weight: 600;
  color: #667eea;
}

/* Error */
.error-container {
  max-width: 800px;
  margin: 100px auto 40px;
  padding: 0 20px;
}

.error-box {
  background: #fff3f3;
  border: 2px solid #ff4444;
  color: #cc0000;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.retry-button {
  margin-top: 15px;
  padding: 8px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

/* Team Container */
.team-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 80px 20px 40px;
}

/* Summary Grid */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.summary-card {
  background: white;
  padding: 16px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  text-align: center;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.summary-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.summary-card.highlight {
  background: linear-gradient(135deg, #42a5f5 0%, #2196f3 100%);
  color: white;
  border-color: #2196f3;
}

.summary-card.accent {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
}

.summary-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.summary-value {
  font-size: 22px;
  font-weight: 800;
  margin-bottom: 4px;
}

.summary-label {
  font-size: 11px;
  font-weight: 600;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* Table */
.table-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: visible;
}

.team-table {
  width: 100%;
  border-collapse: collapse;
}

.team-table thead {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.team-table th {
  padding: 20px 24px;
  text-align: left;
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.team-table th:first-child {
  border-radius: 16px 0 0 0;
}

.team-table th:last-child {
  border-radius: 0 16px 0 0;
}

.team-table tbody tr {
  transition: all 0.3s;
  background: white;
  border-left: 4px solid #e3e8ef;
  border-bottom: 2px solid #f0f3f7;
}

.team-table tbody tr:hover {
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.04) 0%, transparent 100%);
  border-left-color: #667eea;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
}

.team-table td {
  padding: 20px 24px;
  font-size: 14px;
}

.employee-cell {
  display: flex;
  align-items: center;
  gap: 14px;
}

.employee-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e3e8ef;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  transition: all 0.3s;
}

.avatar-placeholder {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.team-table tbody tr:hover .employee-avatar {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.employee-name {
  font-weight: 700;
  color: #2c3e50;
  font-size: 15px;
}

.text-center {
  text-align: center;
}

.seniority-badge {
  display: inline-block;
  padding: 6px 16px;
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  color: #e65100;
  border-radius: 20px;
  font-weight: 700;
  font-size: 13px;
  box-shadow: 0 2px 8px rgba(230, 81, 0, 0.15);
}

.grade-badge {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s;
}

.grade-badge.senior {
  background: linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%);
  color: #c2185b;
}

.grade-badge.im {
  background: linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 100%);
  color: #0277bd;
}

.grade-badge.jr {
  background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
  color: #7b1fa2;
}

.team-table tbody tr:hover .grade-badge.senior {
  background: linear-gradient(135deg, #e91e63 0%, #c2185b 100%);
  color: white;
  transform: scale(1.05);
}

.team-table tbody tr:hover .grade-badge.im {
  background: linear-gradient(135deg, #03a9f4 0%, #0277bd 100%);
  color: white;
  transform: scale(1.05);
}

.team-table tbody tr:hover .grade-badge.jr {
  background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%);
  color: white;
  transform: scale(1.05);
}

.grade-seniority-badge {
  display: inline-block;
  padding: 6px 16px;
  background: linear-gradient(135deg, #f1f8e9 0%, #dcedc8 100%);
  color: #558b2f;
  border-radius: 20px;
  font-weight: 700;
  font-size: 13px;
  box-shadow: 0 2px 8px rgba(85, 139, 47, 0.15);
}

.leave-badge {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 14px;
  transition: all 0.3s;
}

.leave-badge.used {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  color: #1565c0;
  box-shadow: 0 2px 8px rgba(21, 101, 192, 0.15);
}

.leave-badge.remaining {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  color: #2e7d32;
  box-shadow: 0 2px 8px rgba(46, 125, 50, 0.15);
}

.team-table tbody tr:hover .leave-badge.used {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
  color: white;
  transform: scale(1.05);
}

.team-table tbody tr:hover .leave-badge.remaining {
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
  color: white;
  transform: scale(1.05);
}

/* Animation */
.table-row-animated {
  animation: slideInRow 0.5s ease-out backwards;
}

@keyframes slideInRow {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 16px;
  margin: 100px auto 0;
  max-width: 600px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 24px;
}

.empty-state p {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

/* Responsive */
@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .table-container {
    overflow-x: auto;
  }

  .team-table {
    min-width: 900px;
  }
}
</style>
