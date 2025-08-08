<template>
  <div class="register-page">
    <h1>Register</h1>
    <form @submit.prevent="handleRegister">
      <div>
        <label>Name:</label>
        <input v-model="name" required />
      </div>
      <div>
        <label>Email:</label>
        <input v-model="email" type="email" required />
      </div>
      <div>
        <label>Password:</label>
        <input v-model="password" type="password" required />
      </div>
      <div>
        <label>Role:</label>
        <select v-model="role" required>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <button type="submit" :disabled="isLoading">Register</button>
    </form>

    <div v-if="error" style="color:red; margin-top:1rem;">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'

const { login, setError, isLoading, loginError } = useAuth()
const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const role = ref<'admin' | 'user'>('user')
const error = ref('')
const success = await login({ email: email.value, password: password.value, role: role.value })


async function handleRegister() {
  if (!name.value || !email.value.includes('@') || !password.value) {
    error.value = 'Please fill all fields with valid info.'
    return
  }

  // Simulate registration process
  // In a real app you'd POST to your backend API here.

  // For demo: after "registration", automatically log in the user
  const success = await login({ email: email.value, password: password.value })

  if (success) {
    // You could update the user role here manually,
    // but since our login assigns role by email content,
    // let's append role in email for demo:
    if (role.value === 'admin' && !email.value.includes('admin')) {
      error.value = 'Please include "admin" in email to register as admin (demo limitation).'
      return
    }

    router.push('/dashboard')
  } else {
    error.value = loginError.value || 'Registration failed'
  }
}
</script>

<style scoped>
/* minimal styling */
form > div {
  margin-bottom: 12px;
}
</style>
