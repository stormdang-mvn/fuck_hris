<template>
  <div class="org-chart-view">
    <div class="container">
      <div class="header">
        <h1>📊 Team Organization Chart</h1>
        <button @click="$router.push('/')" class="btn btn-secondary">← Back to Home</button>
      </div>

      <div v-if="!initialDataStore.data" class="warning-box">
        ⚠️ No data loaded. Please <router-link to="/initial-data">load initial data</router-link> first.
      </div>

      <div v-else-if="loading" class="loading-box">
        <div class="spinner"></div>
        <p>Building organization chart...</p>
      </div>

      <div v-else-if="error" class="error-box">
        ❌ {{ error }}
      </div>

      <div v-else-if="teamStructure.team" class="org-content">
        <!-- Team Header -->
        <div class="team-header">
          <h2>🏢 {{ teamStructure.team.groupName }}</h2>
          <div class="team-meta">
            <div class="meta-item">
              <span class="label">Team Code:</span>
              <span class="value">{{ teamStructure.team.groupCode }}</span>
            </div>
            <div class="meta-item" v-if="teamStructure.teamLeader">
              <span class="label">Team Leader:</span>
              <span class="value">{{ teamStructure.teamLeader.name }} ({{ teamStructure.teamLeader.employeeCode }})</span>
            </div>
          </div>
        </div>

        <!-- Statistics -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📦</div>
            <div class="stat-value">{{ teamStructure.parts.length }}</div>
            <div class="stat-label">Parts</div>
          </div>
          <div class="stat-card highlight">
            <div class="stat-icon">👔</div>
            <div class="stat-value">{{ teamStructure.directReports.length }}</div>
            <div class="stat-label">Direct Reports</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-value">{{ teamStructure.indirectReports.length }}</div>
            <div class="stat-label">Indirect Reports</div>
          </div>
          <div class="stat-card accent">
            <div class="stat-icon">🎯</div>
            <div class="stat-value">{{ teamStructure.allMembers.length }}</div>
            <div class="stat-label">Total Members</div>
          </div>
        </div>

        <!-- Export Actions -->
        <div class="actions">
          <button @click="exportAsJson" class="btn btn-success">
            💾 Export as JSON
          </button>
          <button @click="exportAsText" class="btn btn-info">
            📄 Export as Text
          </button>
          <button @click="copyOrgChart" class="btn btn-secondary">
            📋 Copy to Clipboard
          </button>
        </div>

        <!-- Visual Org Chart -->
        <div class="org-tree">
          <h3>🌳 Organization Tree Chart</h3>
          <TreeChart 
            v-if="teamStructure.teamLeader"
            :teamLeader="teamStructure.teamLeader"
            :teamName="teamStructure.team.groupName"
            :directReports="teamStructure.directReports"
            :indirectReports="teamStructure.indirectReports"
          />
        </div>

        <!-- Parts Details -->
        <div class="parts-section">
          <h3>📦 Parts Breakdown</h3>
          <div class="parts-list">
            <div 
              v-for="(part, index) in teamStructure.parts" 
              :key="part.group.id"
              class="part-card"
            >
              <!-- Part Leader (Top) -->
              <div class="part-leader-top" v-if="part.leader">
                <div class="leader-icon">👑</div>
                <div class="leader-info">
                  <div class="leader-name">{{ part.leader.name }}</div>
                  <div class="leader-title">Part Leader</div>
                </div>
              </div>
              <div class="part-leader-top no-leader" v-else>
                <div class="leader-icon">👤</div>
                <div class="leader-info">
                  <div class="leader-name">No Leader Assigned</div>
                  <div class="leader-title">Part Leader</div>
                </div>
              </div>

              <!-- Part Header -->
              <div class="part-header">
                <h4>{{ index + 1 }}. {{ part.group.groupName }}</h4>
                <span class="part-code">{{ part.group.groupCode }}</span>
              </div>

              <!-- Part Members -->
              <div class="part-members">
                <div class="members-header">
                  <span>👥 Members ({{ part.members.length }})</span>
                  <button 
                    @click="togglePartMembers(part.group.id)" 
                    class="toggle-btn"
                  >
                    {{ expandedParts.has(part.group.id) ? '▼' : '▶' }}
                  </button>
                </div>

                <div v-if="expandedParts.has(part.group.id)" class="members-list">
                  <div 
                    v-for="member in part.members" 
                    :key="member.employeeID"
                    class="member-item"
                    :class="{ 'is-leader': member.employeeID === part.group.leaderID }"
                  >
                    <span class="member-icon">
                      {{ member.employeeID === part.group.leaderID ? '👑' : '•' }}
                    </span>
                    <div class="member-info">
                      <strong>{{ member.name }}</strong>
                      <span class="member-code">{{ member.employeeCode }}</span>
                      <span class="member-email">{{ member.loginID }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Direct vs Indirect Reports -->
        <div class="reports-section">
          <div class="reports-column">
            <h3>👔 Direct Reports ({{ teamStructure.directReports.length }})</h3>
            <div class="employee-list">
              <div 
                v-for="member in teamStructure.directReports" 
                :key="member.employee.employeeID"
                class="employee-card direct"
              >
                <div class="employee-header">
                  <strong>{{ member.employee.name }}</strong>
                  <span class="badge direct-badge">Part Leader</span>
                </div>
                <div class="employee-details">
                  <span>{{ member.employee.employeeCode }}</span>
                  <span>{{ member.partName }}</span>
                  <span>{{ member.employee.loginID }}</span>
                </div>
              </div>
              <p v-if="teamStructure.directReports.length === 0" class="empty-message">
                No direct reports
              </p>
            </div>
          </div>

          <div class="reports-column">
            <h3>👥 Indirect Reports ({{ teamStructure.indirectReports.length }})</h3>
            <div class="employee-list">
              <div 
                v-for="member in teamStructure.indirectReports" 
                :key="member.employee.employeeID"
                class="employee-card indirect"
              >
                <div class="employee-header">
                  <strong>{{ member.employee.name }}</strong>
                  <span class="badge indirect-badge">Team Member</span>
                </div>
                <div class="employee-details">
                  <span>{{ member.employee.employeeCode }}</span>
                  <span>{{ member.partName }}</span>
                  <span>{{ member.employee.loginID }}</span>
                </div>
              </div>
              <p v-if="teamStructure.indirectReports.length === 0" class="empty-message">
                No indirect reports
              </p>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="warning-box">
        <h3>ℹ️ No Team Leadership Found</h3>
        <p>You are not currently assigned as a TEAM leader in the system.</p>
        <div style="margin: 15px 0;">
          <div><strong>User ID:</strong> <code>{{ authStore.user?.id }}</code></div>
          <div><strong>Employee ID:</strong> <code>{{ currentEmployeeID }}</code></div>
        </div>
        <p>If you believe this is incorrect, please contact your system administrator.</p>
        
        <details style="margin-top: 20px;">
          <summary style="cursor: pointer; font-weight: 600; color: #667eea;">
            📊 View All Team Leaders
          </summary>
          <div style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 6px;">
            <div v-if="allTeamLeaders.length > 0">
              <div v-for="(team, index) in allTeamLeaders" :key="team.id" style="margin-bottom: 10px; padding: 10px; background: white; border-radius: 4px;">
                <strong>{{ index + 1 }}. {{ team.groupName }}</strong>
                <div style="font-size: 13px; color: #666; margin-top: 5px;">
                  <div>Code: {{ team.groupCode || team.orgCode }}</div>
                  <div>Leader ID: {{ team.leaderID }}</div>
                </div>
              </div>
            </div>
            <p v-else style="color: #999; font-style: italic;">No teams found in the system.</p>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useInitialDataStore } from '@/stores/initialData'
