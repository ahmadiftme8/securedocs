<template>
  <div class="login-container">
    <h1>Login</h1>
    <form @submit.prevent="handleSubmit" class="login-form">
      <div class="form-group">
        <label for="email">Email</label>
        <input
          id="email"
          v-model="credentials.email"
          type="email"
          placeholder="Enter your email"
          required
          :class="{ 'error-border': currentError && !credentials.email }"
        />
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input
          id="password"
          v-model="credentials.password"
          type="password"
          placeholder="Enter your password"
          required
          :class="{ 'error-border': currentError && !credentials.password }"
        />
      </div>
      <button type="submit" :disabled="isLoading || !isFormValid" class="login-button">
        <span v-if="isLoading" class="spinner"></span>
        <span v-else>Login</span>
      </button>
      <p v-if="currentError" class="error-message">{{ currentError }}</p>
      <p v-if="showSignupSuggestion" class="suggestion">
        Don't have an account? <router-link to="/register">Sign up</router-link>
      </p>
      <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
    </form>
    <div v-if="isDevelopment && enableMockLogin" class="demo-login">
      <button @click="handleDemoLogin('admin')" class="demo-button">Demo Admin Login</button>
      <button @click="handleDemoLogin('user')" class="demo-button">Demo User Login</button>
    </div>
    <p class="forgot-password" @click="handleForgotPassword">Forgot Password?</p>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import type { LoginCredentials } from '@/types/auth'

const { login, mockLogin, error: loginError, isLoading } = useAuth()
const router = useRouter()
const route = useRoute()

const credentials = reactive<LoginCredentials>({
  email: '',
  password: '',
})

const successMessage = ref('')

// Computed properties
const isDevelopment = computed(() => import.meta.env.DEV)
const enableMockLogin = computed(() => import.meta.env.VITE_ENABLE_MOCK_LOGIN === 'true')
const envMode = computed(() => import.meta.env.MODE)

const isFormValid = computed(() => {
  return credentials.email.trim() && credentials.password.trim() && credentials.email.includes('@')
})

const currentError = computed(() => loginError.value)

const showSignupSuggestion = computed(() => {
  return currentError.value && currentError.value.includes('Invalid login credentials')
})

watch([() => credentials.email, () => credentials.password], () => {
  if (currentError.value) {
    setTimeout(() => {
      loginError.value = null
    }, 2000)
  }
})

async function handleSubmit() {
  if (!isFormValid.value) return
  console.log('🔐 Attempting login for:', credentials.email)
  console.log('🌍 Environment:', envMode.value)
  successMessage.value = ''
  try {
    const success = await login(credentials)
    if (success) {
      successMessage.value = 'Login successful! Redirecting...'
      console.log('✅ Login successful, redirecting...')
      setTimeout(() => {
        const redirectPath = (route.query.redirect as string) || '/dashboard'
        router.push(redirectPath)
      }, 500)
    }
  } catch (error) {
    console.error('❌ Login error:', error)
  }
}

async function handleDemoLogin(role: 'admin' | 'user') {
  try {
    const success = await mockLogin(role)
    if (success) {
      console.log(`✅ Demo login as ${role} successful`)
      const redirectPath = (route.query.redirect as string) || '/dashboard'
      router.push(redirectPath)
    }
  } catch (error) {
    console.error('❌ Demo login error:', error)
    loginError.value = 'Demo login failed. Please try again.'
  }
}

function clearError() {
  loginError.value = null
  successMessage.value = ''
  console.log('🧹 Error cleared')
}

function testError() {
  loginError.value = 'Test error message - Invalid login credentials'
  console.log('🧪 Test error set:', loginError.value)
}

function handleForgotPassword() {
  alert('Password reset functionality would be implemented with Supabase Auth')
}

onMounted(() => {
  const emailInput = document.getElementById('email')
  if (emailInput) {
    emailInput.focus()
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
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.form-group input.error-input {
  border-color: #dc3545;
  background-color: #fdf2f2;
}

.form-group input:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

/* Enhanced Error Styling */
.form-error {
  background: linear-gradient(135deg, #fee 0%, #fdd 100%);
  border: 1px solid #faa;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  animation: shake 0.5s ease-in-out;
}

.error-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.error-content {
  flex: 1;
}

.error-title {
  font-weight: 600;
  color: #c33;
  font-size: 14px;
  margin-bottom: 4px;
}

.error-message {
  color: #c33;
  font-size: 14px;
  margin-bottom: 8px;
  line-height: 1.4;
}

.error-suggestion {
  color: #856404;
  font-size: 13px;
  background: #fff3cd;
  padding: 8px 12px;
  border-radius: 6px;
  margin-top: 8px;
}

.error-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.error-link:hover {
  text-decoration: underline;
}

/* Success Message */
.form-success {
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  border: 1px solid #9ac49a;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: slideDown 0.3s ease;
}

.success-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.success-message {
  color: #155724;
  font-size: 14px;
  font-weight: 500;
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
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  position: relative;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}

.login-button:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 3s linear infinite;
}

/* Minimalistic Loading Spinner */
.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #ccc;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
  vertical-align: middle;
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

.test-fill-button {
  background: #17a2b8;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 10px;
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

.signup-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.signup-link:hover {
  background: #f0f8ff;
  text-decoration: underline;
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

/* Animations */
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

@keyframes slideDown {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive */
@media (max-width: 480px) {
  .login-container {
    padding: 24px;
    margin: 10px;
  }

  .login-header h1 {
    font-size: 24px;
  }
}
</style>
