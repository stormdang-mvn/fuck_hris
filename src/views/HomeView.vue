<template>
  <div class="home">
    <!-- Header with User Info -->
    <PageHeader>
      <template #left>
        <div class="user-welcome">
          <div class="welcome-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div class="welcome-text">
            <h1>Hello, <span class="user-name">{{ authStore.user?.fullName }}</span>!</h1>
            <p class="user-email">
              <span class="email-icon">✉️</span>
              {{ authStore.user?.email }}
            </p>
          </div>
        </div>
      </template>
    </PageHeader>

    <!-- Floating Action Buttons -->
    <div class="floating-nav">
      <router-link to="/work-reports" class="floating-btn work-reports-btn">
        <span class="floating-btn-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 3v18h18"/>
            <path d="M18 17V9"/>
            <path d="M13 17V5"/>
            <path d="M8 17v-3"/>
          </svg>
        </span>
        <span class="floating-btn-label">Work Reports</span>
      </router-link>
      <button @click="handleLogout" class="floating-btn logout-btn">
        <span class="floating-btn-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </span>
        <span class="floating-btn-label">Logout</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading organization data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-box">
        ❌ {{ error }}
        <button @click="loadData" class="retry-button">🔄 Retry</button>
      </div>
    </div>

    <!-- Organization Chart -->
    <div v-else-if="teamStructure.team" class="org-chart-container">
      <!-- Level Statistics Card -->
      <div class="level-stats-card">
        <div class="level-stats-header">
          <h3>📊 Team Levels</h3>
        </div>
        <div class="level-stats-grid">
          <div class="level-stat-item senior">
            <div class="level-icon">🎯</div>
            <div class="level-info">
              <div class="level-value">{{ levelStats.senior }}</div>
              <div class="level-label">Senior</div>
            </div>
          </div>
          <div class="level-stat-item intermediate">
            <div class="level-icon">⚡</div>
            <div class="level-info">
              <div class="level-value">{{ levelStats.intermediate }}</div>
              <div class="level-label">Intermediate</div>
            </div>
          </div>
          <div class="level-stat-item junior">
            <div class="level-icon">🌱</div>
            <div class="level-info">
              <div class="level-value">{{ levelStats.junior }}</div>
              <div class="level-label">Junior</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Export Actions -->
      <div class="actions" style="display: none;">
        <button @click="exportAsJson" class="btn btn-success">
          💾 Export JSON
        </button>
        <button @click="exportAsText" class="btn btn-info">
          📄 Export Text
        </button>
        <button @click="copyOrgChart" class="btn btn-secondary">
          📋 Copy
        </button>
      </div>

      <!-- Visual Org Chart -->
      <div class="org-tree">
        <TreeChart 
          v-if="teamStructure.teamLeader"
          :teamLeader="teamStructure.teamLeader"
          :teamName="teamStructure.team.groupName"
          :parts="teamStructure.parts"
          :directReports="teamStructure.directReports"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useInitialDataStore } from '@/stores/initialData'
import { buildTeamOrgChart } from '@/utils/organizationChart'
import { exportToJson, exportToText, copyToClipboard } from '@/utils/fileExport'
import TreeChart from '@/components/TreeChart.vue'
import PageHeader from '@/components/PageHeader.vue'
import type { Employee } from '@/types/initial-data'

const router = useRouter()
const authStore = useAuthStore()
const initialDataStore = useInitialDataStore()

const loading = ref(false)
const error = ref('')

interface TeamStructure {
  team: any
  teamLeader: Employee | null
  parts: any[]
  directReports: any[]
  indirectReports: any[]
  allMembers: Employee[]
}

const teamStructure = ref<TeamStructure>({
  team: null,
  teamLeader: null,
  parts: [],
  directReports: [],
  indirectReports: [],
  allMembers: []
})

