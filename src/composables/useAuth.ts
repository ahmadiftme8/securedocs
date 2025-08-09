// src/composables/useAuth.ts - Fixed version
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import type { LoginCredentials, RegisterCredentials, User } from '@/types/auth'
import { computed } from 'vue'

export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()

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

  async function registerUser(credentials: RegisterCredentials) {
    try {
      authStore.setLoading(true)
      authStore.setError(null)

      // Validate credentials
      if (!credentials.name?.trim()) {
        throw new Error('Name is required')
      }
      if (!credentials.email?.trim()) {
        throw new Error('Email is required')
      }
      if (!credentials.password) {
        throw new Error('Password is required')
      }
      if (credentials.password.length < 8) {
        throw new Error('Password must be at least 8 characters')
      }
      if (!credentials.role) {
        throw new Error('Role is required')
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(credentials.email)) {
        throw new Error('Invalid email format')
      }

      // Password strength validation
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/
      if (!passwordRegex.test(credentials.password)) {
        throw new Error('Password must contain uppercase, lowercase, and number')
      }

      // Simulate API registration call
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate email already exists error (for demo)
          if (credentials.email.toLowerCase() === 'test@example.com') {
            reject(new Error('Email already exists'))
            return
          }
          resolve(true)
        }, 1000) // Longer delay to simulate real API
      })

      // Generate a unique user ID (in real app, this comes from backend)
      const userId = Date.now().toString()

      const newUser: User = {
        id: userId,
        email: credentials.email.toLowerCase(),
        role: credentials.role,
        name: credentials.name.trim(),
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      }

      // Set user in store (this will automatically log them in)
      authStore.setUser(newUser)

      // Store fake tokens
      localStorage.setItem('access_token', `fake-token-${userId}`)
      localStorage.setItem('refresh_token', `fake-refresh-${userId}`)

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed'
      authStore.setError(errorMessage)
      throw err
    } finally {
      authStore.setLoading(false)
    }
  }

  async function updateProfile(updates: Partial<User>) {
    try {
      authStore.setLoading(true)
      authStore.setError(null)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      const currentUser = authStore.user
      if (!currentUser) {
        throw new Error('No user logged in')
      }

      const updatedUser: User = {
        ...currentUser,
        ...updates,
        id: currentUser.id, // Prevent ID changes
        email: currentUser.email, // Prevent email changes in profile update
      }

      authStore.setUser(updatedUser)
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Profile update failed'
      authStore.setError(errorMessage)
      return false
    } finally {
      authStore.setLoading(false)
    }
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    try {
      authStore.setLoading(true)
      authStore.setError(null)

      // Validate new password
      if (newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters')
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/
      if (!passwordRegex.test(newPassword)) {
        throw new Error('New password must contain uppercase, lowercase, and number')
      }

      // Simulate API call to change password
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate current password validation
          if (currentPassword !== 'currentpass') {
            reject(new Error('Current password is incorrect'))
            return
          }
          resolve(true)
        }, 500)
      })

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password change failed'
      authStore.setError(errorMessage)
      throw err
    } finally {
      authStore.setLoading(false)
    }
  }

  async function refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      // Simulate API call to refresh token
      await new Promise((resolve) => setTimeout(resolve, 300))

      const newToken = `refreshed-token-${Date.now()}`
      localStorage.setItem('access_token', newToken)

      return newToken
    } catch (err) {
      console.error('Token refresh failed:', err)
      logout()
      throw err
    }
  }

  // FIXED LOGOUT FUNCTION
  async function logout() {
    try {
      console.log('🔄 Starting logout process...')

      // Clear the auth store
      authStore.clearAuth()
      console.log('✅ Auth store cleared')

      // Clear all localStorage items
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      localStorage.removeItem('auth_token') // In case you're using this key
      console.log('✅ LocalStorage cleared')

      // Clear sessionStorage as well
      sessionStorage.removeItem('access_token')
      sessionStorage.removeItem('refresh_token')
      sessionStorage.removeItem('user')
      sessionStorage.removeItem('auth_token')
      console.log('✅ SessionStorage cleared')

      // Navigate to login page
      console.log('🚀 Navigating to login...')
      try {
        await router.push('/login')
        console.log('✅ Navigation successful')
      } catch (routerError) {
        console.warn('⚠️ Router navigation failed, using window.location:', routerError)
        window.location.href = '/login'
      }

    } catch (error) {
      console.error('❌ Logout error:', error)

      // Fallback: force clear everything and redirect
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/login'
    }
  }

  const user = computed(() => authStore.user)

  function hasRole(role: string) {
    return user.value?.role === role
  }

  function hasAnyRole(roles: string[]) {
    return authStore.hasAnyRole(roles)
  }

  async function mockLogin(role: 'admin' | 'user') {
    return login({ email: `${role}@example.com`, password: 'password' })
  }

  function initializeAuth() {
    authStore.initializeAuth()
  }

  // Check if user session is valid
  function isSessionValid(): boolean {
    const token = localStorage.getItem('access_token')
    const user = authStore.user
    return !!(token && user)
  }

  // Get user permissions based on role
  function getUserPermissions(): string[] {
    const userRole = user.value?.role
    if (!userRole) return []

    const permissions = {
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

    return permissions[userRole] || []
  }

  function hasPermission(permission: string): boolean {
    return getUserPermissions().includes(permission)
  }

  return {
    // Auth actions
    login,
    registerUser,
    updateProfile,
    changePassword,
    refreshToken,
    mockLogin,
    logout,
    initializeAuth,

    // State
    user,
    isLoading: authStore.isLoading,
    loginError: authStore.error,

    // Utilities
    hasRole,
    hasAnyRole,
    hasPermission,
    getUserPermissions,
    isSessionValid,

    // Computed properties
    isAuthenticated: authStore.isAuthenticated,
    isAdmin: authStore.isAdmin,
    isUser: authStore.isUser,
  }
}
