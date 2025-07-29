<template>
  <div class="login-page">
    <h2>Select a role to log in</h2>
    <button @click="handleLogin('user')">Login as User</button>
    <button @click="handleLogin('admin')">Login as Admin</button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const user = useUserStore()
const router = useRouter()

function handleLogin(role: 'admin' | 'user') {
  user.login(role)
  router.push('/dashboard')
}
</script>

<style scoped>
.login-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 100px;
}
button {
  margin: 10px;
  padding: 10px 20px;
}
</style>
