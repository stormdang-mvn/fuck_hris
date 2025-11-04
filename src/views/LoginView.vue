<template>
  <div class="login-container">
    <!-- Background Decorations -->
    <div class="bg-decorations">
      <div class="bg-logo"></div>
      <div class="bg-circle circle-1"></div>
      <div class="bg-circle circle-2"></div>
      <div class="bg-circle circle-3"></div>
      <div class="bg-circle circle-4"></div>
      <div class="floating-shape shape-1"></div>
      <div class="floating-shape shape-2"></div>
      <div class="floating-shape shape-3"></div>
    </div>

    <div class="login-box">
      <div class="login-header">
        <div class="logo-container">
          <img src="@/assets/marubeni-logo.svg" alt="MARUSYS VINA" class="company-logo" />
        </div>
        <h1 class="login-title">Welcome Back!</h1>
        <p class="login-subtitle">Sign in to access your HRIS account</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">
            <span class="label-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </span>
            Username
          </label>
          <div class="input-wrapper">
            <span class="input-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </span>
            <input
              id="username"
              v-model="loginForm.username"
              type="text"
              placeholder="Enter your username"
              required
              :disabled="loading"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="password">
            <span class="label-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </span>
            Password
          </label>
          <div class="input-wrapper">
            <span class="input-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </span>
            <input
              id="password"
              v-model="loginForm.password"
              type="password"
              placeholder="Enter your password"
              required
              :disabled="loading"
            />
          </div>
        </div>

        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input
              v-model="loginForm.rememberMe"
              type="checkbox"
              :disabled="loading"
            />
            <span class="checkbox-custom"></span>
            <span class="checkbox-text">Remember me for 30 days</span>
          </label>
        </div>

        <div v-if="errorMessage" class="error-message">
          <span class="error-icon">⚠️</span>
          {{ errorMessage }}
        </div>

        <button type="submit" class="login-button" :disabled="loading">
          <span v-if="loading" class="button-loader"></span>
          <span v-else class="button-icon">→</span>
          <span class="button-text">{{ loading ? 'Logging in...' : 'Login' }}</span>
        </button>
      </form>

      <div class="login-footer">
        <p>Powered by <strong>HRIS Platform</strong></p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/services/api'
import type { LoginRequest } from '@/types/auth'

const router = useRouter()
const authStore = useAuthStore()

const loginForm = ref<LoginRequest>({
  username: '',
  password: '',
  rememberMe: false
})

const loading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  try {
    loading.value = true
    errorMessage.value = ''

    const response = await authApi.login(loginForm.value)
    
    // Lưu thông tin đăng nhập
    authStore.setAuthData(response)
    
    // Chuyển hướng đến trang home
    router.push('/')
  } catch (error: any) {
    console.error('Login failed:', error)
    errorMessage.value = error.response?.data?.message || 'Login failed. Please check your credentials.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* Background Decorations */
.bg-decorations {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.bg-logo {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 800px;
  height: 800px;
  background-image: url('@/assets/marubeni-logo.svg');
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  opacity: 0.03;
  filter: blur(2px);
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
}

.circle-1 {
  width: 400px;
  height: 400px;
  top: -200px;
  right: -100px;
  animation: float 8s ease-in-out infinite;
}

.circle-2 {
  width: 300px;
  height: 300px;
  bottom: -150px;
  left: -100px;
  animation: float 10s ease-in-out infinite reverse;
}

.circle-3 {
  width: 200px;
  height: 200px;
  top: 50%;
  left: 10%;
  animation: float 12s ease-in-out infinite;
  animation-delay: 2s;
}

.circle-4 {
  width: 150px;
  height: 150px;
  bottom: 20%;
  right: 15%;
  animation: float 9s ease-in-out infinite reverse;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.4;
  }
  50% {
    transform: translate(30px, -30px) scale(1.1);
    opacity: 0.6;
  }
}

.floating-shape {
  position: absolute;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
}

.shape-1 {
  width: 100px;
  height: 100px;
  top: 15%;
  right: 25%;
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  animation: rotate-float 15s linear infinite;
}

.shape-2 {
  width: 80px;
  height: 80px;
  bottom: 25%;
  left: 20%;
  clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);
  animation: rotate-float 20s linear infinite reverse;
}

