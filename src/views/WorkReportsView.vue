<template>
  <div class="work-reports">
    <!-- Header -->
    <div class="header-section">
      <div class="header-content">
        <div class="page-title">
          <h1>📊 Work Reports</h1>
          <p class="subtitle">Team work tracking and statistics · {{ viewMode === 'month' ? selectedMonth : selectedYear }}</p>
        </div>
        
        <!-- Filters in header -->
        <div class="header-filters">
          <div class="btn-group">
            <button 
              @click="viewMode = 'month'" 
              :class="['btn-filter', { active: viewMode === 'month' }]"
            >
              📅 Monthly
            </button>
            <button 
              @click="viewMode = 'year'" 
              :class="['btn-filter', { active: viewMode === 'year' }]"
            >
              📆 Yearly
            </button>
          </div>

          <input 
            v-if="viewMode === 'month'" 
            type="month" 
            v-model="selectedMonth" 
            class="input-date"
          />
          <input 
            v-else
            type="number" 
            v-model.number="selectedYear" 
            class="input-date" 
            min="2020" 
            max="2030"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading work reports...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-box">
        ❌ {{ error }}
        <button @click="loadWorkReports" class="retry-button">🔄 Retry</button>
      </div>
    </div>

    <!-- Reports Content -->
    <div v-else-if="employeeSummaries.length > 0" class="reports-container">
      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-icon">👥</div>
          <div class="summary-value">{{ employeeSummaries.length }}</div>
          <div class="summary-label">Team Members</div>
        </div>
        <div class="summary-card highlight">
          <div class="summary-icon">⏰</div>
          <div class="summary-value">{{ totalTeamHours.toFixed(1) }}</div>
          <div class="summary-label">Total Hours</div>
        </div>
        <div class="summary-card accent">
          <div class="summary-icon">📈</div>
          <div class="summary-value">{{ averageHoursPerPerson.toFixed(1) }}</div>
          <div class="summary-label">Avg Hours/Person</div>
        </div>
      </div>

      <!-- Employee Reports Table -->
      <div class="table-container">
        <table class="reports-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Work Days</th>
              <th>Total Hours</th>
              <th>Avg Hours/Day</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="summary in sortedEmployeeSummaries" :key="summary.employeeID">
              <td>
                <div class="employee-cell">
                  <div class="employee-name">{{ summary.employeeName }}</div>
                </div>
              </td>
              <td class="text-center">{{ summary.workDays }}</td>
              <td class="text-center">
                <span class="hours-badge">{{ summary.totalHours.toFixed(1) }}h</span>
              </td>
              <td class="text-center">
                {{ (summary.totalHours / summary.workDays).toFixed(1) }}h
              </td>
              <td class="text-center">
                <button @click="viewDetails(summary)" class="btn-details">
                  👁️ Details
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-icon">📭</div>
      <p>No work reports found for the selected period</p>
      <p class="empty-hint">Try selecting a different month or year</p>
    </div>

    <!-- Details Modal -->
    <div v-if="selectedEmployee" class="modal-overlay" @click="selectedEmployee = null">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>📋 Work Details - {{ selectedEmployee.employeeName }}</h2>
          <button @click="selectedEmployee = null" class="btn-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="work-blocks-list">
            <div v-for="block in selectedEmployee.workBlocks" :key="block.id" class="work-block-item">
              <div class="block-header">
                <span class="block-date">{{ formatDate(block.startDate) }}</span>
                <span class="block-hours">{{ block.hours }}h</span>
              </div>
              <div class="block-description">{{ block.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useInitialDataStore } from '@/stores/initialData'
import { getWorkBlocks } from '@/services/workReportService'
import { buildTeamOrgChart } from '@/utils/organizationChart'
import type { EmployeeWorkSummary, WorkBlock } from '@/types/work-report'

const authStore = useAuthStore()
const initialDataStore = useInitialDataStore()

const viewMode = ref<'month' | 'year'>('month')
const selectedMonth = ref(getCurrentMonth())
const selectedYear = ref(new Date().getFullYear())
const loading = ref(false)
const error = ref<string | null>(null)
const employeeSummaries = ref<EmployeeWorkSummary[]>([])
const selectedEmployee = ref<EmployeeWorkSummary | null>(null)

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const totalTeamHours = computed(() => {
  return employeeSummaries.value.reduce((sum, emp) => sum + emp.totalHours, 0)
})

const averageHoursPerPerson = computed(() => {
  if (employeeSummaries.value.length === 0) return 0
  return totalTeamHours.value / employeeSummaries.value.length
})

const sortedEmployeeSummaries = computed(() => {
  return [...employeeSummaries.value].sort((a, b) => b.totalHours - a.totalHours)
})

async function loadWorkReports() {
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

    // Build team org chart to get team members only
    const teamStructure = buildTeamOrgChart(initialDataStore.data, authStore.user.employeeID)
    
    // Get all team member IDs (direct + indirect reports + team leader)
    const employeeIDs = teamStructure.allMembers.map(emp => emp.employeeID)

    console.log('👥 Team members:', employeeIDs.length, 'employees')
    console.log('📋 First few IDs:', employeeIDs.slice(0, 3))

    if (employeeIDs.length === 0) {
      error.value = 'No employees found in team'
      loading.value = false
      return
    }

    // Calculate date range
    let fromDate: string
    let toDate: string

    if (viewMode.value === 'month') {
      const [year, month] = selectedMonth.value.split('-')
      fromDate = `${year}-${month}-01`
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
      toDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`
    } else {
      fromDate = `${selectedYear.value}-01-01`
      toDate = `${selectedYear.value}-12-31`
    }

    // Prepare request
    const request = {
      fromDate,
      toDate,
      employeeIDs,
      originalGroupID: [],
      projectID: null,
      featureID: null,
      workTypeID: null
    }

    console.log('📤 Sending request:', request)

    // Fetch work reports
    const response = await getWorkBlocks(authStore.token, request)

    console.log('📥 Received response:', response)
    console.log('📦 Work blocks:', response.wBlocks?.length || 0)

    // Process data (response uses "wBlocks" not "workBlocks")
    if (response.wBlocks && response.wBlocks.length > 0) {
      processWorkReports(response.wBlocks)
    } else {
      console.warn('⚠️ No work blocks in response')
      employeeSummaries.value = []
    }

  } catch (err: any) {
    console.error('Error loading work reports:', err)
    error.value = err.message || 'Failed to load work reports'
  } finally {
    loading.value = false
  }
}

function processWorkReports(workBlocks: WorkBlock[]) {
  if (!workBlocks || workBlocks.length === 0) {
    console.warn('⚠️ No work blocks to process')
    employeeSummaries.value = []
    return
  }

  const employeeMap = new Map<string, EmployeeWorkSummary>()
  
  if (!initialDataStore.data || !authStore.user?.employeeID) return

  // Build team structure to get team members with names
  const teamStructure = buildTeamOrgChart(initialDataStore.data, authStore.user.employeeID)

  // Initialize summaries for team members only
  teamStructure.allMembers.forEach(emp => {
    employeeMap.set(emp.employeeID, {
      employeeID: emp.employeeID,
      employeeName: emp.name,
      totalHours: 0,
      workDays: 0,
      workBlocks: []
    })
  })

  // Aggregate work blocks
  workBlocks.forEach(block => {
    const summary = employeeMap.get(block.assigneeID)
    if (summary) {
      summary.totalHours += block.hours
      summary.workBlocks.push(block)
    }
  })

  // Calculate work days (unique dates)
  employeeMap.forEach(summary => {
    const uniqueDates = new Set(
      summary.workBlocks.map(block => block.startDate.split('T')[0])
    )
    summary.workDays = uniqueDates.size
  })

  // Filter out employees with no work
  employeeSummaries.value = Array.from(employeeMap.values()).filter(
    summary => summary.totalHours > 0
  )
}

function viewDetails(employee: EmployeeWorkSummary) {
  selectedEmployee.value = employee
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Auto-load on mount
onMounted(() => {
  loadWorkReports()
})

// Auto-reload when date selection changes
watch([viewMode, selectedMonth, selectedYear], () => {
  loadWorkReports()
})
</script>

<style scoped>
.work-reports {
  min-height: 100vh;
  background: #f5f7fa;
}

/* Header */
.header-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 32px 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 40px;
}

.page-title {
  flex: 1;
}

.page-title h1 {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.subtitle {
  margin: 0;
  opacity: 0.95;
  font-size: 15px;
  font-weight: 500;
}

/* Header Filters */
.header-filters {
  display: flex;
  gap: 16px;
  align-items: center;
}

.btn-group {
  display: flex;
  gap: 8px;
}

.btn-filter {
  padding: 10px 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  backdrop-filter: blur(10px);
}

.btn-filter:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

.btn-filter.active {
  background: white;
  color: #667eea;
  border-color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.input-date {
  padding: 10px 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  min-width: 160px;
  color: #667eea;
  backdrop-filter: blur(10px);
  transition: all 0.3s;
}

.input-date:focus {
  outline: none;
  border-color: white;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Loading */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 24px;
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

/* Reports Container */
.reports-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px 40px;
}

/* Summary Grid */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.summary-card {
  background: white;
  padding: 28px;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  text-align: center;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.summary-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
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
  font-size: 42px;
  margin-bottom: 16px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.summary-value {
  font-size: 36px;
  font-weight: 800;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}

.summary-label {
  font-size: 14px;
  font-weight: 600;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Table */
.table-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border: 1px solid #f0f0f0;
}

.reports-table {
  width: 100%;
  border-collapse: collapse;
}

.reports-table thead {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.reports-table th {
  padding: 18px 20px;
  text-align: left;
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.reports-table td {
  padding: 18px 20px;
  border-bottom: 1px solid #f5f5f5;
  font-size: 14px;
}

.reports-table tbody tr {
  transition: all 0.2s;
}

.reports-table tbody tr:hover {
  background: #f8f9ff;
  transform: scale(1.01);
}

.reports-table tbody tr:last-child td {
  border-bottom: none;
}

.employee-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.employee-name {
  font-weight: 700;
  color: #2c3e50;
  font-size: 15px;
}

.text-center {
  text-align: center;
}

.hours-badge {
  display: inline-block;
  padding: 6px 16px;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  color: #1565c0;
  border-radius: 20px;
  font-weight: 700;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(21, 101, 192, 0.15);
}

.btn-details {
  padding: 8px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.btn-details:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 16px;
  margin: 0 auto;
  max-width: 600px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 24px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

.empty-state p {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 8px 0;
}

.empty-hint {
  color: #95a5a6;
  font-size: 15px;
  font-weight: 500;
  margin-top: 8px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 800px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
}

.btn-close {
  padding: 8px 12px;
  background: #f0f0f0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
}

.work-blocks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.work-block-item {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.block-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-weight: 600;
}

.block-date {
  color: #667eea;
}

.block-hours {
  color: #2196f3;
}

.block-description {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}
</style>
