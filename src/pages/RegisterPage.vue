<template>
  <div class="register-page">
    <!-- Left Side - Brand -->
    <div class="brand-section">
      <div class="brand-content">
        <h1 class="brand-name">Fylor</h1>
        <h2 class="brand-subtitle">Join Us</h2>
        <p class="brand-description">to start managing and sharing your files securely</p>
        <div class="brand-footer">
          <a href="/about" class="footer-link">About Us</a>
          <span class="separator">|</span>
          <a href="/contact" class="footer-link">Contact</a>
        </div>
      </div>
    </div>

    <!-- Right Side - Form -->
    <div class="form-section">
      <div class="form-container">
        <!-- Error Message -->
        <div v-if="generalError" class="form-error">
          <span class="error-icon">⚠️</span>
          <div class="error-content">
            <div class="error-title">Registration Failed</div>
            <div class="error-message">{{ generalError }}</div>
          </div>
        </div>

        <!-- Success Message -->
        <div v-if="successMessage" class="form-success">
          <span class="success-icon">✅</span>
          <div class="success-message">{{ successMessage }}</div>
        </div>

        <form @submit.prevent="handleRegister" class="register-form">
          <!-- Full Name -->
          <div class="form-group">
            <label for="name">Full Name</label>
            <input
              id="name"
              v-model="formData.name"
              type="text"
              placeholder="Enter Your Full Name"
              required
              :disabled="isLoading"
              :class="{ 'error-input': errors.name }"
              @blur="validateName"
            />
            <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
          </div>

          <!-- Email Address -->
          <div class="form-group">
            <label for="email">Email Address</label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              placeholder="Enter Your Email Address"
              required
              :disabled="isLoading"
              :class="{ 'error-input': errors.email }"
              @blur="validateEmail"
            />
            <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
          </div>

          <!-- Password -->
          <div class="form-group">
            <label for="password">Password</label>
            <div class="password-container">
              <input
                id="password"
                v-model="formData.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Create A Strong Password"
                required
                :disabled="isLoading"
                :class="{ 'error-input': errors.password }"
                @blur="validatePassword"
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
            <span v-if="errors.password" class="field-error">{{ errors.password }}</span>

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

          <!-- Confirm Password -->
          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              v-model="formData.confirmPassword"
              type="password"
              placeholder="Confirm Your Password"
              required
              :disabled="isLoading"
              :class="{ 'error-input': errors.confirmPassword }"
              @blur="validateConfirmPassword"
            />
            <span v-if="errors.confirmPassword" class="field-error">{{ errors.confirmPassword }}</span>
          </div>

          <!-- Account Type -->
          <div class="form-group">
            <label for="role">Account Type</label>
            <select
              id="role"
              v-model="formData.role"
              required
              :disabled="isLoading"
              :class="{ 'error-input': errors.role }"
              @change="validateRole"
            >
              <option value="">Select Account Type</option>
              <option value="user">Standard User</option>
              <option value="admin">Administrator</option>
            </select>
            <span v-if="errors.role" class="field-error">{{ errors.role }}</span>
            <p class="role-description">{{ getRoleDescription(formData.role) }}</p>
          </div>

          <!-- Terms Agreement -->
          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="formData.agreeToTerms"
                class="checkbox-input"
                :class="{ error: errors.agreeToTerms }"
                required
                @change="validateTerms"
              />
              <span class="checkbox-custom"></span>
              <span class="checkbox-text">
                I agree to the <a href="/terms" target="_blank" class="link">Terms of Service</a> and
                <a href="/privacy" target="_blank" class="link">Privacy Policy</a>
              </span>
            </label>
            <span v-if="errors.agreeToTerms" class="field-error">{{ errors.agreeToTerms }}</span>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isLoading || !isFormValid"
            class="register-button"
          >
            <span v-if="isLoading" class="loading-spinner"></span>
            <span v-else>Sign Up</span>
          </button>
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

// Password strength calculation
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

// Form validation
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