import { useAuthStore } from '@/stores/auth'
import { 
  buildTeamOrgChart, 
  formatOrgChartAsText,
  type TeamStructure 
} from '@/utils/organizationChart'
import { exportToJson, exportToText, copyToClipboard } from '@/utils/fileExport'
import TreeChart from '@/components/TreeChart.vue'

const initialDataStore = useInitialDataStore()
const authStore = useAuthStore()

const loading = ref(false)
const error = ref<string | null>(null)
const expandedParts = ref<Set<string>>(new Set())
const currentEmployeeID = ref<string | null>(null)

const teamStructure = ref<TeamStructure>({
  team: null,
  teamLeader: null,
  parts: [],
  directReports: [],
  indirectReports: [],
  allMembers: []
})

const allTeamLeaders = computed(() => {
  if (!initialDataStore.data?.companyGroups?.companyGroups) {
    return []
  }
  
  return initialDataStore.data.companyGroups.companyGroups.filter(
    (group: any) => group.levelName === 'TEAM'
  )
})

onMounted(() => {
  buildChart()
})

const buildChart = () => {
  try {
    loading.value = true
    error.value = null

    if (!initialDataStore.data) {
      error.value = 'No data loaded. Please load initial data first.'
      return
    }

    if (!authStore.user?.id) {
      error.value = 'User not logged in'
      return
    }

    const companyGroupsData = initialDataStore.data.companyGroups
    const companyGroups = companyGroupsData?.companyGroups || []
    const employeeList = initialDataStore.data.employeeList || []

    // Find employee ID from user ID
    // In HRIS, user.id is userID, but companyGroups.leaderID references employeeID
    const currentEmployee = employeeList.find(emp => emp.userID === authStore.user?.id)
    
    if (!currentEmployee) {
      error.value = `No employee record found for user ID: ${authStore.user.id}`
      console.error('❌ No employee found with userID:', authStore.user.id)
      return
    }

    const employeeID = currentEmployee.employeeID // Use employeeID field, not id
    currentEmployeeID.value = employeeID

    console.log('🔍 Building org chart for user:', authStore.user.id)
    console.log('👤 Employee ID:', employeeID)
    console.log('👤 Employee Name:', currentEmployee.name)
    console.log('📊 Total company groups:', companyGroups.length)
    console.log('👥 Total employees:', employeeList.length)

    teamStructure.value = buildTeamOrgChart(
      employeeID, // Use employeeID, not userID!
      companyGroups,
      employeeList
    )

    // Auto-expand first 3 parts
    teamStructure.value.parts.slice(0, 3).forEach(part => {
      expandedParts.value.add(part.group.id)
    })

  } catch (err: any) {
    console.error('❌ Error building org chart:', err)
    error.value = err.message || 'Failed to build organization chart'
  } finally {
    loading.value = false
  }
}

