<template>
  <div class="employee-search">
    <label class="search-label">Search Employees:</label>
    
    <!-- Search Input -->
    <div class="search-input-container">
      <input
        v-model="searchQuery"
        @input="handleSearch"
        @focus="showSuggestions = true"
        @keydown.enter.prevent="selectFirstSuggestion"
        @keydown.escape="hideSuggestions"
        placeholder="Type employee name or email..."
        class="search-input"
      />
      
      <!-- Search Icon -->
      <div class="search-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
      </div>
      
      <!-- Suggestions Dropdown -->
      <div v-if="showSuggestions && filteredEmployees.length > 0" class="suggestions-dropdown">
        <div
          v-for="employee in filteredEmployees.slice(0, 5)"
          :key="employee.employeeID"
          @click="selectEmployee(employee)"
          class="suggestion-item"
        >
          <img
            v-if="employee.employeeProfile?.pictureUrl"
            :src="employee.employeeProfile.pictureUrl"
            :alt="employee.englishName"
            class="suggestion-avatar"
            @error="handleImageError"
          />
          <div v-else class="suggestion-avatar avatar-placeholder">
            {{ getInitials(employee.englishName) }}
          </div>
          
          <div class="suggestion-info">
            <div class="suggestion-name">{{ employee.englishName }}</div>
            <div class="suggestion-email">{{ employee.email }}</div>
            <div class="suggestion-code">{{ employee.employeeCode }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Selected Employees -->
    <div v-if="selectedEmployees.length > 0" class="selected-employees">
      <div
        v-for="employee in selectedEmployees"
        :key="employee.employeeID"
        class="selected-employee-tag"
      >
        <img
          v-if="employee.employeeProfile?.pictureUrl"
          :src="employee.employeeProfile.pictureUrl"
          :alt="employee.englishName"
          class="tag-avatar"
          @error="handleImageError"
        />
        <div v-else class="tag-avatar avatar-placeholder">
          {{ getInitials(employee.englishName) }}
        </div>
        
        <span class="tag-name">{{ employee.englishName }}</span>
        
        <button
          @click="removeEmployee(employee.employeeID)"
          class="remove-btn"
          title="Remove employee"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useInitialDataStore } from '@/stores/initialData'

// Types
interface Employee {
  employeeID: string
  employeeCode: string
  email?: string
  englishName: string
  name: string
  employeeProfile?: {
    pictureUrl?: string
  }
}

// Props & Emits
defineProps<{
  modelValue: Employee[]
}>()

const emit = defineEmits<{
  'update:modelValue': [employees: Employee[]]
}>()

// Store
const initialDataStore = useInitialDataStore()

// Reactive data
const searchQuery = ref('')
const showSuggestions = ref(false)
const selectedEmployees = ref<Employee[]>([])

// Computed
const employeeList = computed(() => {
  return initialDataStore.data?.employeeList || []
})

const filteredEmployees = computed(() => {
  if (!searchQuery.value.trim()) return []
  
  const query = searchQuery.value.toLowerCase().trim()
  const selectedIds = new Set(selectedEmployees.value.map(emp => emp.employeeID))
  
  return employeeList.value.filter(employee => {
    if (selectedIds.has(employee.employeeID)) return false
    
    return (
      employee.englishName?.toLowerCase().includes(query) ||
      employee.email?.toLowerCase().includes(query) ||
      employee.name?.toLowerCase().includes(query) ||
      employee.employeeCode?.toLowerCase().includes(query)
    )
  })
})

// Methods
const handleSearch = () => {
  showSuggestions.value = true
}

const selectEmployee = (employee: Employee) => {
  selectedEmployees.value.push(employee)
  emit('update:modelValue', selectedEmployees.value)
  searchQuery.value = ''
  showSuggestions.value = false
}

const removeEmployee = (employeeID: string) => {
  selectedEmployees.value = selectedEmployees.value.filter(emp => emp.employeeID !== employeeID)
  emit('update:modelValue', selectedEmployees.value)
}

const selectFirstSuggestion = () => {
  if (filteredEmployees.value.length > 0 && filteredEmployees.value[0]) {
    selectEmployee(filteredEmployees.value[0])
  }
}

const hideSuggestions = () => {
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

const getInitials = (name: string): string => {
  return name
    ?.split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??'
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}

// Watch for external changes
watch(() => selectedEmployees.value, (newVal) => {
  emit('update:modelValue', newVal)
}, { deep: true })

// Click outside to hide suggestions
document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.employee-search')) {
    showSuggestions.value = false
  }
})
</script>

<style scoped>
.employee-search {
  margin-bottom: 20px;
}

.search-label {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  font-size: 14px;
}

.search-input-container {
  position: relative;
  width: 100%;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 45px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 14px;
  background: white;
  transition: all 0.3s;
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-icon {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  pointer-events: none;
}

/* Suggestions Dropdown */
.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #e0e0e0;
  border-top: none;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 250px;
  overflow-y: auto;
  z-index: 1000;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.suggestion-item:hover {
  background-color: #f8f9ff;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e0e0e0;
  flex-shrink: 0;
}

.avatar-placeholder {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
}

.suggestion-info {
  flex: 1;
  min-width: 0;
}

.suggestion-name {
  font-weight: 600;
  color: #333;
  font-size: 14px;
  margin-bottom: 2px;
}

.suggestion-email {
  color: #666;
  font-size: 12px;
  margin-bottom: 1px;
}

.suggestion-code {
  color: #999;
  font-size: 11px;
  font-family: monospace;
}

/* Selected Employees */
.selected-employees {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  padding: 12px;
  background: #f8f9ff;
  border-radius: 12px;
  border: 2px solid #e3f2fd;
}

.selected-employee-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 1px solid #667eea;
  border-radius: 20px;
  padding: 6px 12px 6px 6px;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.1);
  transition: all 0.2s;
}

.selected-employee-tag:hover {
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.2);
}

.tag-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.tag-name {
  font-weight: 500;
  color: #333;
  font-size: 13px;
  white-space: nowrap;
}

.remove-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 2px;
  border-radius: 50%;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background: #fee;
  color: #f44336;
}

/* Responsive */
@media (max-width: 768px) {
  .search-input {
    padding: 10px 14px 10px 40px;
  }
  
  .suggestion-item {
    padding: 10px 14px;
  }
  
  .selected-employees {
    padding: 10px;
  }
}
</style>