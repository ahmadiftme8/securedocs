// src/stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isUser = computed(() => user.value?.role === 'user')

  // Actions
  function setUser(userData: User) {
    user.value = userData
    error.value = null

    // Persist user data (except tokens which should be in httpOnly cookies or secure storage)
    localStorage.setItem('user', JSON.stringify({
      id: userData.id,
      email: userData.email,
      role: userData.role,
      name: userData.name
    }))
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setError(errorMessage: string | null) {
    error.value = errorMessage
  }

  function clearAuth() {
    user.value = null
    error.value = null
    isLoading.value = false

    // Clear persisted data
    localStorage.removeItem('user')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  // Initialize from localStorage on app start
  function initializeAuth() {
    try {
      const storedUser = localStorage.getItem('user')
      const accessToken = localStorage.getItem('access_token')

      if (storedUser && accessToken) {
        const userData = JSON.parse(storedUser)
        user.value = userData
      }
    } catch (error) {
      console.error('Failed to initialize auth from storage:', error)
      clearAuth()
    }
  }

  // Check if user has specific permission/role
  function hasRole(role: string): boolean {
    return user.value?.role === role
  }

  function hasAnyRole(roles: string[]): boolean {
    return roles.some(role => user.value?.role === role)
  }

  return {
    // State
    user,
    isLoading,
    error,

    // Getters
    isAuthenticated,
    isAdmin,
    isUser,

    // Actions
    setUser,
    setLoading,
    setError,
    clearAuth,
    initializeAuth,
    hasRole,
    hasAnyRole
  }
})
