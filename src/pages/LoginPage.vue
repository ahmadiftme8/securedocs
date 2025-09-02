<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h1>Welcome Back</h1>
        <p>Sign in to your account</p>
      </div>

      <!-- Error Message -->
      <div v-if="currentError" class="form-error">
        <span class="error-icon">⚠️</span>
        <div class="error-content">
          <div class="error-title">Login Failed</div>
          <div class="error-message">{{ currentError }}</div>
          <div v-if="showSignupSuggestion" class="error-suggestion">
            Don't have an account? <router-link to="/register" class="error-link">Create one here</router-link>
          </div>
        </div>
      </div>

      <!-- Success Message -->
      <div v-if="successMessage" class="form-success">
        <span class="success-icon">✅</span>
        <div class="success-message">{{ successMessage }}</div>
      </div>

      <form @submit.prevent="handleSubmit" class="login-form">
        <div class="form-group">
          <label for="email">Email Address</label>
          <input
            id="email"
            v-model="credentials.email"
            type="email"
            placeholder="Enter your email"
            required
            :disabled="isLoading"
            :class="{ 'error-input': currentError && !credentials.email }"
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
            :disabled="isLoading"
            :class="{ 'error-input': currentError && !credentials.password }"
          />
        </div>

        <button type="submit" :disabled="isLoading || !isFormValid" class="login-button">
          <span v-if="isLoading" class="loading-spinner"></span>
          <span v-else>Sign In</span>
        </button>
      </form>

      <!-- Demo Login (Development Only) -->
      <div v-if="isDevelopment && enableMockLogin" class="demo-login">
        <p>Development Demo Accounts:</p>
        <div class="demo-buttons">
          <button @click="handleDemoLogin('admin')" :disabled="isLoading" class="demo-button admin">
            Demo Admin
          </button>
          <button @click="handleDemoLogin('user')" :disabled="isLoading" class="demo-button user">
            Demo User
          </button>
        </div>
        <p class="demo-note">These accounts are for development testing only.</p>
      </div>

      <div class="login-footer">
        <p class="forgot-password">
          <a href="#" @click.prevent="handleForgotPassword">Forgot your password?</a>
        </p>
        <p>
          Don't have an account?
          <router-link to="/register" class="signup-link">Sign up</router-link>
        </p>
      </div>
    </div>
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
  return credentials.email.trim() &&
         credentials.password.trim() &&
         credentials.email.includes('@') &&
         credentials.email.length > 3
})

const currentError = computed(() => loginError.value)

const showSignupSuggestion = computed(() => {
  return currentError.value &&
         (currentError.value.includes('Invalid login credentials') ||
          currentError.value.includes('Email not confirmed'))
})

// Clear error when user types
watch([() => credentials.email, () => credentials.password], () => {
  if (currentError.value) {
    successMessage.value = ''
    // Clear error after a delay to avoid jarring UX
    setTimeout(() => {
      if (loginError.value) {
        loginError.value = null
      }
    }, 2000)
  }
})

async function handleSubmit() {
  if (!isFormValid.value || isLoading.value) return

  console.log('🔐 Attempting login for:', credentials.email)
  console.log('🌍 Environment:', envMode.value)

  successMessage.value = ''

  try {
    const success = await login(credentials)

    if (success) {
      successMessage.value = 'Login successful! Redirecting...'
      console.log('✅ Login successful, redirecting...')

      // Small delay for UX
      setTimeout(() => {
        const redirectPath = (route.query.redirect as string) || '/dashboard'
        router.push(redirectPath)
      }, 1000)
    }
  } catch (error) {
    console.error('❌ Login error:', error)
  }
}

async function handleDemoLogin(role: 'admin' | 'user') {
  if (isLoading.value) return

  try {
    console.log(`🎭 Demo login as ${role}`)
    const success = await mockLogin(role)

    if (success) {
      console.log(`✅ Demo login as ${role} successful`)
      const redirectPath = (route.query.redirect as string) || '/dashboard'
      router.push(redirectPath)
    }
  } catch (error) {
    console.error('❌ Demo login error:', error)
  }
}

function handleForgotPassword() {
  // TODO: Implement password reset with Supabase
  alert('Password reset functionality will be implemented with Supabase Auth')
}

onMounted(() => {
  // Focus email input on mount
  const emailInput = document.getElementById('email')
  if (emailInput) {
    emailInput.focus()
  }

  // Check for URL hash errors (email confirmation)
  const hash = window.location.hash
  if (hash.includes('error=access_denied')) {
    console.warn('⚠️ Email confirmation error detected in URL')
    loginError.value = 'Email confirmation link has expired. Please request a new one.'
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-container {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  max-width: 450px;
  width: 100%;
  animation: slideUp 0.5s ease-out;
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
  font-size: 16px;
}

.form-error {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  animation: shake 0.5s ease-in-out;
}

.error-icon {
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 1px;
}

.error-content {
  flex: 1;
}

.error-title {
  font-weight: 600;
  color: #dc2626;
  font-size: 14px;
  margin-bottom: 4px;
}

.error-message {
  color: #dc2626;
  font-size: 14px;
  margin-bottom: 8px;
  line-height: 1.4;
}

.error-suggestion {
  background: #fff3cd;
  color: #856404;
  font-size: 13px;
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

.form-success {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border: 1px solid #a7f3d0;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: slideDown 0.3s ease;
}

.success-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.success-message {
  color: #065f46;
  font-size: 14px;
  font-weight: 500;
}

.login-form {
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.2s ease;
  box-sizing: border-box;
  background: white;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input.error-input {
  border-color: #dc2626;
  background-color: #fef2f2;
}

.form-group input:disabled {
  background-color: #f9fafb;
  cursor: not-allowed;
  opacity: 0.7;
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
  min-height: 48px;
}

.login-button:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.demo-login {
  border-top: 1px solid #e5e7eb;
  padding-top: 20px;
  margin-bottom: 20px;
}

.demo-login p {
  text-align: center;
  margin-bottom: 15px;
  font-size: 14px;
  color: #6b7280;
}

.demo-buttons {
  display: flex;
  gap: 12px;
}

.demo-button {
  flex: 1;
  padding: 10px 16px;
  border: 2px solid;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.demo-button.admin {
  border-color: #dc2626;
  color: #dc2626;
}

.demo-button.admin:hover:not(:disabled) {
  background: #dc2626;
  color: white;
}

.demo-button.user {
  border-color: #059669;
  color: #059669;
}

.demo-button.user:hover:not(:disabled) {
  background: #059669;
  color: white;
}

.demo-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.demo-note {
  font-size: 12px;
  color: #9ca3af;
  font-style: italic;
  text-align: center;
  margin-top: 10px;
}

.login-footer {
  text-align: center;
  border-top: 1px solid #e5e7eb;
  padding-top: 20px;
}

.login-footer p {
  color: #6b7280;
  margin: 8px 0;
  font-size: 14px;
}

.forgot-password a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.forgot-password a:hover {
  text-decoration: underline;
}

.signup-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  padding: 2px 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.signup-link:hover {
  background: rgba(102, 126, 234, 0.1);
  text-decoration: underline;
}

/* Animations */
@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
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

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 480px) {
  .login-page {
    padding: 15px;
  }

  .login-container {
    padding: 30px 24px;
  }

  .login-header h1 {
    font-size: 24px;
  }

  .demo-buttons {
    flex-direction: column;
  }
}
</style>