.shape-3 {
  width: 60px;
  height: 60px;
  top: 60%;
  right: 10%;
  clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%);
  animation: rotate-float 18s linear infinite;
  animation-delay: 3s;
}

@keyframes rotate-float {
  0%, 100% {
    transform: rotate(0deg) translateY(0);
  }
  25% {
    transform: rotate(90deg) translateY(-20px);
  }
  50% {
    transform: rotate(180deg) translateY(0);
  }
  75% {
    transform: rotate(270deg) translateY(20px);
  }
}

/* Login Box */
.login-box {
  background: white;
  padding: 48px 40px;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 440px;
  position: relative;
  z-index: 1;
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo-container {
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
  padding: 0 20px;
}

.company-logo {
  width: 280px;
  max-width: 100%;
  height: auto;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1));
  animation: fadeIn 0.8s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-icon {
  font-size: 64px;
  margin-bottom: 16px;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.login-title {
  color: #1a1a1a;
  margin: 0 0 8px 0;
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-subtitle {
  color: #666;
  font-size: 15px;
  margin: 0;
  font-weight: 500;
}

/* Form */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-group label {
  color: #333;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.label-icon {
  font-size: 18px;
  color: #667eea;
  display: flex;
  align-items: center;
}

.label-icon svg {
  stroke: #667eea;
}

.input-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  display: flex;
  align-items: center;
  pointer-events: none;
  transition: all 0.3s;
}

.input-icon svg {
  stroke: #999;
  transition: stroke 0.3s;
}

.form-group input:focus + .input-icon,
.input-wrapper:focus-within .input-icon {
  color: #667eea;
}

.input-wrapper:focus-within .input-icon svg {
  stroke: #667eea;
}

.form-group input[type="text"],
.form-group input[type="password"] {
  width: 100%;
  padding: 14px 18px 14px 50px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 15px;
  transition: all 0.3s;
  background: #fafafa;
  box-sizing: border-box;
}

.form-group input[type="text"]:focus,
.form-group input[type="password"]:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  transform: translateY(-2px);
}

.form-group input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.6;
}

/* Checkbox */
.checkbox-group {
  flex-direction: row;
  align-items: center;
  margin-top: -8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-weight: 500 !important;
  position: relative;
  padding-left: 32px;
}

.checkbox-label input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkbox-custom {
  position: absolute;
  left: 0;
  height: 22px;
  width: 22px;
  background-color: #fafafa;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  transition: all 0.3s;
}

.checkbox-label:hover .checkbox-custom {
  border-color: #667eea;
  background-color: #f0f3ff;
}

.checkbox-label input:checked ~ .checkbox-custom {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
}

.checkbox-custom::after {
  content: "";
  position: absolute;
  display: none;
  left: 7px;
  top: 3px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-label input:checked ~ .checkbox-custom::after {
  display: block;
}

.checkbox-text {
  font-size: 14px;
  color: #555;
}

/* Error Message */
.error-message {
  background: linear-gradient(135deg, #fee 0%, #fcc 100%);
  color: #c33;
  padding: 14px 16px;
  border-radius: 12px;
  font-size: 14px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 2px solid #faa;
  font-weight: 600;
  animation: shake 0.5s;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

.error-icon {
  font-size: 18px;
}

/* Login Button */
.login-button {
  padding: 16px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  margin-top: 8px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
}

.login-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s;
}

.login-button:hover:not(:disabled)::before {
  left: 100%;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.5);
}

.login-button:active:not(:disabled) {
  transform: translateY(-1px);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.2);
}

.button-loader {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.button-icon {
  font-size: 20px;
  font-weight: bold;
  transition: transform 0.3s;
}

.login-button:hover:not(:disabled) .button-icon {
  transform: translateX(4px);
}

.button-text {
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* Login Footer */
.login-footer {
  margin-top: 32px;
  text-align: center;
  padding-top: 24px;
  border-top: 2px solid #f0f0f0;
}

.login-footer p {
  margin: 0;
  color: #999;
  font-size: 13px;
}

.login-footer strong {
  color: #667eea;
  font-weight: 700;
}
</style>