// Watch for form changes
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
      successMessage.value = 'Account created successfully! Please check your email for confirmation.'
      // Don't redirect immediately - let user confirm email first
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
/* Import Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Jersey+10&family=Poppins:wght@300;400;500;600;700&family=Kalam:wght@300;400;700&display=swap');

.register-page {
  min-height: 100vh;
  display: flex;
  font-family: 'Poppins', sans-serif;
  background: #F4E6CF; /* Champagne background */
}

/* Left Side - Brand Section */
.brand-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: #F4E6CF;
}

.brand-content {
  text-align: left;
  max-width: 600px;
}

.brand-name {
  font-family: 'Jersey 10', cursive;
  color: #A22B25; /* Auburn */
  font-size: 8rem;
  font-weight: 400;
  line-height: 0.8;
  margin-bottom: 0.1rem;
}

.brand-subtitle {
  font-family: 'Poppins', sans-serif;
  color: #5B787C; /* Myrtle Green */
  font-size: 2.5rem;
  font-weight: 600;
  margin-bottom: 15px;
  letter-spacing: 0.5px;
}

.brand-description {
  font-family: 'Poppins', sans-serif;
  color: #5B787C; /* Myrtle Green */
  font-size: 1.1rem;
  font-weight: 400;
  line-height: 1.5;
  margin-bottom: 60px;
  letter-spacing: 0.3px;
}

.brand-footer {
  display: flex;
  align-items: center;
  gap: 15px;
}

.footer-link {
  font-family: 'Poppins', sans-serif;
  color: #5B787C; /* Myrtle Green */
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.footer-link:hover {
  color: #A22B25; /* Auburn */
  text-decoration: underline;
}

.separator {
  color: #5B787C;
  font-weight: 300;
}

/* Right Side - Form Section */
.form-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: #F4E6CF;
}

.form-container {
  width: 100%;
  max-width: 400px;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 30px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-family: 'Poppins', sans-serif;
  color: #5B787C; /* Myrtle Green */
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 8px;
  letter-spacing: 0.3px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 24px;
  border: 2px solid rgba(91, 120, 124, 0.2);
  border-radius: 50px;
  font-size: 16px;
  font-family: 'Poppins', sans-serif;
  transition: all 0.3s ease;
  box-sizing: border-box;
  background: #d9d2c0 !important; /* Force the background color */
  color: #5B787C;
}

.form-group input::placeholder {
  color: rgba(91, 120, 124, 0.6);
  font-family: 'Poppins', sans-serif;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #5B787C; /* Myrtle Green */
  background: #d9d2c0 !important;
  box-shadow: 0 0 0 4px rgba(91, 120, 124, 0.1);
  transform: translateY(-2px);
}

.form-group input.error-input,
.form-group select.error-input {
  border-color: #A22B25; /* Auburn */
  background-color: rgba(162, 43, 37, 0.05) !important;
}

.form-group input:disabled,
.form-group select:disabled {
  background-color: rgba(217, 210, 192, 0.5) !important;
  cursor: not-allowed;
  opacity: 0.7;
}

/* Password Container */
.password-container {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: rgba(91, 120, 124, 0.6);
  transition: all 0.2s ease;
  padding: 4px;
}

.password-toggle:hover {
  color: #5B787C;
}

/* Password Strength */
.password-strength {
  margin-top: 10px;
}

.strength-bar {
  width: 100%;
  height: 4px;
  background: rgba(91, 120, 124, 0.2);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 6px;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s ease;
}

