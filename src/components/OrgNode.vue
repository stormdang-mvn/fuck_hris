<template>
  <div class="org-node">
    <div class="node-content" :class="nodeClass">
      <div class="node-icon">{{ nodeIcon }}</div>
      <div class="node-info">
        <div class="node-name">{{ node.name }}</div>
        <div class="node-title">{{ node.title }}</div>
      </div>
    </div>

    <div v-if="node.children && node.children.length > 0" class="node-children">
      <div class="children-line"></div>
      <div class="children-container">
        <OrgNode 
          v-for="child in node.children" 
          :key="child.id"
          :node="child"
          :level="level + 1"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { OrgChartNode } from '@/utils/organizationChart'

interface Props {
  node: OrgChartNode
  level: number
}

const props = defineProps<Props>()

const nodeClass = computed(() => {
  return `node-type-${props.node.type} level-${props.level}`
})

const nodeIcon = computed(() => {
  switch (props.node.type) {
    case 'leader':
      return '👑'
    case 'part-leader':
      return '👔'
    case 'member':
      return '👤'
    default:
      return '•'
  }
})
</script>

<style scoped>
.org-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  margin: 10px;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 20px;
  border-radius: 8px;
  background: white;
  border: 2px solid #e0e0e0;
  min-width: 250px;
  transition: all 0.3s;
  position: relative;
}

.node-content:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

.node-type-leader {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  border-color: #ffd700;
  font-weight: 600;
}

.node-type-part-leader {
  background: linear-gradient(135deg, #fff8e1 0%, #ffe6cc 100%);
  border-color: #ff9800;
}

.node-type-member {
  background: linear-gradient(135deg, #f0f4f8 0%, #e0e7ee 100%);
  border-color: #2196f3;
}

.node-icon {
  font-size: 28px;
  line-height: 1;
}

.node-info {
  flex: 1;
}

.node-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  font-size: 15px;
}

.node-title {
  font-size: 12px;
  color: #666;
}

.node-children {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 100%;
  margin-top: 20px;
}

.children-line {
  width: 2px;
  height: 20px;
  background: #ccc;
  margin-bottom: 0;
}

.children-container {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: center;
  position: relative;
}

.children-container::before {
  content: '';
  position: absolute;
  top: -20px;
  left: 0;
  right: 0;
  height: 2px;
  background: #ccc;
}

/* Responsive */
@media (max-width: 768px) {
  .node-content {
    min-width: 200px;
    padding: 12px 15px;
  }

  .node-icon {
    font-size: 24px;
  }

  .node-name {
    font-size: 14px;
  }

  .node-title {
    font-size: 11px;
  }

  .children-container {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
