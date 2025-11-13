<template>
  <div class="tree-chart">
    <div class="tree-container">
      <!-- Team Leader (Root) with Direct Reports -->
      <div class="team-leader-section">
        <div class="team-leader-card">
          <!-- Leader Info -->
          <div class="leader-header">
            <img 
              v-if="teamLeader.employeeProfile?.pictureUrl" 
              :src="teamLeader.employeeProfile.pictureUrl" 
              :alt="teamLeader.name"
              class="leader-avatar"
              @error="handleImageError"
            />
            <div v-else class="leader-avatar avatar-placeholder">
              {{ getInitials(teamLeader.name) }}
            </div>
            <div class="leader-content">
              <div class="leader-name">{{ teamLeader.name }}</div>
              <div class="leader-role">Team Leader</div>
            </div>
          </div>
          <div class="team-badge">{{ teamName }}</div>
          <div class="employee-count">{{ totalMembers }} employees</div>

          <!-- Direct Employees (without Part) -->
          <div v-if="directEmployeesWithoutPart.length > 0" class="direct-reports-section">
            <div class="direct-reports-header">Direct Reports</div>
            <div 
              v-for="grade in directEmployeesByGrade" 
              :key="'direct-' + grade.gradeName"
              class="grade-group-leader"
            >
              <div class="grade-label-leader">{{ grade.gradeName }}</div>
              
              <div v-if="grade.members.length === 0" class="no-member">
                No Member
              </div>
              
              <div v-else class="members-list-leader">
                <div 
                  v-for="member in grade.members" 
                  :key="member.employeeID"
                  class="member-item-leader"
                >
                  <img 
                    v-if="member.employeeProfile?.pictureUrl" 
                    :src="member.employeeProfile.pictureUrl" 
                    :alt="member.name"
                    class="member-avatar-leader"
                    @error="handleImageError"
                  />
                  <div v-else class="member-avatar-leader avatar-placeholder-sm">
                    {{ getInitials(member.name) }}
                  </div>
                  <div class="member-name-leader">{{ member.name }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Connector Line -->
      <div class="connector-vertical" v-if="parts.length > 0"></div>

      <!-- Parts -->
      <div class="parts-container" v-if="parts.length > 0">
        <div 
          v-for="part in partsWithGrades" 
          :key="part.group.oldGroupID"
          class="part-section"
        >
          <!-- Part Card -->
          <div class="part-card">
            <!-- Part Manager (Top) -->
            <div v-if="part.leader" class="manager-section-top">
              <img 
                v-if="part.leader.employeeProfile?.pictureUrl" 
                :src="part.leader.employeeProfile.pictureUrl" 
                :alt="part.leader.name"
                class="manager-avatar-top"
                @error="handleImageError"
              />
              <div v-else class="manager-avatar-top avatar-placeholder-top">
                {{ getInitials(part.leader.name) }}
              </div>
              <div class="manager-info-top">
                <div class="manager-name-top">{{ part.leader.name }}</div>
                <div class="manager-role-top">Part Leader</div>
              </div>
            </div>

            <!-- Part Header -->
            <div class="part-header">
              <span class="part-name">{{ part.group.groupName }}</span>
            </div>
            <div class="part-count">{{ part.members.length }} employees</div>

            <!-- Members grouped by grade -->
            <div 
              v-for="grade in part.gradeGroups" 
              :key="grade.gradeName"
              class="grade-group"
            >
              <div class="grade-label">{{ grade.gradeName }}</div>
              
              <div v-if="grade.members.length === 0" class="no-member">
                No Member
              </div>
              
              <div v-else class="members-list">
                <div 
                  v-for="member in grade.members" 
                  :key="member.employeeID"
                  class="member-item"
                >
                  <img 
                    v-if="member.employeeProfile?.pictureUrl" 
                    :src="member.employeeProfile.pictureUrl" 
                    :alt="member.name"
                    class="member-avatar"
                    @error="handleImageError"
                  />
                  <div v-else class="member-avatar avatar-placeholder-sm">
                    {{ getInitials(member.name) }}
                  </div>
                  <div class="member-name">{{ member.name }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Employee } from '@/types/initial-data'
import type { PartInfo, TeamMember } from '@/utils/organizationChart'

interface Props {
  teamLeader: Employee
  teamName: string
  parts: PartInfo[]
  directReports: TeamMember[]
}

const props = defineProps<Props>()

// Grade mapping - Match với fieldDataValues trong initialData
const gradeMap: Record<string, string> = {
  'ecd4977e-8f28-4c84-8301-eb5ac1ddacb0': 'SENIOR GRADE',      // Senior
  'd499d1dd-147d-4287-a6c8-37571066f2e7': 'INTERMEDIATE GRADE', // Intermediate
  'c3d044ba-a09d-4255-a919-d09222d9eba8': 'JUNIOR GRADE',       // Junior
}

const getGradeName = (gradeId: string | undefined): string => {
  if (!gradeId) return 'UNKNOWN GRADE'
  return gradeMap[gradeId] || 'UNKNOWN GRADE'
}

const getInitials = (name: string): string => {
  const parts = name.split(' ').filter(p => p.length > 0)
  if (parts.length >= 2 && parts[0]?.[0] && parts[parts.length - 1]?.[0]) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
  const placeholder = img.nextElementSibling as HTMLElement
  if (placeholder && placeholder.classList.contains('avatar-placeholder')) {
    placeholder.style.display = 'flex'
  }
}

// Calculate total members across all parts + direct employees
const totalMembers = computed(() => {
  const partMembers = props.parts.reduce((sum, part) => sum + part.members.length, 0)
  const directMembers = directEmployeesWithoutPart.value.length
  return partMembers + directMembers
})

// Get direct employees who don't belong to any Part (Team Embedded Platform employees)
const directEmployeesWithoutPart = computed(() => {
  return props.directReports.filter(member => !member.partName && !member.isPartLeader)
})

// Group direct employees by grade
const directEmployeesByGrade = computed(() => {
  const gradeGroups = new Map<string, Employee[]>()
  
  // Initialize all grades
  const grades = ['SENIOR GRADE', 'INTERMEDIATE GRADE', 'JUNIOR GRADE']
  grades.forEach(grade => gradeGroups.set(grade, []))

  // Group by grade
  directEmployeesWithoutPart.value.forEach(member => {
    const gradeName = getGradeName(member.employee.employeeProfile?.jobGradeID)
    if (!gradeGroups.has(gradeName)) {
      gradeGroups.set(gradeName, [])
    }
    gradeGroups.get(gradeName)!.push(member.employee)
  })

  return Array.from(gradeGroups.entries()).map(([gradeName, members]) => ({
    gradeName,
    members
  }))
})

// Group members by grade for each part
interface PartWithGrades extends PartInfo {
  gradeGroups: {
    gradeName: string
    members: Employee[]
  }[]
}

const partsWithGrades = computed<PartWithGrades[]>(() => {
  return props.parts.map(part => {
    const gradeGroups = new Map<string, Employee[]>()
    
    // Initialize all grades
    const grades = ['SENIOR GRADE', 'INTERMEDIATE GRADE', 'JUNIOR GRADE']
    grades.forEach(grade => gradeGroups.set(grade, []))

    // Group members by grade (excluding the part leader)
    part.members.forEach(member => {
      // Skip if this member is the part leader
      if (part.leader && member.employeeID === part.leader.employeeID) {
        return
      }
      
      const gradeName = getGradeName(member.employeeProfile?.jobGradeID)
      if (!gradeGroups.has(gradeName)) {
        gradeGroups.set(gradeName, [])
      }
      gradeGroups.get(gradeName)!.push(member)
    })

    return {
      ...part,
      gradeGroups: Array.from(gradeGroups.entries()).map(([gradeName, members]) => ({
        gradeName,
        members
      }))
    }
  })
})
</script>

<style scoped>
.tree-chart {
  width: 100%;
  padding: 20px 0;
  background: transparent;
  border-radius: 0;
  overflow-x: visible;
}

.tree-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

/* Team Leader Section */
.team-leader-section {
  display: flex;
  justify-content: center;
}

.team-leader-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
  overflow: hidden;
  min-width: 280px;
  max-width: 400px;
}