.strength-fill.weak { background: #A22B25; }
.strength-fill.fair { background: #FC3E29; }
.strength-fill.good { background: #5B787C; }
.strength-fill.strong { background: #101622; }

.strength-text {
  font-size: 12px;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
}

.strength-text.weak { color: #A22B25; }
.strength-text.fair { color: #FC3E29; }
.strength-text.good { color: #5B787C; }
.strength-text.strong { color: #101622; }

/* Select Dropdown */
select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%235B787C' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 20px center;
  background-repeat: no-repeat;
  background-size: 16px;
  padding-right: 50px;
}

.role-description {
  font-size: 12px;
  color: rgba(91, 120, 124, 0.7);
  margin-top: 6px;
  font-style: italic;
  font-family: 'Kalam', cursive;
  font-weight: 300;
}

/* Checkbox */
.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1.5;
  font-family: 'Poppins', sans-serif;
}

.checkbox-input {
  position: absolute;
  opacity: 0;
}

.checkbox-custom {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(91, 120, 124, 0.3);
  border-radius: 4px;
  flex-shrink: 0;
  margin-top: 2px;
  transition: all 0.2s ease;
  position: relative;
  background: #d9d2c0;
}

.checkbox-input:checked + .checkbox-custom {
  background: #5B787C;
  border-color: #5B787C;
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

.checkbox-text {
  color: #5B787C;
  font-family: 'Poppins', sans-serif;
  font-size: 0.8rem;
}

/* Register Button */
.register-button {
  width: 100%;
  background: linear-gradient(135deg, #598286 2% , #1c393a 100%);
  color: white;
  border: none;
  padding: 8px 24px;
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
  margin-top: 10px;
}

.register-button:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(91, 120, 124, 0.4);
  background: linear-gradient(135deg, #101622 0%, #5B787C 100%);
}

.register-button:disabled {
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

/* Error Messages */
.field-error {
  color: #A22B25; /* Auburn */
  font-size: 12px;
  margin-top: 4px;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
}

.form-error {
  background: linear-gradient(135deg, rgba(162, 43, 37, 0.1) 0%, rgba(162, 43, 37, 0.05) 100%);
  border: 1px solid rgba(162, 43, 37, 0.3);
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
  color: #A22B25;
  font-size: 15px;
  margin-bottom: 6px;
  font-family: 'Poppins', sans-serif;
}

.error-message {
  color: #A22B25;
  font-size: 14px;
  line-height: 1.5;
  font-family: 'Poppins', sans-serif;
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
  color: #5B787C;
  font-size: 15px;
  font-weight: 500;
  font-family: 'Poppins', sans-serif;
}

/* Login Link */
.login-link {
  text-align: center;
  margin-top: 25px;
}

.login-link p {
  color: #5B787C;
  margin: 0;
  font-size: 15px;
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
}

.link {
  color: #A22B25; /* Auburn */
  text-decoration: none;
  font-weight: 600;
  font-family: 'Poppins', sans-serif;
  transition: all 0.3s ease;
  padding: 2px 4px;
  border-radius: 4px;
}

.link:hover {
  background: rgba(162, 43, 37, 0.1);
  text-decoration: underline;
}

/* Animations */
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

/* Mobile Responsive */
@media (max-width: 768px) {
  .register-page {
    flex-direction: column;
  }

  .brand-section {
    flex: none;
    padding: 30px 20px;
    text-align: center;
  }

  .brand-content {
    text-align: center;
    max-width: none;
  }

  .brand-name {
    font-size: 8rem;
    margin-bottom: 0;
  }

  .brand-subtitle {
    font-size: 2rem;
    margin-bottom: 10px;
  }

  .brand-description {
    font-size: 1rem;
    margin-bottom: 30px;
  }

  .form-section {
    flex: none;
    padding: 20px;
  }

  .form-container {
    max-width: none;
  }

  .register-form {
    gap: 20px;
  }

  .form-group input,
  .form-group select {
    padding: 16px 20px;
    font-size: 15px;
  }

  .register-button {
    padding: 16px 20px;
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .brand-section {
    padding: 20px 15px;
  }

  .brand-name {
    font-size: 4rem;
  }

  .brand-subtitle {
    font-size: 1.5rem;
  }

  .form-section {
    padding: 15px;
  }

  .form-group input,
  .form-group select {
    padding: 6px 10px;
  }
}





.form-group input {
  background: #d9d2c0 !important; /* Add !important */
  /* ... rest of your existing styles ... */
}

.form-group input:focus {
  background: #d9d2c0 !important; /* Also for focus state */
  /* ... rest of your existing styles ... */
}



</style>