const loadData = async () => {
  loading.value = true
  error.value = ''

  try {
    // Load initial data if not already loaded
    if (!initialDataStore.data) {
      console.log('📥 Loading initial data...')
      await initialDataStore.fetchInitialData()
    }

    // Build organization chart
    console.log('📊 Building organization chart...')
    const data = initialDataStore.data
    
    if (!data) {
      throw new Error('No data available')
    }

    if (!authStore.user?.id) {
      throw new Error('No user ID found')
    }

    // Find current employee record using userID
    const employeeList = data.employeeList || []
    const currentEmployee = employeeList.find(emp => emp.userID === authStore.user?.id)
    
    if (!currentEmployee) {
      throw new Error(`Employee not found for userID: ${authStore.user?.id}`)
    }

    const employeeID = currentEmployee.employeeID
    console.log('👤 Current Employee ID:', employeeID)

    // Build team org chart
    const result = buildTeamOrgChart(data, employeeID)
    teamStructure.value = result

    console.log('✅ Organization chart loaded successfully')
    console.log('📦 Parts:', result.parts.length)
    console.log('👔 Direct Reports:', result.directReports.length)
    console.log('👥 Indirect Reports:', result.indirectReports.length)

  } catch (err: any) {
    console.error('❌ Error loading data:', err)
    error.value = err.message || 'Failed to load organization data'
  } finally {
    loading.value = false
  }
}

const exportAsJson = () => {
  const data = {
    team: teamStructure.value.team,
    teamLeader: teamStructure.value.teamLeader,
    parts: teamStructure.value.parts.map(p => ({
      name: p.group.groupName,
      code: p.group.groupCode,
      leader: p.leader,
      memberCount: p.members.length
    })),
    directReports: teamStructure.value.directReports,
    indirectReports: teamStructure.value.indirectReports,
    statistics: {
      totalParts: teamStructure.value.parts.length,
      directReportsCount: teamStructure.value.directReports.length,
      indirectReportsCount: teamStructure.value.indirectReports.length,
      totalMembers: teamStructure.value.allMembers.length
    }
  }

  exportToJson(data, 'organization-chart')
}

const exportAsText = () => {
  let text = `ORGANIZATION CHART\n`
  text += `==================\n\n`
  text += `Team: ${teamStructure.value.team?.groupName || 'N/A'}\n`
  text += `Code: ${teamStructure.value.team?.groupCode || 'N/A'}\n`
  
  if (teamStructure.value.teamLeader) {
    text += `Leader: ${teamStructure.value.teamLeader.name} (${teamStructure.value.teamLeader.employeeCode})\n`
  }
  
  text += `\nSTATISTICS\n`
  text += `----------\n`
  text += `Parts: ${teamStructure.value.parts.length}\n`
  text += `Direct Reports: ${teamStructure.value.directReports.length}\n`
  text += `Indirect Reports: ${teamStructure.value.indirectReports.length}\n`
  text += `Total Members: ${teamStructure.value.allMembers.length}\n`

  text += `\nDIRECT REPORTS\n`
  text += `--------------\n`
  teamStructure.value.directReports.forEach((member, i) => {
    text += `${i + 1}. ${member.employee.name} (${member.employee.employeeCode})`
    if (member.isPartLeader) {
      text += ` - Part Leader: ${member.partName}`
    }
    text += `\n`
  })

  exportToText(text, 'organization-chart')
}

const copyOrgChart = () => {
  const text = `Team: ${teamStructure.value.team?.groupName}\nDirect Reports: ${teamStructure.value.directReports.length}\nIndirect Reports: ${teamStructure.value.indirectReports.length}`
  copyToClipboard(text)
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

// Calculate level statistics
const levelStats = computed(() => {
  const stats = {
    senior: 0,
    intermediate: 0,
    junior: 0
  }

  // Job Grade IDs từ initialData
  const seniorGradeId = 'ecd4977e-8f28-4c84-8301-eb5ac1ddacb0'
  const intermediateGradeId = 'd499d1dd-147d-4287-a6c8-37571066f2e7'
  const juniorGradeId = 'c3d044ba-a09d-4255-a919-d09222d9eba8'

  teamStructure.value.allMembers.forEach(member => {
    const jobGradeId = member.employeeProfile?.jobGradeID
    
    // Count by job grade ID
    if (jobGradeId === seniorGradeId) {
      stats.senior++
    } else if (jobGradeId === intermediateGradeId) {
      stats.intermediate++
    } else if (jobGradeId === juniorGradeId) {
      stats.junior++
    }
  })

  return stats
})

// Load data on component mount
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: #f5f7fa;
}

/* User Welcome */
.user-welcome {
  display: flex;
  align-items: center;
  gap: 20px;
}

.welcome-icon {
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  animation: iconFloat 3s ease-in-out infinite;
}

.welcome-icon svg {
  stroke: white;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

@keyframes iconFloat {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-8px) rotate(5deg);
  }
}

