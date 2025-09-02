<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h1 class="welcome-text">Welcome Back To</h1>
        <h2 class="brand-name">Fylor</h2>
        <p class="subtitle">Sign In To Your Account</p>
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
/* Import Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Jersey+10&family=Poppins:wght@300;400;500;600;700&family=Kalam:wght@300;400;700&display=swap');

.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #F4E6CF; /* Champagne background */
  font-family: 'Poppins', sans-serif;
}

.login-container {

  border-radius: 24px;
  padding: 60px 50px;

  max-width: 480px;
  width: 100%;
  animation: slideUp 0.6s ease-out;


}

.login-header {
  text-align: center;
  margin-bottom: 50px;
}

.welcome-text {
  font-family: 'Poppins', sans-serif;
  color: #5E777A; /* Myrtle Green */
  margin-bottom: 10px;
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: 0.5px;
}

.brand-name {
  font-family: 'Jersey 10', cursive;
  color: #96362D; /* Auburn */
  margin-bottom: 20px;
  font-size: 8rem;
  font-weight: 400;

  line-height: 0.8;
}

.subtitle {
  font-family: 'Poppins', sans-serif;
  color: #5E777A; /* Myrtle Green */
  margin: 0;
  font-size: 16px;
  font-weight: 400;
  letter-spacing: 0.3px;
}

.form-error {
  background: linear-gradient(135deg, rgba(252, 62, 41, 0.1) 0%, rgba(252, 62, 41, 0.05) 100%);
  border: 1px solid rgba(252, 62, 41, 0.3);
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 25px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  animation: shake 0.5s ease-in-out;
}

.error-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 1px;
}

.error-content {
  flex: 1;
}

.error-title {
  font-weight: 600;
  color: #96362D; /* Tomato */
  font-size: 15px;
  margin-bottom: 6px;
  font-family: 'Poppins', sans-serif;
}

.error-message {
  color: #96362D; /* Tomato */
  font-size: 14px;
  margin-bottom: 10px;
  line-height: 1.5;
  font-family: 'Poppins', sans-serif;
}

.error-suggestion {
  background: rgba(246, 244, 205, 0.8);
  color: #5E777A;
  font-size: 13px;
  padding: 10px 14px;
  border-radius: 8px;
  margin-top: 10px;
  font-family: 'Poppins', sans-serif;
}

.error-link {
  color: #96362D; /* Auburn */
  text-decoration: none;
  font-weight: 600;
}

.error-link:hover {
  text-decoration: underline;
}

.form-success {
  background: linear-gradient(135deg, rgba(91, 120, 124, 0.1) 0%, rgba(91, 120, 124, 0.05) 100%);
  border: 1px solid rgba(91, 120, 124, 0.3);
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 25px;
  display: flex;
  align-items: center;
  gap: 14px;
  animation: slideDown 0.4s ease;
}

.success-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.success-message {
  color: #5E777A; /* Myrtle Green */
  font-size: 15px;
  font-weight: 500;
  font-family: 'Poppins', sans-serif;
}

.login-form {
  margin-bottom: 40px;
}

.form-group {
  margin-bottom: 25px;
}

.form-group label {
  display: block;
  margin-bottom: 10px;
  font-weight: 500;
  color: #5E777A; /* Myrtle Green */
  font-size: 15px;
  font-family: 'Poppins', sans-serif;
  letter-spacing: 0.3px;
}

.form-group input {
  width: 100%;
  padding: 18px 24px;
  border: 2px solid rgba(91, 120, 124, 0.2);
  border-radius: 50px;
  font-size: 16px;
  font-family: 'Poppins', sans-serif;
  transition: all 0.3s ease;
  box-sizing: border-box;
  background: #d9d2c0;
  color: #5E777A;
}

.form-group input::placeholder {
  color: rgba(91, 120, 124, 0.6);
  font-family: 'Poppins', sans-serif;
}

.form-group input:focus {
  outline: none;
  border-color: #5E777A; /* Myrtle Green */
  background: #d9d2c0;
  box-shadow: 0 0 0 4px rgba(91, 120, 124, 0.1);
  transform: translateY(-2px);
}

