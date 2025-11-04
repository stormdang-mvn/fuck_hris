<template>
  <div class="initial-data-view">
    <div class="container">
      <h1>📊 Initial Data Manager</h1>
      
      <div class="actions">
        <button @click="loadData" :disabled="isLoading" class="btn btn-primary">
          {{ isLoading ? 'Loading...' : 'Load Initial Data' }}
        </button>
        
        <button @click="clearData" :disabled="isLoading" class="btn btn-danger">
          Clear Cache
        </button>
        
        <button 
          v-if="initialDataStore.data" 
          @click="exportFullData" 
          :disabled="isLoading" 
          class="btn btn-success"
        >
          💾 Export Full Data (JSON)
        </button>
        
        <button 
          v-if="initialDataStore.data" 
          @click="exportEmployeesOnly" 
          :disabled="isLoading" 
          class="btn btn-info"
        >
          👥 Export Employees Only
        </button>
        
        <button 
          v-if="initialDataStore.data" 
          @click="copyFullData" 
          :disabled="isLoading" 
          class="btn btn-secondary"
        >
          📋 Copy to Clipboard
        </button>
      </div>

      <div v-if="error" class="error-box">
        ❌ Error: {{ error }}
      </div>

      <div v-if="exportStatus" class="success-box">
        {{ exportStatus }}
      </div>

      <div v-if="isLoading && !initialDataStore.data" class="loading-box">
        <div class="spinner"></div>
        <p>Loading initial data...</p>
      </div>

      <div v-if="initialDataStore.data" class="data-summary">
        <h2>✅ Data Loaded Successfully</h2>
        
        <div class="info-grid">
          <div class="info-card">
            <h3>📝 Hash Value</h3>
            <code>{{ initialDataStore.hashValue }}</code>
          </div>

          <div class="info-card">
            <h3>👥 Employees</h3>
            <p class="count">{{ initialDataStore.data.employeeList?.length || 0 }}</p>
          </div>

          <div class="info-card">
            <h3>🏢 Company Groups</h3>
            <p class="count">{{ initialDataStore.data.companyGroups?.companyGroups?.length || 0 }}</p>
          </div>

          <div class="info-card">
            <h3>⚙️ Field Configs</h3>
            <p class="count">{{ initialDataStore.data.fieldConfigs?.length || 0 }}</p>
          </div>

          <div class="info-card">
            <h3>📅 Work Weeks</h3>
            <p class="count">{{ initialDataStore.data.listWorkWeek?.length || 0 }}</p>
          </div>

          <div class="info-card">
            <h3>🌐 Employee Globals</h3>
            <p class="count">{{ initialDataStore.data.employeeGlobals?.length || 0 }}</p>
          </div>
        </div>

        <div class="data-preview">
          <h3>👥 Employee List (First 5)</h3>
          <div class="table-wrapper">
            <table v-if="initialDataStore.data.employeeList?.length">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>English Name</th>
                  <th>Login ID</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="emp in initialDataStore.data.employeeList.slice(0, 5)" :key="emp.employeeID">
                  <td>{{ emp.employeeCode || 'N/A' }}</td>
                  <td>{{ emp.name || 'N/A' }}</td>
                  <td>{{ emp.englishName || 'N/A' }}</td>
                  <td>{{ emp.loginID || 'N/A' }}</td>
                  <td>
                    <span :class="['status-badge', getStatusClass(emp.status)]">
                      {{ formatStatus(emp.status) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            <p v-else class="no-data">No employee data available</p>
          </div>
        </div>

        <div class="data-preview">
          <h3>🏢 Company Groups</h3>
          <div class="json-preview">
            <pre>{{ JSON.stringify(initialDataStore.data.companyGroups, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useInitialDataStore } from '@/stores/initialData'
import { useAuthStore } from '@/stores/auth'
import { exportToJson, copyToClipboard } from '@/utils/fileExport'

const initialDataStore = useInitialDataStore()
const authStore = useAuthStore()

const loading = ref(false)
const error = ref<string | null>(null)
const exportStatus = ref<string | null>(null)

const isLoading = computed(() => loading.value || initialDataStore.loading)

const loadData = async () => {
  try {
    loading.value = true
    error.value = null
    
    const language = authStore.user?.language || 'en-US'
    await initialDataStore.fetchInitialData(language)
  } catch (err: any) {
    error.value = err.message || 'Failed to load data'
  } finally {
    loading.value = false
  }
}

const clearData = () => {
  initialDataStore.clearCache()
  error.value = null
}

const exportFullData = () => {
  if (!initialDataStore.data) {
    error.value = 'No data to export'
    return
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const filename = `initial-data-full-${timestamp}.json`
  
  const success = exportToJson(initialDataStore.data, filename)
  if (success) {
    exportStatus.value = '✅ Full data exported successfully!'
    setTimeout(() => exportStatus.value = null, 3000)
  } else {
    error.value = 'Failed to export data'
  }
}

const exportEmployeesOnly = () => {
  if (!initialDataStore.data?.employeeList) {
    error.value = 'No employee data to export'
    return
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const filename = `employees-${timestamp}.json`
  
  const success = exportToJson(initialDataStore.data.employeeList, filename)
  if (success) {
    exportStatus.value = '✅ Employee data exported successfully!'
    setTimeout(() => exportStatus.value = null, 3000)
  } else {
    error.value = 'Failed to export employee data'
  }
}

const copyFullData = async () => {
  if (!initialDataStore.data) {
    error.value = 'No data to copy'
    return
  }
  
  const success = await copyToClipboard(initialDataStore.data)
  if (success) {
    exportStatus.value = '✅ Data copied to clipboard!'
    setTimeout(() => exportStatus.value = null, 3000)
  } else {
    error.value = 'Failed to copy data to clipboard'
  }
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
</script>

<style scoped>
.initial-data-view {
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
  margin-bottom: 30px;
  font-size: 32px;
}

.actions {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
  flex-wrap: wrap;
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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn-danger {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(245, 87, 108, 0.4);
}

.btn-success {
  background: linear-gradient(135deg, #5ee7df 0%, #b490ca 100%);
  color: white;
}

.btn-success:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(94, 231, 223, 0.4);
}

.btn-info {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.btn-info:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(79, 172, 254, 0.4);
}

.btn-secondary {
  background: linear-gradient(135deg, #a8a8a8 0%, #636363 100%);
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(168, 168, 168, 0.4);
}

.error-box {
  background: #fee;
  color: #c33;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
  border-left: 4px solid #c33;
}

.success-box {
  background: #efe;
  color: #383;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
  border-left: 4px solid #383;
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.loading-box {
  text-align: center;
  padding: 40px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
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

.loading-box p {
  color: #667eea;
  font-weight: 600;
  margin: 0;
}

.data-summary h2 {
  color: #667eea;
  margin-bottom: 20px;
  font-size: 24px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.info-card {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.info-card h3 {
  color: #555;
  font-size: 14px;
  margin-bottom: 10px;
  font-weight: 600;
}

.info-card code {
  display: block;
  background: #fff;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  word-break: break-all;
  color: #667eea;
}

.count {
  font-size: 32px;
  font-weight: bold;
  color: #667eea;
  margin: 0;
}

.data-preview {
  margin-top: 30px;
}

.data-preview h3 {
  color: #333;
  margin-bottom: 15px;
  font-size: 20px;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: white;
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

th {
  font-weight: 600;
}

tbody tr:hover {
  background: #f8f9fa;
}

.no-data {
  text-align: center;
  color: #999;
  padding: 20px;
  font-style: italic;
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
  background: #fff3cd;
  color: #856404;
}

.json-preview {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  overflow-x: auto;
  max-height: 400px;
}

.json-preview pre {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #333;
}
</style>
