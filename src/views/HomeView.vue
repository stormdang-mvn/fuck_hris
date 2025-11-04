<template>
  <div class="home">
    <!-- Header with User Info -->
    <div class="header-section">
      <div class="header-content">
        <div class="user-welcome">
          <h1>👋 Hello, {{ authStore.user?.fullName }}!</h1>
          <p class="user-email">{{ authStore.user?.email }}</p>
        </div>
        <button @click="handleLogout" class="logout-button">
          🚪 Logout
        </button>
      </div>
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
      <!-- Team Header with Stats -->
      <div class="team-header">
        <div class="team-title">
          <h2>🏢 {{ teamStructure.team.groupName }}</h2>
          <div class="team-meta">
            <span class="meta-badge">{{ teamStructure.team.groupCode }}</span>
            <span class="meta-badge leader" v-if="teamStructure.teamLeader">
              Leader: {{ teamStructure.teamLeader.name }}
            </span>
          </div>
        </div>
        
        <!-- Compact Stats -->
        <div class="stats-compact">
          <div class="stat-item">
            <span class="stat-icon">📦</span>
            <div class="stat-info">
              <div class="stat-value">{{ teamStructure.parts.length }}</div>
              <div class="stat-label">Parts</div>
            </div>
          </div>
          <div class="stat-item highlight">
            <span class="stat-icon">👔</span>
            <div class="stat-info">
              <div class="stat-value">{{ teamStructure.directReports.length }}</div>
              <div class="stat-label">Direct</div>
            </div>
          </div>
          <div class="stat-item">
            <span class="stat-icon">👥</span>
            <div class="stat-info">
              <div class="stat-value">{{ teamStructure.indirectReports.length }}</div>
              <div class="stat-label">Indirect</div>
            </div>
          </div>
          <div class="stat-item accent">
            <span class="stat-icon">🎯</span>
            <div class="stat-info">
              <div class="stat-value">{{ teamStructure.allMembers.length }}</div>
              <div class="stat-label">Total</div>
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

/* Header Section */
.header-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.header-content {
  width: 100%;
  padding: 0 20px;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-welcome h1 {
  font-size: 28px;
  margin: 0 0 4px 0;
  color: white;
}

.user-email {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
}

.logout-button {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid white;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  backdrop-filter: blur(10px);
}

.logout-button:hover {
  background: white;
  color: #667eea;
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
  padding: 20px 40px 40px;
  box-sizing: border-box;
}

/* Team Header */
.team-header {
  background: white;
  padding: 20px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.team-title {
  flex: 1;
}

.team-header h2 {
  margin: 0 0 12px 0;
  color: #1a1a1a;
  font-size: 24px;
}

.team-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.meta-badge {
  display: inline-block;
  padding: 6px 16px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.meta-badge.leader {
  background: #f3e5f5;
  color: #7b1fa2;
}

/* Compact Statistics */
.stats-compact {
  display: flex;
  gap: 16px;
  flex-shrink: 0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 10px;
  min-width: 100px;
}

.stat-item.highlight {
  background: linear-gradient(135deg, #42a5f5 0%, #2196f3 100%);
  color: white;
}

.stat-item.accent {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-icon {
  font-size: 24px;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  font-size: 11px;
  opacity: 0.85;
  font-weight: 600;
}

.stat-item.highlight .stat-label,
.stat-item.accent .stat-label {
  opacity: 0.95;
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

  .user-welcome h1 {
    font-size: 22px;
  }

  .team-header {
    flex-direction: column;
  }

  .stats-compact {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    width: 100%;
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

@media (max-width: 480px) {
  .stats-compact {
    grid-template-columns: 1fr;
  }
}

.logout-button:active {
  transform: translateY(0);
}
</style>