const togglePartMembers = (partId: string) => {
  if (expandedParts.value.has(partId)) {
    expandedParts.value.delete(partId)
  } else {
    expandedParts.value.add(partId)
  }
}

const exportAsJson = () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const filename = `org-chart-${timestamp}.json`
  
  const data = {
    team: teamStructure.value.team,
    teamLeader: teamStructure.value.teamLeader,
    statistics: {
      parts: teamStructure.value.parts.length,
      directReports: teamStructure.value.directReports.length,
      indirectReports: teamStructure.value.indirectReports.length,
      totalMembers: teamStructure.value.allMembers.length
    },
    parts: teamStructure.value.parts,
    directReports: teamStructure.value.directReports,
    indirectReports: teamStructure.value.indirectReports
  }
  
  exportToJson(data, filename)
}

const exportAsText = () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const filename = `org-chart-${timestamp}.txt`
  const textContent = formatOrgChartAsText(teamStructure.value)
  
  exportToText(textContent, filename)
}

const copyOrgChart = async () => {
  const textContent = formatOrgChartAsText(teamStructure.value)
  const success = await copyToClipboard(textContent)
  
  if (success) {
    alert('✅ Organization chart copied to clipboard!')
  } else {
    alert('❌ Failed to copy to clipboard')
  }
}
</script>

<style scoped>
.org-chart-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

