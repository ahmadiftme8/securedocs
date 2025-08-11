<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h1>SecureDocs</h1>
        <p>Sign in to your account</p>
      </div>

      <form @submit.prevent="handleSubmit" class="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="credentials.email"
            type="email"
            required
            :disabled="isLoading"
            placeholder="Enter your email"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="credentials.password"
            type="password"
            required
            :disabled="isLoading"
            placeholder="Enter your password"
          />
        </div>

        <div class="form-error" v-if="loginError">
          {{ loginError }}
        </div>

        <button type="submit" class="login-button" :disabled="isLoading || !isFormValid">
          <span v-if="isLoading" class="loading-spinner"></span>
          {{ isLoading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <!-- Demo/Development only - Remove in production -->
      <div class="demo-login" v-if="isDevelopment && enableMockLogin">
        <p>Demo Login (Development Only):</p>
        <div class="demo-buttons">
          <button @click="handleDemoLogin('user')" :disabled="isLoading" class="demo-button user">
            Login as User
          </button>
          <button @click="handleDemoLogin('admin')" :disabled="isLoading" class="demo-button admin">
            Login as Admin
          </button>
        </div>
        <p class="demo-note">
          These accounts will be created automatically if they don't exist.
        </p>
      </div>

      <!-- Real User Test Section -->
      <div class="test-accounts" v-if="isDevelopment">
        <p>Test with real accounts:</p>
        <div class="test-info">
          <p><strong>1. Register a new account</strong> using the form below</p>
          <p><strong>2. Or use test credentials:</strong></p>
          <div class="test-credentials">
            <code>Email: test@securedocs.com</code><br>
            <code>Password: TestPassword123</code>
          </div>
          <button @click="fillTestCredentials" class="test-fill-button">
            Fill Test Credentials
          </button>
        </div>
      </div>

      <div class="login-footer">
        <p>
          Don't have an account?
          <router-link to="/register">Sign up</router-link>
        </p>
        <p class="forgot-password">
          <a href="#" @click.prevent="handleForgotPassword">Forgot your password?</a>
        </p>
      </div>

      <!-- Connection Status -->
      <div class="connection-status" v-if="isDevelopment">
        <p :class="connectionStatus.class">
          {{ connectionStatus.message }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import type { LoginCredentials } from '@/types/auth'

const { login, mockLogin, loginError, isLoading } = useAuth()
const router = useRouter()
const route = useRoute()

const credentials = reactive<LoginCredentials>({
  email: '',
  password: '',
})

const connectionStatus = ref({
  class: 'status-checking',
  message: 'Checking server connection...'
})

const isDevelopment = computed(() => import.meta.env.DEV)
const enableMockLogin = computed(() => import.meta.env.VITE_ENABLE_MOCK_LOGIN === 'true')

const isFormValid = computed(() => {
  return credentials.email.trim() && credentials.password.trim() && credentials.email.includes('@')
})

async function handleSubmit() {
  if (!isFormValid.value) return

  const success = await login(credentials)

  if (success) {
    // Redirect to intended page or dashboard
    const redirectPath = (route.query.redirect as string) || '/dashboard'
    router.push(redirectPath)
  }
}

async function handleDemoLogin(role: 'admin' | 'user') {
  try {
    // First try to create the demo account if it doesn't exist
    const demoCredentials = {
      email: `${role}@securedocs.com`,
      password: 'DemoPassword123'
    }

    const success = await login(demoCredentials)

    if (success) {
      const redirectPath = (route.query.redirect as string) || '/dashboard'
      router.push(redirectPath)
    } else {
      // If login fails, the account might not exist
      // For demo purposes, we'll show a message
      alert(`Demo ${role} account not found. Please register first or use the test credentials.`)
    }
  } catch (error) {
    console.error('Demo login error:', error)
  }
}

function fillTestCredentials() {
  credentials.email = 'test@securedocs.com'
  credentials.password = 'TestPassword123'
}

function handleForgotPassword() {
  alert('Password reset functionality would be implemented here')
}

async function checkServerConnection() {
  try {
    const response = await fetch(import.meta.env.VITE_AUTH_API_URL + '/health')
    if (response.ok) {
      connectionStatus.value = {
        class: 'status-connected',
        message: '✅ Connected to authentication server'
      }
    } else {
      throw new Error('Server responded with error')
    }
  } catch (error) {
    connectionStatus.value = {
      class: 'status-disconnected',
      message: '❌ Cannot connect to authentication server'
    }
    console.error('Server connection check failed:', error)
  }
}

// Focus email input on mount
onMounted(async () => {
  const emailInput = document.getElementById('email')
  if (emailInput) {
    emailInput.focus()
  }

  // Check server connection in development
  if (isDevelopment.value) {
    await checkServerConnection()
  }
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  width: 100%;
  background: #eeaeca;
  background: radial-gradient(circle, rgba(238, 174, 202, 1) 0%, rgba(148, 187, 233, 1) 100%);
}

.login-container {
  background: #ffffff;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  max-width: 450px;
  width: 100%;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  color: #333;
  margin-bottom: 8px;
  font-size: 28px;
  font-weight: 600;
}

.login-header p {
  color: #666;
  margin: 0;
}

.login-form {
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.form-group input:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.form-error {
  background-color: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
}

.login-button {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 14px 20px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.login-button:hover:not(:disabled) {
  opacity: 0.9;
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.demo-login {
  border-top: 1px solid #eee;
  padding-top: 20px;
  margin-bottom: 20px;
}

.demo-login p {
  text-align: center;
  margin-bottom: 15px;
  font-size: 14px;
  color: #666;
}

.demo-note {
  font-size: 12px !important;
  color: #999 !important;
  font-style: italic;
  margin-top: 10px !important;
}

.demo-buttons {
  display: flex;
  gap: 10px;
}

.demo-button {
  flex: 1;
  padding: 10px 16px;
  border: 2px solid;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.demo-button.user {
  border-color: #28a745;
  color: #28a745;
  background: white;
}

.demo-button.user:hover:not(:disabled) {
  background: #28a745;
  color: white;
}

.demo-button.admin {
  border-color: #dc3545;
  color: #dc3545;
  background: white;
}

.demo-button.admin:hover:not(:disabled) {
  background: #dc3545;
  color: white;
}

.demo-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.test-accounts {
  border-top: 1px solid #eee;
  padding-top: 20px;
  margin-bottom: 20px;
}

.test-accounts p {
  text-align: center;
  margin-bottom: 15px;
  font-size: 14px;
  color: #666;
}

.test-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  font-size: 13px;
}

.test-credentials {
  background: #e9ecef;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
  font-family: 'Courier New', monospace;
}

.test-fill-button {
  background: #17a2b8;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.test-fill-button:hover {
  background: #138496;
}

.login-footer {
  text-align: center;
}

.login-footer p {
  color: #666;
  margin: 8px 0;
  font-size: 14px;
}

.login-footer a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.login-footer a:hover {
  text-decoration: underline;
}

.forgot-password {
  margin-top: 15px !important;
}

.connection-status {
  margin-top: 20px;
  text-align: center;
  font-size: 12px;
  padding: 8px;
  border-radius: 4px;
}

.status-checking {
  background: #fff3cd;
  color: #856404;
}

.status-connected {
  background: #d4edda;
  color: #155724;
}

.status-disconnected {
  background: #f8d7da;
  color: #721c24;
}
</style>
