<template>
  <div class="work-reports">
    <!-- Header -->
    <PageHeader>
      <template #left>
        <div class="page-title">
          <div class="title-row">
            <router-link to="/" class="back-button">
              ← Back
            </router-link>
            <h1>📊 Work Reports</h1>
          </div>
          <p class="subtitle">Team work tracking and statistics</p>
        </div>
      </template>
    </PageHeader>

    <!-- Filters Section (moved out of header) -->
    <div class="filters-section">
      <div class="filters-container">
        <!-- Employee Search -->
        <EmployeeSearch v-model="selectedEmployees" />
        
        <div class="filters-row">
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
              <th>Workload Rate</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(summary, index) in sortedEmployeeSummaries" 
              :key="summary.employeeID"
              :style="{ animationDelay: `${index * 0.05}s` }"
              class="table-row-animated"
            >
              <td>
                <div class="employee-cell">
                  <img 
                    v-if="summary.employeeAvatar" 
                    :src="summary.employeeAvatar" 
                    :alt="summary.employeeName"
                    class="employee-avatar"
                    @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"
                  />
                  <div 
                    v-else 
                    class="employee-avatar avatar-placeholder"
                  >
                    {{ summary.employeeName.charAt(0).toUpperCase() }}
                  </div>
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
                <span 
                  class="workload-badge"
                  :class="{
                    'workload-low': (summary.workloadRate || 0) < 70,
                    'workload-normal': (summary.workloadRate || 0) >= 70 && (summary.workloadRate || 0) < 100,
                    'workload-high': (summary.workloadRate || 0) >= 100
                  }"
                >
                  {{ (summary.workloadRate || 0).toFixed(1) }}%
                </span>
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
import PageHeader from '@/components/PageHeader.vue'
import EmployeeSearch from '@/components/EmployeeSearch.vue'
import { holidayApi, type Holiday } from '@/services/api'

const authStore = useAuthStore()
const initialDataStore = useInitialDataStore()

// Employee Search
const selectedEmployees = ref([])

const viewMode = ref<'month' | 'year'>('month')
const selectedMonth = ref(getCurrentMonth())
const selectedYear = ref(new Date().getFullYear())
const loading = ref(false)
const error = ref<string | null>(null)
const employeeSummaries = ref<EmployeeWorkSummary[]>([])
const selectedEmployee = ref<EmployeeWorkSummary | null>(null)

// Company holidays for workload calculation
const companyHolidays = ref<Holiday[]>([])

