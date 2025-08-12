// src/stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastActivity = ref<Date | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isUser = computed(() => user.value?.role === 'user')
  const userName = computed(() => user.value?.name || 'User')
  const userInitials = computed(() => {
    if (!user.value?.name) return 'U'
    return user.value.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  })

  // Session management
  const isSessionExpired = computed(() => {
    if (!lastActivity.value) return false
    const now = new Date()
    const timeDiff = now.getTime() - lastActivity.value.getTime()
    const sessionTimeout = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    return timeDiff > sessionTimeout
  })

  // Actions
  function setUser(userData: User) {
    user.value = userData
    error.value = null
    lastActivity.value = new Date()

    // Persist user data (except sensitive tokens)
    const userDataToStore = {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      name: userData.name,
      avatar: userData.avatar,
      createdAt: userData.createdAt,
      lastLoginAt: userData.lastLoginAt,
    }

    localStorage.setItem('user', JSON.stringify(userDataToStore))
    localStorage.setItem('lastActivity', new Date().toISOString())
  }

  function updateUser(updates: Partial<User>) {
    if (user.value) {
      user.value = { ...user.value, ...updates }

      // Update localStorage
      const userDataToStore = {
        id: user.value.id,
        email: user.value.email,
        role: user.value.role,
        name: user.value.name,
        avatar: user.value.avatar,
        createdAt: user.value.createdAt,
        lastLoginAt: user.value.lastLoginAt,
      }

      localStorage.setItem('user', JSON.stringify(userDataToStore))
    }
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setError(errorMessage: string | null) {
    error.value = errorMessage
  }

  function updateActivity() {
    lastActivity.value = new Date()
    localStorage.setItem('lastActivity', new Date().toISOString())
  }

  function clearAuth() {
    user.value = null
    error.value = null
    isLoading.value = false
    lastActivity.value = null

    // Clear all persisted auth data
    localStorage.removeItem('user')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('lastActivity')

    // Clear any other app-specific data
    localStorage.removeItem('preferences')
    localStorage.removeItem('recent_files')
  }

  // In your auth store, add this method:
  function clearError() {
    error.value = null
  }

  // And return it:
  return {
    // ... existing returns
    clearError,
  }

  // Initialize from localStorage on app start
  function initializeAuth() {
    try {
      const storedUser = localStorage.getItem('user')
      const accessToken = localStorage.getItem('access_token')
      const storedActivity = localStorage.getItem('lastActivity')

      if (storedUser && accessToken) {
        const userData = JSON.parse(storedUser)
        const activityDate = storedActivity ? new Date(storedActivity) : new Date()

        // Check if session is still valid
        const now = new Date()
        const timeDiff = now.getTime() - activityDate.getTime()
        const sessionTimeout = 24 * 60 * 60 * 1000 // 24 hours

        if (timeDiff <= sessionTimeout) {
          user.value = userData
          lastActivity.value = activityDate

          // Update last activity to current time
          updateActivity()
        } else {
          // Session expired, clear auth
          clearAuth()
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth from storage:', error)
      clearAuth()
    }
  }

  // Role and permission checking
  function hasRole(role: string): boolean {
    return user.value?.role === role
  }

  function hasAnyRole(roles: string[]): boolean {
    return roles.some((role) => user.value?.role === role)
  }

  function canAccessAdminPanel(): boolean {
    return user.value?.role === 'admin'
  }

  function canManageUsers(): boolean {
    return user.value?.role === 'admin'
  }

  function canUploadFiles(): boolean {
    return isAuthenticated.value
  }

  function canDeleteFile(fileOwnerId?: string): boolean {
    if (!user.value) return false
    if (user.value.role === 'admin') return true
    return user.value.id === fileOwnerId
  }

  // Account status checks
  function isAccountActive(): boolean {
    return !!user.value && !isSessionExpired.value
  }

  function needsReauthentication(): boolean {
    return isAuthenticated.value && isSessionExpired.value
  }

  // User preferences (example of additional functionality)
  function getUserPreferences() {
    try {
      const prefs = localStorage.getItem('preferences')
      return prefs
        ? JSON.parse(prefs)
        : {
            theme: 'light',
            language: 'en',
            notifications: true,
            autoSave: true,
          }
    } catch {
      return {
        theme: 'light',
        language: 'en',
        notifications: true,
        autoSave: true,
      }
    }
  }

  function setUserPreferences(preferences: Record<string, any>) {
    localStorage.setItem('preferences', JSON.stringify(preferences))
  }
})
