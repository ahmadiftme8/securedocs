<template>
  <div class="dashboard-page">
    <h1>Welcome to the Dashboard</h1>
    <p>You are logged in as: <strong>{{ role }}</strong></p>
    <button @click="logoutAndGoHome">Log out</button>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/store/user'
import { useRouter } from 'vue-router'

const user = useUserStore()
const router = useRouter()
const role = user.role

function logoutAndGoHome() {
  user.logout()
  router.push('/login')
}
</script>

<style scoped>
.dashboard-page {
  text-align: center;
  margin-top: 80px;
}
</style>