// Calculate max working hours based on company holidays and employee's join date
function calculateMaxWorkingHours(employeeID: string): number {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  let periodStartDate: Date
  let endDate: Date
  let periodLabel: string
  
  if (viewMode.value === 'month') {
    // Month view: calculate for the selected month
    const [year = '2025', month = '1'] = selectedMonth.value.split('-')
    const yearNum = parseInt(year)
    const monthNum = parseInt(month)
    
    periodStartDate = new Date(yearNum, monthNum - 1, 1)
    
    // If selected month is current month, use today; otherwise use last day of month
    const isCurrentMonth = yearNum === now.getFullYear() && monthNum === now.getMonth() + 1
    if (isCurrentMonth) {
      endDate = today
    } else {
      // Last day of the month
      endDate = new Date(yearNum, monthNum, 0)
    }
    
    periodLabel = `month ${selectedMonth.value}`
  } else {
    // Year view: calculate for the selected year
    periodStartDate = new Date(selectedYear.value, 0, 1)
    
    // If selected year is current year, use today; otherwise use last day of year
    const isCurrentYear = selectedYear.value === now.getFullYear()
    if (isCurrentYear) {
      endDate = today
    } else {
      // Last day of the year (Dec 31)
      endDate = new Date(selectedYear.value, 11, 31)
    }
    
    periodLabel = `year ${selectedYear.value}`
  }
  
  // Check employee's join date
  let startDate = periodStartDate
  const employee = initialDataStore.data?.employeeList.find(emp => emp.employeeID === employeeID)
  
  if (employee?.dateOfJoin) {
    const joinDate = new Date(employee.dateOfJoin)
    // If employee joined after period start, use join date as start
    if (joinDate > periodStartDate && joinDate <= endDate) {
      startDate = joinDate
      periodLabel += ` (joined ${joinDate.toLocaleDateString()})`
    }
  }
  
  // Calculate total days in the period
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  
  // Count company holidays in the period (only type 1, 2, 3 are actual holidays)
  const holidaysInPeriod = companyHolidays.value.filter(holiday => {
    const holidayDate = new Date(holiday.date)
    const isInPeriod = holidayDate >= startDate && holidayDate <= endDate
    const isActualHoliday = holiday.type === 1 || holiday.type === 2 || holiday.type === 3
    return isInPeriod && isActualHoliday
  }).length
  
  // Working days = total days - holidays
  const workingDays = totalDays - holidaysInPeriod
  
  // Max working hours = working days * 8h
  const maxHours = workingDays * 8
  
  console.log(`📊 Workload calculation (${periodLabel}): ${totalDays} days - ${holidaysInPeriod} holidays = ${workingDays} working days = ${maxHours}h max`)
  
  return maxHours
}

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
    // Load company holidays for workload calculation
    if (companyHolidays.value.length === 0) {
      try {
        companyHolidays.value = await holidayApi.getAll(selectedYear.value)
        console.log('🏖️ Loaded company holidays:', companyHolidays.value.length)
      } catch (err) {
        console.error('Failed to load holidays:', err)
      }
    }

    // Load initial data if not loaded
    if (!initialDataStore.data) {
      await initialDataStore.fetchInitialData()
    }

    if (!initialDataStore.data || !authStore.user?.employeeID) {
      error.value = 'Missing required data'
      loading.value = false
      return
    }

    // Get employee IDs - if employees are selected in search, use only those (can be anyone)
    // Otherwise use all team members
    let employeeIDs: string[]
    
    if (selectedEmployees.value.length > 0) {
      // Use selected employees (can be anyone, not restricted to team)
      employeeIDs = selectedEmployees.value.map((emp: any) => emp.employeeID)
      console.log('🔍 Filtering by selected employees:', selectedEmployees.value.length)
    } else {
      // Build team org chart to get team members only
      const teamStructure = buildTeamOrgChart(initialDataStore.data, authStore.user.employeeID)
      // Get all team member IDs (direct + indirect reports + team leader)
      employeeIDs = teamStructure.allMembers.map(emp => emp.employeeID)
      console.log('👥 Showing all team members:', employeeIDs.length, 'employees')
    }

    console.log('📋 Employee IDs:', employeeIDs.slice(0, 5))

    if (employeeIDs.length === 0) {
      error.value = 'No employees selected'
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
      // Filter out Leave records (keep BizTrip and other work blocks)
      const filteredBlocks = response.wBlocks.filter((block: any) => {
        return block.description !== 'Auto sync from attendance (Leave)'
      })
      console.log('📦 After filtering Leave records:', filteredBlocks.length)
      
      // Normalize BizTrip hours (days * 24h -> working days * 8h, excluding holidays)
      const normalizedBlocks = filteredBlocks.map((block: any) => {
        if (block.description === 'Auto sync from attendance (BizTrip)') {
          // Get BizTrip period for holiday filtering
          const startDate = new Date(block.startDate)
          const endDate = new Date(block.endDate)
          
          // Use API hours to calculate total days (more reliable than date diff due to timezone issues)
          const totalDays = block.hours / 24
          
          // Count holidays during BizTrip (only type 1, 2, 3)
          const holidaysInBizTrip = companyHolidays.value.filter(holiday => {
            const holidayDate = new Date(holiday.date)
            const isInPeriod = holidayDate >= startDate && holidayDate <= endDate
            const isActualHoliday = holiday.type === 1 || holiday.type === 2 || holiday.type === 3
            return isInPeriod && isActualHoliday
          }).length
          
          // Working days = total days - holidays
          const workingDays = totalDays - holidaysInBizTrip
          
          // Convert to 8h per working day
          const normalizedHours = workingDays * 8
          console.log(`🛫 BizTrip normalized: ${block.hours}h (${totalDays} days from API - ${holidaysInBizTrip} holidays = ${workingDays} working days) -> ${normalizedHours}h`)
          return { ...block, hours: normalizedHours }
        }
        return block
      })
      
      if (normalizedBlocks.length > 0) {
        processWorkReports(normalizedBlocks)
      } else {
        console.warn('⚠️ No work blocks after filtering')
        employeeSummaries.value = []
      }
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

  // If there are selected employees, use them; otherwise use team members
  if (selectedEmployees.value.length > 0) {
    // Initialize summaries for selected employees (can be anyone)
    selectedEmployees.value.forEach((emp: any) => {
      employeeMap.set(emp.employeeID, {
        employeeID: emp.employeeID,
        employeeName: emp.englishName || emp.name,
        employeeAvatar: emp.employeeProfile?.pictureUrl,
        totalHours: 0,
        workDays: 0,
        workBlocks: []
      })
    })
  } else {
    // Build team structure to get team members with names
    const teamStructure = buildTeamOrgChart(initialDataStore.data, authStore.user.employeeID)
    
    // Initialize summaries for team members only
    teamStructure.allMembers.forEach(emp => {
      employeeMap.set(emp.employeeID, {
        employeeID: emp.employeeID,
        employeeName: emp.name,
        employeeAvatar: emp.employeeProfile?.pictureUrl,
        totalHours: 0,
        workDays: 0,
        workBlocks: []
      })
    })
  }

  // Aggregate work blocks
  workBlocks.forEach(block => {
    const summary = employeeMap.get(block.assigneeID)
    if (summary) {
      summary.totalHours += block.hours
      summary.workBlocks.push(block)
    }
  })

  // Calculate work days (unique dates) and workload rate per employee
  employeeMap.forEach(summary => {
    const uniqueDates = new Set(
      summary.workBlocks.map(block => block.startDate.split('T')[0])
    )
    summary.workDays = uniqueDates.size
    
    // Calculate max working hours for this specific employee (considering their join date)
    const maxWorkingHours = calculateMaxWorkingHours(summary.employeeID)
    
    // Calculate workload rate: (actual hours / max hours) * 100
    if (maxWorkingHours > 0) {
      summary.workloadRate = (summary.totalHours / maxWorkingHours) * 100
    }
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

// Auto-reload when date selection or employee selection changes
watch([viewMode, selectedMonth, selectedYear, selectedEmployees], () => {
  loadWorkReports()
}, { deep: true })

// Reload holidays when year changes
watch(selectedYear, async (newYear) => {
  try {
    companyHolidays.value = await holidayApi.getAll(newYear)
    console.log('🏖️ Reloaded holidays for year', newYear, ':', companyHolidays.value.length)
  } catch (err) {
    console.error('Failed to reload holidays:', err)
  }
})
</script>

<style scoped>
.work-reports {
  min-height: 100vh;
  background: #f5f7fa;
}

/* Page Title Styles */
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

/* Filters Section */
.filters-section {
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 10;
  margin-top: 60px;
}

.filters-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filters-row {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: center;
}

.btn-group {
  display: flex;
  gap: 8px;
}

.btn-filter {
  padding: 10px 20px;
  border: 2px solid #e3e8ef;
  background: white;
  color: #667eea;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-filter:hover {
  background: #f5f7fa;
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.btn-filter.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.input-date {
  padding: 10px 16px;
  border: 2px solid #e3e8ef;
  background: white;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  min-width: 160px;
  color: #667eea;
  transition: all 0.3s;
}

.input-date:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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
  padding: 80px 20px 40px;
  position: relative;
  z-index: 2;
}

/* Summary Grid */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
  position: relative;
  z-index: 3;
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
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.summary-value {
  font-size: 22px;
  font-weight: 800;
  margin-bottom: 4px;
  letter-spacing: -0.5px;
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
  border: none;
  padding: 0;
}

.reports-table {
  width: 100%;
  border-collapse: collapse;
}

.reports-table thead {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.reports-table thead tr {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.reports-table th {
  padding: 20px 24px;
  text-align: left;
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.reports-table th:first-child {
  border-radius: 16px 0 0 0;
  padding-left: 32px;
}

.reports-table th:last-child {
  border-radius: 0 16px 0 0;
  padding-right: 32px;
}

.reports-table tbody tr {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  background: white;
  border-left: 4px solid #e3e8ef;
  border-bottom: 2px solid #f0f3f7;
}

.reports-table tbody tr:hover {
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.04) 0%, transparent 100%);
  border-left-color: #667eea;
  border-bottom-color: #d4dbf0;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
  z-index: 2;
}

.reports-table tbody tr:last-child {
  border-bottom: none;
}

.reports-table tbody tr:last-child td:first-child {
  border-radius: 0 0 0 16px;
}

.reports-table tbody tr:last-child td:last-child {
  border-radius: 0 0 16px 0;
}

.reports-table td {
  padding: 20px 24px;
  font-size: 14px;
  background: transparent;
  border: none;
  vertical-align: middle;
}

.reports-table td:first-child {
  padding-left: 32px;
}

.reports-table td:last-child {
  padding-right: 32px;
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

.reports-table tbody tr:hover .employee-avatar {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.employee-name {
  font-weight: 700;
  color: #2c3e50;
  font-size: 15px;
  transition: all 0.3s;
  position: relative;
  flex: 1;
}

.reports-table tbody tr:hover .employee-name {
  color: #667eea;
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
  transition: all 0.3s;
  border: 2px solid transparent;
}

.reports-table tbody tr:hover .hours-badge {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
  color: white;
  border-color: #1565c0;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(21, 101, 192, 0.3);
}

.workload-badge {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 14px;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.workload-low {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  color: #e65100;
  box-shadow: 0 2px 8px rgba(230, 81, 0, 0.15);
}

.workload-normal {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  color: #2e7d32;
  box-shadow: 0 2px 8px rgba(46, 125, 50, 0.15);
}

.workload-high {
  background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
  color: #c62828;
  box-shadow: 0 2px 8px rgba(198, 40, 40, 0.15);
}

.reports-table tbody tr:hover .workload-low {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
  color: white;
  border-color: #e65100;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(230, 81, 0, 0.3);
}

.reports-table tbody tr:hover .workload-normal {
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
  color: white;
  border-color: #2e7d32;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.3);
}

.reports-table tbody tr:hover .workload-high {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  color: white;
  border-color: #c62828;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(198, 40, 40, 0.3);
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

/* Table Row Animation */
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

/* Responsive */
@media (max-width: 768px) {
  .filters-container {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-group {
    width: 100%;
  }

  .btn-filter {
    flex: 1;
  }

  .input-date {
    width: 100%;
  }

  .title-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .page-title h1 {
    font-size: 24px;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .table-container {
    overflow-x: auto;
  }

  .reports-table {
    min-width: 600px;
  }
}
</style>
