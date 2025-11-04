<template>
  <div class="subordinates-view">
    <div class="container">
      <h1>👥 My Subordinates</h1>
      
      <div class="manager-info" v-if="currentUser">
        <h2>Manager: {{ currentUser.name }}</h2>
        <p class="employee-code">Employee ID: {{ currentUser.id }}</p>
      </div>

      <div class="controls">
        <label class="checkbox-label">
          <input type="checkbox" v-model="includeIndirect" />
          Include indirect reports (reports of reports)
        </label>
        
        <button @click="loadSubordinates" :disabled="loading" class="btn btn-primary">
          {{ loading ? 'Loading...' : 'Refresh' }}
        </button>
      </div>

      <div v-if="loading" class="loading-box">
        <div class="spinner"></div>
        <p>Loading subordinates...</p>
      </div>

      <div v-if="error" class="error-box">
        ❌ {{ error }}
      </div>

      <div v-if="!loading && !error" class="results">
        <div class="stats">
          <div class="stat-card">
            <h3>Total Subordinates</h3>
            <p class="count">{{ subordinates.length }}</p>
          </div>
          
          <div class="stat-card">
            <h3>Direct Reports</h3>
            <p class="count">{{ directReports.length }}</p>
          </div>

          <div class="stat-card">
            <h3>Indirect Reports</h3>
            <p class="count">{{ indirectReports.length }}</p>
          </div>
        </div>

        <div v-if="subordinates.length > 0" class="subordinates-list">
          <h3>📋 Subordinates List</h3>
          
          <div class="search-box">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by name or code..."
              class="search-input"
            />
          </div>

          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Employee Code</th>
                  <th>Name</th>
                  <th>English Name</th>
                  <th>Login ID</th>
                  <th>Report Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(emp, index) in filteredSubordinates" :key="emp.employeeID">
                  <td>{{ index + 1 }}</td>
                  <td>{{ emp.employeeCode || 'N/A' }}</td>
                  <td>{{ emp.name || 'N/A' }}</td>
                  <td>{{ emp.englishName || 'N/A' }}</td>
                  <td>{{ emp.loginID || 'N/A' }}</td>
                  <td>
                    <span :class="['report-badge', isDirectReport(emp.employeeID) ? 'direct' : 'indirect']">
                      {{ isDirectReport(emp.employeeID) ? 'Direct' : 'Indirect' }}
                    </span>
                  </td>
                  <td>
                    <span :class="['status-badge', getStatusClass(emp.status)]">
                      {{ formatStatus(emp.status) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p v-if="filteredSubordinates.length === 0" class="no-results">
            No subordinates found matching "{{ searchQuery }}"
          </p>
        </div>

        <div v-else class="no-data">
          <p>ℹ️ No subordinates found under your management.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useInitialDataStore } from '@/stores/initialData'
import { getSubordinates } from '@/utils/organizational'
import type { Employee } from '@/types/initial-data'

const authStore = useAuthStore()
const initialDataStore = useInitialDataStore()

const subordinates = ref<Employee[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const includeIndirect = ref(true)
const searchQuery = ref('')

const currentUser = computed(() => {
  if (!authStore.user || !initialDataStore.data?.employeeList) return null
  return initialDataStore.data.employeeList.find(
    (emp) => emp.employeeID === authStore.user?.employeeID
  )
})

const directReports = computed(() => {
  if (!authStore.user?.employeeID || !initialDataStore.data?.employeeList) return []
  
  return initialDataStore.data.employeeList.filter((emp) => {
    return (
      (emp as any).managerID === authStore.user?.employeeID ||
      (emp as any).supervisorID === authStore.user?.employeeID ||
      (emp as any).reportToID === authStore.user?.employeeID ||
      emp.employeeProfile?.managerID === authStore.user?.employeeID
    )
  })
})

const indirectReports = computed(() => {
  return subordinates.value.filter((emp) => !isDirectReport(emp.employeeID))
})

const filteredSubordinates = computed(() => {
  if (!searchQuery.value) return subordinates.value
  
  const query = searchQuery.value.toLowerCase()
  return subordinates.value.filter((emp) => {
    return (
      emp.name?.toLowerCase().includes(query) ||
      emp.englishName?.toLowerCase().includes(query) ||
      emp.employeeCode?.toLowerCase().includes(query) ||
      emp.loginID?.toLowerCase().includes(query)
    )
  })
})

const isDirectReport = (employeeId: string): boolean => {
  return directReports.value.some((emp) => emp.employeeID === employeeId)
}

const formatStatus = (status: any): string => {
  if (typeof status === 'string') return status
  if (typeof status === 'number') return status.toString()
  if (typeof status === 'object' && status !== null) {
    return status.name || status.value || JSON.stringify(status)
  }
  return 'Unknown'
}

const getStatusClass = (status: any): string => {
  const statusStr = formatStatus(status).toLowerCase()
  if (statusStr.includes('active') || statusStr === '1' || statusStr === 'true') {
    return 'active'
  }
  if (statusStr.includes('inactive') || statusStr === '0' || statusStr === 'false') {
    return 'inactive'
  }
  return 'unknown'
}

const loadSubordinates = async () => {
  loading.value = true
  error.value = null

  try {
    // Load initial data nếu chưa có
    if (!initialDataStore.data) {
      const language = authStore.user?.language || 'en-US'
      await initialDataStore.fetchInitialData(language)
    }

    if (!authStore.user?.employeeID) {
      error.value = 'No employee ID found'
      return
    }

    if (!initialDataStore.data?.employeeList) {
      error.value = 'No employee data available'
      return
    }

    // Get subordinates
    const subs = getSubordinates(
      authStore.user.employeeID,
      initialDataStore.data.employeeList,
      initialDataStore.data.companyGroups || [],
      includeIndirect.value
    )

    subordinates.value = subs
    console.log('✅ Found subordinates:', subs.length)
  } catch (err: any) {
    error.value = err.message || 'Failed to load subordinates'
    console.error('Error loading subordinates:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadSubordinates()
})
</script>

<style scoped>
.subordinates-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

h1 {
  color: #333;
  margin-bottom: 20px;
}

.manager-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  border-left: 4px solid #667eea;
}

.manager-info h2 {
  color: #667eea;
  margin-bottom: 5px;
  font-size: 20px;
}

.employee-code {
  color: #666;
  font-size: 14px;
  font-family: 'Courier New', monospace;
}

.controls {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #eee;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-box {
  text-align: center;
  padding: 40px;
}

.spinner {
  width: 50px;
  height: 50px;
  margin: 0 auto 20px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-box {
  background: #fee;
  color: #c33;
  padding: 15px;
  border-radius: 6px;
  border-left: 4px solid #c33;
  margin-bottom: 20px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  border-left: 4px solid #667eea;
}

.stat-card h3 {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.count {
  font-size: 36px;
  font-weight: bold;
  color: #667eea;
  margin: 0;
}

.subordinates-list h3 {
  color: #333;
  margin-bottom: 20px;
}

.search-box {
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
}

.table-wrapper {
  overflow-x: auto;
  margin-bottom: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #667eea;
  color: white;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

tbody tr:hover {
  background: #f8f9fa;
}

.report-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.report-badge.direct {
  background: #d4edda;
  color: #155724;
}

.report-badge.indirect {
  background: #fff3cd;
  color: #856404;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.status-badge.inactive {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.unknown {
  background: #e2e3e5;
  color: #383d41;
}

.no-results {
  text-align: center;
  color: #999;
  padding: 20px;
  font-style: italic;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 16px;
}
</style>