.leader-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.leader-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.leader-content {
  flex: 1;
}

.leader-name {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 2px;
}

.leader-role {
  font-size: 11px;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.team-badge {
  background: #f5f5f5;
  padding: 6px 18px;
  font-size: 11px;
  font-weight: 600;
  color: #667eea;
  text-align: center;
  border-bottom: 1px solid #e0e0e0;
}

.employee-count {
  background: #e3f2fd;
  padding: 5px 18px;
  font-size: 10px;
  font-weight: 600;
  color: #1976d2;
  text-align: center;
}

/* Direct Reports Section inside Leader Card */
.direct-reports-section {
  padding: 10px 14px 14px;
}

.direct-reports-header {
  font-size: 12px;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 2px solid #667eea;
}

.grade-group-leader {
  margin-bottom: 10px;
}

.grade-group-leader:last-child {
  margin-bottom: 0;
}

.grade-label-leader {
  font-size: 9px;
  font-weight: 700;
  color: #666;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.members-list-leader {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.member-item-leader {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: #f8f9fa;
  border-radius: 5px;
  transition: all 0.3s ease;
  border-left: 3px solid #667eea;
}

.member-item-leader:hover {
  background: #f3e5f5;
  transform: translateX(4px);
}

.member-avatar-leader {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.member-name-leader {
  font-size: 12px;
  font-weight: 500;
  color: #1a1a1a;
}

.avatar-placeholder {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
  color: #667eea;
  border: 3px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.avatar-placeholder-sm {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
  color: #667eea;
  border: 2px solid white;
  flex-shrink: 0;
}

/* Connector */
.connector-vertical {
  width: 2px;
  height: 20px;
  background: linear-gradient(180deg, #667eea 0%, #cbd5e0 100%);
}

/* Parts Container */
.parts-container {
  display: flex;
  gap: 72px;
  width: 100%;
  justify-content: center;
  flex-wrap: wrap;
}

.part-section {
  width: auto;
  min-width: 280px;
  max-width: 400px;
  flex: 0 1 auto;
}

/* Part Card */
.part-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(33, 150, 243, 0.3);
  overflow: hidden;
  border: none;
}

/* Manager Section at Top */
.manager-section-top {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.manager-avatar-top {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.avatar-placeholder-top {
  background: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  color: white;
}

.manager-info-top {
  flex: 1;
}

.manager-name-top {
  font-weight: 700;
  font-size: 15px;
  margin-bottom: 2px;
}

.manager-role-top {
  font-size: 12px;
  opacity: 0.9;
}

.part-header {
  background: #f5f5f5;
  padding: 6px 18px;
  font-size: 11px;
  font-weight: 600;
  color: #667eea;
  text-align: center;
  border-bottom: 1px solid #e0e0e0;
}

.part-name {
  flex: 1;
}

.part-count {
  background: #e3f2fd;
  color: #1976d2;
  padding: 5px 14px;
  font-size: 10px;
  font-weight: 600;
  text-align: center;
}

/* Manager Section */
.manager-section {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8eaf6 100%);
  border-bottom: 2px solid #2196f3;
}

.manager-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #2196f3;
  box-shadow: 0 2px 5px rgba(33, 150, 243, 0.3);
}

.manager-info {
  flex: 1;
}

.manager-name {
  font-weight: 700;
  font-size: 13px;
  color: #1a1a1a;
  margin-bottom: 2px;
}

.manager-role {
  font-size: 10px;
  color: #2196f3;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Grade Groups */
.grade-group {
  padding: 10px 14px;
  border-bottom: 1px solid #f0f0f0;
}

.grade-group:last-child {
  border-bottom: none;
}

.grade-label {
  font-size: 9px;
  font-weight: 700;
  color: #666;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.no-member {
  color: #999;
  font-size: 10px;
  font-style: italic;
  padding: 4px 0;
}

/* Members List */
.members-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  background: #f8f9fa;
  border-radius: 5px;
  transition: all 0.3s ease;
  border-left: 3px solid #2196f3;
}

.member-item:hover {
  background: #e3f2fd;
  transform: translateX(4px);
}

.member-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.member-name {
  font-size: 12px;
  font-weight: 500;
  color: #1a1a1a;
}

/* Responsive */
@media (max-width: 768px) {
  .tree-chart {
    padding: 15px 0;
  }

  .tree-container {
    gap: 15px;
  }

  .team-leader-card {
    min-width: 280px;
    max-width: 100%;
  }

  .parts-container {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>