.form-group input.error-input {
  border-color: #96362D; /* Tomato */
  background-color: rgba(252, 62, 41, 0.05);
}

.form-group input:disabled {
  background-color: rgba(246, 244, 205, 0.5);
  cursor: not-allowed;
  opacity: 0.7;
}

.login-button {
  width: 100%;
  background: linear-gradient(135deg, #5E777A 0%, #101622 100%); /* Myrtle to Rich Black */
  color: white;
  border: none;
  padding: 18px 24px;
  border-radius: 50px;
  font-size: 18px;
  font-weight: 600;
  font-family: 'Poppins', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 56px;
  letter-spacing: 0.5px;
  box-shadow: 0 8px 20px rgba(91, 120, 124, 0.3);
}

.login-button:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(91, 120, 124, 0.4);
  background: linear-gradient(135deg, #101622 0%, #5E777A 100%);
}

.login-button:active:not(:disabled) {
  transform: translateY(-1px);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 4px 12px rgba(91, 120, 124, 0.2);
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.demo-login {
  border-top: 1px solid rgba(91, 120, 124, 0.2);
  padding-top: 30px;
  margin-bottom: 30px;
}

.demo-login p {
  text-align: center;
  margin-bottom: 20px;
  font-size: 15px;
  color: #5E777A; /* Myrtle Green */
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
}

.demo-buttons {
  display: flex;
  gap: 15px;
}

.demo-button {
  flex: 1;
  padding: 12px 20px;
  border: 2px solid;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Poppins', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
  letter-spacing: 0.3px;
}

.demo-button.admin {
  border-color: #96362D; /* Auburn */
  color: #96362D;
}

.demo-button.admin:hover:not(:disabled) {
  background: #96362D;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(162, 43, 37, 0.3);
}

.demo-button.user {
  border-color: #96362D; /* Tomato */
  color: #96362D;
}

.demo-button.user:hover:not(:disabled) {
  background: #96362D;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(252, 62, 41, 0.3);
}

.demo-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.demo-note {
  font-size: 12px;
  color: rgba(91, 120, 124, 0.7);
  font-style: italic;
  text-align: center;
  margin-top: 15px;
  font-family: 'Kalam', cursive;
  font-weight: 300;
}

.login-footer {
  text-align: center;
  border-top: 1px solid rgba(91, 120, 124, 0.15);
  padding-top: 25px;
}

.login-footer p {
  color: #5E777A; /* Myrtle Green */
  margin: 12px 0;
  font-size: 15px;
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
}

.forgot-password a {
  color: #96362D; /* Auburn */
  text-decoration: none;
  font-weight: 600;
  font-family: 'Poppins', sans-serif;
  transition: all 0.3s ease;
  padding: 4px 8px;
  border-radius: 8px;
}

.forgot-password a:hover {
  background: rgba(162, 43, 37, 0.1);
  text-decoration: underline;
}

.signup-link {
  color: #96362D; /* Tomato */
  text-decoration: none;
  font-weight: 600;
  font-family: 'Poppins', sans-serif;
  padding: 4px 8px;
  border-radius: 8px;
  transition: all 0.3s ease;
  letter-spacing: 0.3px;
}

.signup-link:hover {
  background: rgba(252, 62, 41, 0.1);
  text-decoration: underline;
  transform: translateY(-1px);
}

/* Animations */
@keyframes slideUp {
  from {
    transform: translateY(40px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideDown {
  from {
    transform: translateY(-15px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 580px) {
  .login-page {
    padding: 15px;
  }

  .login-container {
    padding: 40px 30px;
    border-radius: 20px;
  }

  .brand-name {
    font-size: 56px;
  }

  .welcome-text {
    font-size: 20px;
  }

  .subtitle {
    font-size: 16px;
  }

  .demo-buttons {
    flex-direction: column;
    gap: 12px;
  }

  .form-group input {
    padding: 16px 20px;
    font-size: 15px;
  }

  .login-button {
    padding: 16px 20px;
    font-size: 16px;
  }
}

@media (max-width: 400px) {
  .login-container {
    padding: 30px 20px;
  }

  .brand-name {
    font-size: 48px;
  }
}
</style>
