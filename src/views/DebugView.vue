<template>
  <div class="debug-view">
    <div class="container">
      <h1>🔍 Employee Data Debug</h1>
      
      <div class="info-box">
        <p>Your Employee ID: <code>{{ authStore.user?.employeeID }}</code></p>
      </div>

      <button @click="analyzeData" :disabled="analyzing" class="btn btn-primary">
        {{ analyzing ? 'Analyzing...' : 'Analyze Employee Data Structure' }}
      </button>

      <div v-if="analysis" class="results">
        <div class="section">
          <h2>📊 Data Summary</h2>
          <pre>{{ JSON.stringify(analysis.summary, null, 2) }}</pre>
        </div>

        <div class="section">
          <h2>🔑 Available Fields in Employee Objects</h2>
          <div class="field-list">
            <span v-for="field in analysis.fields" :key="field" class="field-badge">
              {{ field }}
            </span>
          </div>
        </div>

        <div class="section">
          <h2>👤 Your Employee Data</h2>
          <pre>{{ JSON.stringify(analysis.currentEmployee, null, 2) }}</pre>
        </div>

        <div class="section">
          <h2>📋 Sample Employees (First 3)</h2>
          <pre>{{ JSON.stringify(analysis.samples, null, 2) }}</pre>
        </div>

        <div class="section">
          <h2>🔗 Possible Manager/Supervisor Fields</h2>
          <ul>
            <li v-for="field in analysis.managerFields" :key="field">
              <code>{{ field }}</code>
            </li>
          </ul>
          <p v-if="analysis.managerFields.length === 0" class="no-data">
            No obvious manager fields found. Check the sample data above.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useInitialDataStore } from '@/stores/initialData'

const authStore = useAuthStore()
const initialDataStore = useInitialDataStore()

const analyzing = ref(false)
const analysis = ref<any>(null)

const analyzeData = async () => {
  analyzing.value = true

  try {
    // Load data if needed
    if (!initialDataStore.data) {
      await initialDataStore.fetchInitialData(authStore.user?.language || 'en-US')
    }

    if (!initialDataStore.data?.employeeList) {
      alert('No employee data available')
      return
    }

    const employees = initialDataStore.data.employeeList
    const currentEmp = employees.find((e) => e.id === authStore.user?.employeeID)

    // Analyze fields
    const allFields = new Set<string>()
    const managerLikeFields: string[] = []

    employees.forEach((emp: any) => {
      Object.keys(emp).forEach((key) => {
        allFields.add(key)
        
        // Check for manager-like fields
        const lowerKey = key.toLowerCase()
        if (
          lowerKey.includes('manager') ||
          lowerKey.includes('supervisor') ||
          lowerKey.includes('report') ||
          lowerKey.includes('leader') ||
          lowerKey.includes('superior')
        ) {
          if (!managerLikeFields.includes(key)) {
            managerLikeFields.push(key)
          }
        }
      })

      // Check nested employeeProfile
      if (emp.employeeProfile && typeof emp.employeeProfile === 'object') {
        Object.keys(emp.employeeProfile).forEach((key) => {
          const fullKey = `employeeProfile.${key}`
          allFields.add(fullKey)
          
          const lowerKey = key.toLowerCase()
          if (
            lowerKey.includes('manager') ||
            lowerKey.includes('supervisor') ||
            lowerKey.includes('report') ||
            lowerKey.includes('leader')
          ) {
            if (!managerLikeFields.includes(fullKey)) {
              managerLikeFields.push(fullKey)
            }
          }
        })
      }
    })

    analysis.value = {
      summary: {
        totalEmployees: employees.length,
        hasCurrentEmployee: !!currentEmp,
        totalFields: allFields.size,
        managerFieldsFound: managerLikeFields.length
      },
      fields: Array.from(allFields).sort(),
      currentEmployee: currentEmp || null,
      samples: employees.slice(0, 3),
      managerFields: managerLikeFields
    }
  } catch (err: any) {
    alert(`Error: ${err.message}`)
  } finally {
    analyzing.value = false
  }
}
</script>

<style scoped>
.debug-view {
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

.info-box {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  border-left: 4px solid #667eea;
}

.info-box code {
  background: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  color: #667eea;
  font-family: 'Courier New', monospace;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 30px;
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

.results {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.section h2 {
  color: #667eea;
  margin-bottom: 15px;
  font-size: 18px;
}

pre {
  background: #fff;
  padding: 15px;
  border-radius: 6px;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #333;
  max-height: 400px;
  overflow-y: auto;
}

.field-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.field-badge {
  background: #667eea;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-family: 'Courier New', monospace;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  padding: 8px;
  background: #fff;
  margin-bottom: 8px;
  border-radius: 4px;
}

.no-data {
  color: #999;
  font-style: italic;
  padding: 10px;
}
</style>
