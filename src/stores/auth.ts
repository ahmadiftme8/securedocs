import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export type User = SupabaseUser & {
  // Extend with your custom fields
  user_metadata: { name?: string; role?: 'admin' | 'user' }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.user_metadata?.role === 'admin')
  const isUser = computed(() => user.value?.user_metadata?.role === 'user')
  const userName = computed(() => user.value?.user_metadata?.name || 'User')

  // Actions
  function setUser(userData: User | null) {
    user.value = userData
    error.value = null
  }

  function clearAuth() {
    user.value = null
    error.value = null
    isLoading.value = false
  }

  function setError(errorMessage: string | null) {
    error.value = errorMessage
  }

  function hasRole(role: string): boolean {
    return user.value?.user_metadata?.role === role
  }

  function hasAnyRole(roles: string[]): boolean {
    return roles.some((role) => hasRole(role))
  }

  // Permissions (adapt as needed)
  function getUserPermissions(): string[] {
    const role = user.value?.user_metadata?.role
    if (!role) return []
    const permissions: Record<string, string[]> = {
      admin: [
        'read:files',
        'write:files',
        'delete:files',
        'manage:users',
        'manage:settings',
        'view:analytics',
      ],
      user: ['read:files', 'write:files', 'delete:own-files'],
    }
    return permissions[role] || []
  }

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    isAdmin,
    isUser,
    userName,
    setUser,
    clearAuth,
    setError,
    hasRole,
    hasAnyRole,
    getUserPermissions,
  }
})
