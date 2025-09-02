<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-header">
        <h1>Create Account</h1>
        <p>Join SecureDocs to start managing your files securely</p>
      </div>

      <form @submit.prevent="handleRegister" class="register-form" novalidate>
        <!-- Name Field -->
        <div class="form-group">
          <label for="name" class="form-label">Full Name</label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            class="form-input"
            :class="{ error: errors.name }"
            placeholder="Enter your full name"
            required
            autocomplete="name"
          />
          <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
        </div>

        <!-- Email Field -->
        <div class="form-group">
          <label for="email" class="form-label">Email Address</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            class="form-input"
            :class="{ error: errors.email }"
            placeholder="Enter your email address"
            required
            autocomplete="email"
          />
          <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
        </div>

        <!-- Password Field -->
        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <div class="password-input-container">
            <input
              id="password"
              v-model="formData.password"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              :class="{ error: errors.password }"
              placeholder="Create a strong password"
              required
              autocomplete="new-password"
            />
            <button
              type="button"
              class="password-toggle"
              @click="showPassword = !showPassword"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
            >
              {{ showPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
          <span v-if="errors.password" class="error-message">{{ errors.password }}</span>

          <!-- Password Strength Indicator -->
          <div v-if="formData.password" class="password-strength">
            <div class="strength-bar">
              <div
                class="strength-fill"
                :class="passwordStrength.class"
                :style="{ width: passwordStrength.percentage + '%' }"
              ></div>
            </div>
            <span class="strength-text" :class="passwordStrength.class">
              {{ passwordStrength.text }}
            </span>
          </div>
        </div>

        <!-- Confirm Password Field -->
        <div class="form-group">
          <label for="confirmPassword" class="form-label">Confirm Password</label>
          <input
            id="confirmPassword"
            v-model="formData.confirmPassword"
            type="password"
            class="form-input"
            :class="{ error: errors.confirmPassword }"
            placeholder="Confirm your password"
            required
            autocomplete="new-password"
          />
          <span v-if="errors.confirmPassword" class="error-message">{{
            errors.confirmPassword
          }}</span>
        </div>

        <!-- Role Selection -->
        <div class="form-group">
          <label for="role" class="form-label">Account Type</label>
          <select
            id="role"
            v-model="formData.role"
            class="form-select"
            :class="{ error: errors.role }"
            required
          >
            <option value="">Select account type</option>
            <option value="user">Standard User</option>
            <option value="admin">Administrator</option>
          </select>
          <span v-if="errors.role" class="error-message">{{ errors.role }}</span>
          <p class="role-description">
            {{ getRoleDescription(formData.role) }}
          </p>
        </div>

        <!-- Terms and Conditions -->
        <div class="form-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="formData.agreeToTerms"
              class="checkbox-input"
              :class="{ error: errors.agreeToTerms }"
              required
            />
            <span class="checkbox-custom"></span>
            I agree to the <a href="/terms" target="_blank" class="link">Terms of Service</a> and
            <a href="/privacy" target="_blank" class="link">Privacy Policy</a>
          </label>
          <span v-if="errors.agreeToTerms" class="error-message">{{ errors.agreeToTerms }}</span>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="isLoading || !isFormValid"
          class="register-button submit-button"
        >
          <span v-if="isLoading" class="spinner"></span>
          <span v-else>Sign Up</span>
        </button>

        <!-- Error Display -->
        <div v-if="generalError" class="general-error">
          <span>{{ generalError }}</span>
        </div>

        <!-- Success Message -->
        <div v-if="successMessage" class="success-message">
          <span>{{ successMessage }}</span>
        </div>
      </form>

      <!-- Login Link -->
      <div class="login-link">
        <p>
          Already have an account?
          <router-link to="/login" class="link">Sign in here</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'
import type { RegisterCredentials } from '@/types/auth'

const { registerUser, isLoading, error: registerError } = useAuth()
const router = useRouter()

// Form data
const formData = reactive<
  RegisterCredentials & {
    confirmPassword: string
    agreeToTerms: boolean
  }
>({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: '',
  agreeToTerms: false,
})

// UI state
const showPassword = ref(false)
const errors = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: '',
  agreeToTerms: '',
})
const generalError = ref('')
const successMessage = ref('')

