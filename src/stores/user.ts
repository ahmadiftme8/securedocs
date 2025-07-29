import { defineStore } from 'pinia'
import { ref } from 'vue'

export type UserRole = 'admin' | 'user' | null

export const useUserStore = defineStore('user', () => {
  const role = ref<UserRole>(null)

  function login(as: UserRole) {
    role.value = as
  }

  function logout() {
    role.value = null
  }

  return { role, login, logout }
})