h1 {
  color: #333;
  font-size: 32px;
  margin: 0;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-secondary {
  background: linear-gradient(135deg, #a8a8a8 0%, #636363 100%);
  color: white;
}

.btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(168, 168, 168, 0.4);
}

.btn-success {
  background: linear-gradient(135deg, #5ee7df 0%, #b490ca 100%);
  color: white;
}

.btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(94, 231, 223, 0.4);
}

.btn-info {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.btn-info:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(79, 172, 254, 0.4);
}

.warning-box {
  background: #fff3cd;
  color: #856404;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #ffc107;
  margin-bottom: 20px;
}

.warning-box h3 {
  margin-top: 0;
  color: #856404;
}

.warning-box p {
  margin: 10px 0;
  line-height: 1.6;
}

.warning-box code {
  background: #fff;
  padding: 3px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  color: #667eea;
  font-weight: 600;
}

.warning-box a {
  color: #667eea;
  font-weight: 600;
}

.error-box {
  background: #fee;
  color: #c33;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #c33;
  margin-bottom: 20px;
}

.loading-box {
  text-align: center;
  padding: 60px;
}

.spinner {
  width: 60px;
  height: 60px;
  margin: 0 auto 20px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.team-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  border-radius: 12px;
  margin-bottom: 30px;
}

.team-header h2 {
  margin: 0 0 15px 0;
  font-size: 28px;
}

.team-meta {
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  gap: 10px;
}

.meta-item .label {
  opacity: 0.9;
}

.meta-item .value {
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 12px;
  text-align: center;
  border-left: 4px solid #667eea;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.stat-card.highlight {
  background: linear-gradient(135deg, #fff5e6 0%, #ffe6cc 100%);
  border-left-color: #ff9800;
}

.stat-card.accent {
  background: linear-gradient(135deg, #e6f7ff 0%, #cce7ff 100%);
  border-left-color: #2196f3;
}

.stat-icon {
  font-size: 36px;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 36px;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #666;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.org-tree {
  background: #f8f9fa;
  padding: 30px;
  border-radius: 12px;
  margin-bottom: 30px;
}

.org-tree h3 {
  margin-top: 0;
  color: #333;
}

.tree-container {
  overflow-x: auto;
  padding: 20px 0;
}

.parts-section {
  margin-bottom: 40px;
}

.parts-section h3 {
  color: #333;
  margin-bottom: 20px;
}

.parts-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.part-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s;
}

.part-card:hover {
  border-color: #667eea;
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.2);
}

/* Part Leader at Top */
.part-leader-top {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  color: white;
}

.part-leader-top.no-leader {
  background: linear-gradient(135deg, #9e9e9e 0%, #757575 100%);
  opacity: 0.7;
}

.leader-icon {
  font-size: 40px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.leader-info {
  flex: 1;
}

.leader-name {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
}

.leader-title {
  font-size: 13px;
  opacity: 0.9;
}

.part-header {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #e0e0e0;
}

.part-header h4 {
  margin: 0;
  color: #333;
}

.part-code {
  font-family: monospace;
  background: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  color: #667eea;
}

.part-leader {
  padding: 20px;
  background: #fff8e1;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  gap: 15px;
}

.leader-badge {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #333;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
}

.employee-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.employee-code,
.employee-email {
  font-size: 13px;
  color: #666;
}

.part-members {
  padding: 20px;
}

.members-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-weight: 600;
  color: #333;
}

.toggle-btn {
  background: #f0f0f0;
  border: none;
  padding: 5px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.toggle-btn:hover {
  background: #667eea;
  color: white;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  transition: all 0.3s;
}

.member-item:hover {
  background: #e9ecef;
  transform: translateX(5px);
}

.member-item.is-leader {
  background: #fff8e1;
  border-left: 3px solid #ffd700;
}

.member-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.member-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
}

.member-code,
.member-email {
  font-size: 12px;
  color: #666;
}

.reports-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 30px;
}

.reports-column h3 {
  color: #333;
  margin-bottom: 20px;
}

.employee-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.employee-card {
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #ccc;
  transition: all 0.3s;
}

.employee-card:hover {
  transform: translateX(5px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
}

.employee-card.direct {
  background: #fff8e1;
  border-left-color: #ff9800;
}

.employee-card.indirect {
  background: #f0f4f8;
  border-left-color: #2196f3;
}

.employee-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.direct-badge {
  background: #ff9800;
  color: white;
}

.indirect-badge {
  background: #2196f3;
  color: white;
}

.employee-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: #666;
}

.empty-message {
  text-align: center;
  color: #999;
  padding: 20px;
  font-style: italic;
}
</style>