.welcome-text h1 {
  font-size: 32px;
  margin: 0 0 8px 0;
  color: white;
  font-weight: 800;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  line-height: 1.2;
}

.user-name {
  background: linear-gradient(120deg, #fff 0%, #e0e7ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  position: relative;
  display: inline-block;
}

.user-email {
  margin: 0;
  opacity: 0.95;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.email-icon {
  font-size: 16px;
}

/* Floating Navigation Buttons */
.floating-nav {
  position: fixed;
  left: 30px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 20px;
  z-index: 1000;
}

.floating-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  min-width: 60px;
}

.floating-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.floating-btn:hover::before {
  width: 300px;
  height: 300px;
}

.floating-btn:hover {
  transform: translateX(10px) scale(1.05);
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.6);
}

.floating-btn-icon {
  font-size: 24px;
  transition: transform 0.3s;
  z-index: 1;
}

.floating-btn:hover .floating-btn-icon {
  transform: scale(1.2) rotate(10deg);
}

.floating-btn-label {
  white-space: nowrap;
  opacity: 0;
  max-width: 0;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
}

.floating-btn:hover .floating-btn-label {
  opacity: 1;
  max-width: 150px;
  margin-right: 8px;
}

.work-reports-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.logout-btn {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  box-shadow: 0 8px 24px rgba(245, 87, 108, 0.4);
}

.logout-btn:hover {
  box-shadow: 0 12px 32px rgba(245, 87, 108, 0.6);
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 20px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-container p {
  font-size: 16px;
  color: #666;
}

/* Error State */
.error-container {
  max-width: 800px;
  margin: 40px auto;
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

.retry-button:hover {
  background: #5568d3;
}

/* Organization Chart Container */
.org-chart-container {
  width: 100%;
  margin: 0;
  padding: 60px 40px 40px;
  box-sizing: border-box;
  position: relative;
}

/* Level Statistics Card */
.level-stats-card {
  position: absolute;
  top: 20px;
  right: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  padding: 16px;
  min-width: 200px;
  z-index: 10;
  border: 1px solid #e3e8ef;
}

.level-stats-header {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f3f7;
}

.level-stats-header h3 {
  margin: 0;
  font-size: 16px;
  color: #2c3e50;
  font-weight: 700;
}

.level-stats-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.level-stat-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 10px;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.level-stat-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.level-stat-item.senior {
  background: linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%);
  border-color: #6c5ce7;
}

.level-stat-item.senior:hover {
  box-shadow: 0 4px 12px rgba(108, 92, 231, 0.4);
}

.level-stat-item.intermediate {
  background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
  border-color: #0984e3;
}

.level-stat-item.intermediate:hover {
  box-shadow: 0 4px 12px rgba(9, 132, 227, 0.4);
}

.level-stat-item.junior {
  background: linear-gradient(135deg, #55efc4 0%, #00b894 100%);
  border-color: #00b894;
}

.level-stat-item.junior:hover {
  box-shadow: 0 4px 12px rgba(0, 184, 148, 0.4);
}

.level-icon {
  font-size: 24px;
  line-height: 1;
}

.level-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.level-value {
  font-size: 20px;
  font-weight: 800;
  color: white;
  line-height: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.level-label {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Actions */
.actions {
  display: flex;
  gap: 12px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-success {
  background: #4caf50;
  color: white;
}

.btn-success:hover {
  background: #45a049;
}

.btn-info {
  background: #2196f3;
  color: white;
}

.btn-info:hover {
  background: #0b7dda;
}

.btn-secondary {
  background: #9e9e9e;
  color: white;
}

.btn-secondary:hover {
  background: #757575;
}

/* Org Tree */
.org-tree {
  width: 100%;
  background: transparent;
  padding: 0;
  border-radius: 0;
  box-shadow: none;
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .header-right {
    width: 100%;
    flex-direction: column;
    gap: 16px;
  }

  .header-logo {
    align-self: center;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
  }

  .nav-button,
  .logout-button {
    width: 100%;
    justify-content: center;
  }

  .user-welcome {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .welcome-text h1 {
    font-size: 24px;
  }

  .level-stats-card {
    position: static;
    margin-bottom: 16px;
    min-width: auto;
  }

  .actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
  
  .org-chart-container {
    padding: 20px 16px;
  }
}

.logout-button:active {
  transform: translateY(0);
}
</style>
