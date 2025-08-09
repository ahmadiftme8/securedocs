// src/composables/useAuth.ts
import { useAuthStore } from '@/stores/auth'
import type { LoginCredentials, User } from '@/types/auth'
import { computed } from 'vue'

export function useAuth() {
  const authStore = useAuthStore()

  async function login(credentials: LoginCredentials & { role?: 'admin' | 'user' } = {}) {
    try {
      authStore.setLoading(true)
      authStore.setError(null)

      // Simulated API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Determine role:
      const userRole = credentials.role
        ? credentials.role
        : credentials.email.includes('admin')
          ? 'admin'
          : 'user'

      const fakeUser: User = {
        id: '1',
        email: credentials.email,
        role: userRole,
        name: credentials.email.split('@')[0],
      }

      authStore.setUser(fakeUser)

      localStorage.setItem('access_token', 'fake-token')

      return true
    } catch (err) {
      authStore.setError('Login failed')
      return false
    } finally {
      authStore.setLoading(false)
    }
  }

  const user = computed(() => authStore.user)

  function hasRole(role: string) {
    return user.value?.role === role
  }

  async function mockLogin(role: 'admin' | 'user') {
    return login({ email: `${role}@example.com`, password: 'password' })
  }

  function logout() {
    authStore.clearAuth()
  }

  function initializeAuth() {
    authStore.initializeAuth()
  }

  return {
    login,
    mockLogin,
    logout,
    hasRole,
    initializeAuth,
    loginError: authStore.error,
    isLoading: authStore.isLoading,
  }
}