// Password strength calculation (unchanged)
const passwordStrength = computed(() => {
  const password = formData.password
  if (!password) return { percentage: 0, text: '', class: '' }

  let score = 0
  const feedback = []

  if (password.length >= 8) score += 25
  else feedback.push('at least 8 characters')

  if (/[A-Z]/.test(password)) score += 25
  else feedback.push('uppercase letter')

  if (/[a-z]/.test(password)) score += 25
  else feedback.push('lowercase letter')

  if (/[0-9]/.test(password) || /[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 25
  else feedback.push('number or special character')

  let text = ''
  let className = ''

  if (score === 100) {
    text = 'Strong password'
    className = 'strong'
  } else if (score >= 75) {
    text = 'Good password'
    className = 'good'
  } else if (score >= 50) {
    text = 'Fair password'
    className = 'fair'
  } else {
    text = `Weak - needs ${feedback.join(', ')}`
    className = 'weak'
  }

  return { percentage: score, text, class: className }
})

// Form validation (unchanged)
const isFormValid = computed(() => {
  return (
    formData.name.trim() &&
    formData.email.trim() &&
    formData.password &&
    formData.confirmPassword &&
    formData.role &&
    formData.agreeToTerms &&
    !Object.values(errors).some((error) => error !== '')
  )
})

function validateName() {
  if (!formData.name.trim()) {
    errors.name = 'Name is required'
  } else if (formData.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters'
  } else {
    errors.name = ''
  }
}

function validateEmail() {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!formData.email.trim()) {
    errors.email = 'Email is required'
  } else if (!emailRegex.test(formData.email)) {
    errors.email = 'Please enter a valid email address'
  } else {
    errors.email = ''
  }
}

function validatePassword() {
  if (!formData.password) {
    errors.password = 'Password is required'
  } else if (formData.password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(formData.password)) {
    errors.password = 'Password must contain uppercase, lowercase, and number'
  } else {
    errors.password = ''
  }
}

function validateConfirmPassword() {
  if (!formData.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password'
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  } else {
    errors.confirmPassword = ''
  }
}

function validateRole() {
  if (!formData.role) {
    errors.role = 'Please select an account type'
  } else {
    errors.role = ''
  }
}

function validateTerms() {
  if (!formData.agreeToTerms) {
    errors.agreeToTerms = 'You must agree to the terms and conditions'
  } else {
    errors.agreeToTerms = ''
  }
}

function getRoleDescription(role: string): string {
  switch (role) {
    case 'user':
      return 'Access to file management and personal dashboard'
    case 'admin':
      return 'Full access including user management and system settings'
    default:
      return 'Please select an account type to see description'
  }
}

// Watch for form changes (unchanged)
watch(() => formData.name, validateName)
watch(() => formData.email, validateEmail)
watch(
  () => formData.password,
  () => {
    validatePassword()
    if (formData.confirmPassword) validateConfirmPassword()
  },
)
watch(() => formData.confirmPassword, validateConfirmPassword)
watch(() => formData.role, validateRole)
watch(() => formData.agreeToTerms, validateTerms)

// Form submission
async function handleRegister() {
  generalError.value = ''
  successMessage.value = ''

  validateName()
  validateEmail()
  validatePassword()
  validateConfirmPassword()
  validateRole()
  validateTerms()

  if (!isFormValid.value) {
    generalError.value = 'Please fix the errors above'
    return
  }

  try {
    const success = await registerUser({
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      role: formData.role as 'admin' | 'user',
    })

    if (success) {
      successMessage.value = 'Account created successfully! Redirecting to dashboard...'
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } else {
      generalError.value = registerError.value || 'Registration failed. Please try again.'
    }
  } catch (error) {
    console.error('Registration error:', error)
    generalError.value = registerError.value || 'Registration failed. Please try again.'
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 500px;
}

.register-header {
  text-align: center;
  margin-bottom: 32px;
}

.register-header h1 {
  color: #2d3748;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

.register-header p {
  color: #718096;
  font-size: 16px;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  color: #2d3748;
  font-weight: 600;
  margin-bottom: 6px;
  font-size: 14px;
}

.form-input,
.form-select {
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.2s ease;
  background: white;
  color: #2d3748;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input.error,
.form-select.error {
  border-color: #e53e3e;
}

.password-input-container {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.password-toggle:hover {
  opacity: 1;
}

.password-strength {
  margin-top: 8px;
}

.strength-bar {
  width: 100%;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s ease;
}

.strength-fill.weak {
  background: #e53e3e;
}
.strength-fill.fair {
  background: #f6ad55;
}
.strength-fill.good {
  background: #68d391;
}
.strength-fill.strong {
  background: #38a169;
}

.strength-text {
  font-size: 12px;
  margin-top: 4px;
  display: block;
}

.strength-text.weak {
  color: #e53e3e;
}
.strength-text.fair {
  color: #d69e2e;
}
.strength-text.good {
  color: #38a169;
}
.strength-text.strong {
  color: #2f855a;
}

.role-description {
  font-size: 12px;
  color: #718096;
  margin-top: 4px;
  font-style: italic;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1.5;
}

.checkbox-input {
  position: absolute;
  opacity: 0;
}

.checkbox-custom {
  width: 18px;
  height: 18px;
  border: 2px solid #e2e8f0;
  border-radius: 4px;
  flex-shrink: 0;
  margin-top: 2px;
  transition: all 0.2s ease;
  position: relative;
}

.checkbox-input:checked + .checkbox-custom {
  background: #667eea;
  border-color: #667eea;
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.submit-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 14px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
}

.register-button {
  /* ... existing styles ... */
  position: relative;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}

/* Minimalistic Loading Spinner */
.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #ccc;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 2s linear infinite;
  margin-right: 8px;
  vertical-align: middle;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-message {
  color: #e53e3e;
  font-size: 12px;
  margin-top: 4px;
}

.general-error {
  background: #fed7d7;
  color: #c53030;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
}

.success-message {
  background: #c6f6d5;
  color: #2f855a;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
}

.login-link {
  text-align: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}

.login-link p {
  color: #718096;
  margin: 0;
}

.link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.link:hover {
  text-decoration: underline;
}

/* Responsive design */
@media (max-width: 640px) {
  .register-container {
    padding: 24px;
    margin: 10px;
  }

  .register-header h1 {
    font-size: 24px;
  }
}
</style>
