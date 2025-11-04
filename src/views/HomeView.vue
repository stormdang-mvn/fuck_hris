<template>
  <div class="home">
    <div class="welcome-section">
      <h1>Welcome to HRIS System</h1>
      
      <div v-if="authStore.user" class="user-info">
        <h2>Hello, {{ authStore.user.fullName }}!</h2>
        <div class="info-grid">
          <div class="info-item">
            <strong>Email:</strong>
            <span>{{ authStore.user.email }}</span>
          </div>
          <div class="info-item">
            <strong>Username:</strong>
            <span>{{ authStore.user.username }}</span>
          </div>
          <div class="info-item">
            <strong>Employee ID:</strong>
            <span>{{ authStore.user.employeeID }}</span>
          </div>
        </div>
        
        <button @click="handleLogout" class="logout-button">
          Logout
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
}

.welcome-section {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

h1 {
  color: #333;
  text-align: center;
  margin-bottom: 30px;
  font-size: 32px;
}

.user-info {
  margin-top: 30px;
}

.user-info h2 {
  color: #667eea;
  margin-bottom: 20px;
  font-size: 24px;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
}

.info-item {
  display: flex;
  gap: 10px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
}

.info-item strong {
  color: #555;
  min-width: 120px;
}

.info-item span {
  color: #333;
}

.logout-button {
  padding: 12px 30px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.logout-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(245, 87, 108, 0.4);
}

.logout-button:active {
  transform: translateY(0);
}
</style>
