// src/composables/useAuth.ts - Clean TypeScript version
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import type { LoginCredentials, RegisterCredentials, User } from '@/types/auth'
import { computed } from 'vue'

const API_BASE_URL = '/.netlify/functions'

export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()

  // Helper function to make API calls
  async function apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${API_BASE_URL}${endpoint}`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    }

    // Add auth token if available
    const token = localStorage.getItem('access_token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const config: RequestInit = {
      ...options,
      headers,
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
      } catch {
        // If response is not JSON, use default message
      }
      throw new Error(errorMessage)
    }

    return await response.json()
  }

  async function login(credentials: LoginCredentials): Promise<boolean> {
    try {
      authStore.setLoading(true)
      authStore.setError(null)

      console.log('🔐 Attempting login for:', credentials.email)

      const response = await apiCall('/auth-login', {
        method: 'POST',
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      })

      console.log('✅ Login successful:', response.user.email)

      // Store tokens
      localStorage.setItem('access_token', response.tokens.accessToken)
      if (response.tokens.refreshToken) {
        localStorage.setItem('refresh_token', response.tokens.refreshToken)
      }

      // Set user in store
      authStore.setUser(response.user)

      return true
    } catch (error) {
      console.error('❌ Login failed:', error)

      let errorMessage = 'Login failed'
      if (error instanceof Error) {
        if (error.message.includes('Invalid email or password')) {
          errorMessage = 'Invalid email or password'
        } else if (error.message.includes('locked')) {
          errorMessage = 'Account temporarily locked due to too many failed attempts'
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Unable to connect to server. Please try again.'
        } else {
          errorMessage = error.message
        }
      }

      authStore.setError(errorMessage)
      return false
    } finally {
      authStore.setLoading(false)
    }
  }

  async function registerUser(credentials: RegisterCredentials): Promise<boolean> {
    try {
      authStore.setLoading(true)
      authStore.setError(null)

      console.log('📝 Attempting registration for:', credentials.email)

      const response = await apiCall('/auth-register', {
        method: 'POST',
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          name: credentials.name,
          role: credentials.role,
        }),
      })

      console.log('✅ Registration successful:', response.user.email)

      // Store tokens
      localStorage.setItem('access_token', response.tokens.accessToken)
      if (response.tokens.refreshToken) {
        localStorage.setItem('refresh_token', response.tokens.refreshToken)
      }

      // Set user in store
      authStore.setUser(response.user)

      return true
    } catch (error) {
      console.error('❌ Registration failed:', error)

      let errorMessage = 'Registration failed'
      if (error instanceof Error) {
        if (error.message.includes('Email already registered')) {
          errorMessage = 'An account with this email already exists'
        } else if (error.message.includes('All fields required')) {
          errorMessage = 'Please fill in all required fields'
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Unable to connect to server. Please try again.'
        } else {
          errorMessage = error.message
        }
      }

      authStore.setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      authStore.setLoading(false)
    }
  }

  async function updateProfile(updates: Partial<User>): Promise<boolean> {
    try {
      authStore.setLoading(true)
      authStore.setError(null)

      console.log('👤 Updating profile...')

      const response = await apiCall('/auth-profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
      })

      console.log('✅ Profile updated successfully')

      // Update user in store
      authStore.setUser(response.user)

      return true
    } catch (error) {
      console.error('❌ Profile update failed:', error)

      const errorMessage = error instanceof Error ? error.message : 'Profile update failed'
      authStore.setError(errorMessage)
      return false
    } finally {
      authStore.setLoading(false)
    }
  }

  async function changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      authStore.setLoading(true)
      authStore.setError(null)

      await apiCall('/auth-change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password change failed'
      authStore.setError(errorMessage)
      throw error
    } finally {
      authStore.setLoading(false)
    }
  }

  async function refreshToken(): Promise<string> {
    try {
      const refreshTokenValue = localStorage.getItem('refresh_token')
      if (!refreshTokenValue) {
        throw new Error('No refresh token available')
      }

      console.log('🔄 Refreshing token...')

      const response = await apiCall('/auth-refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      })

      // Update access token
      localStorage.setItem('access_token', response.accessToken)
      console.log('✅ Token refreshed successfully')

      return response.accessToken
    } catch (error) {
      console.error('❌ Token refresh failed:', error)

      // If refresh fails, logout the user
      await logout()
      throw error
    }
  }

  async function logout(): Promise<void> {
    try {
      console.log('🔄 Starting logout process...')

      // Try to revoke refresh token on backend
      try {
        const refreshTokenValue = localStorage.getItem('refresh_token')
        if (refreshTokenValue) {
          await apiCall('/auth-logout', {
            method: 'POST',
            body: JSON.stringify({ refreshToken: refreshTokenValue }),
          })
        }
      } catch (error) {
        console.warn('⚠️ Backend logout failed, continuing with local logout:', error)
      }

      // Clear local storage
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      sessionStorage.removeItem('access_token')
      sessionStorage.removeItem('refresh_token')
      sessionStorage.removeItem('user')

      // Clear auth store
      authStore.clearAuth()
      console.log('✅ Logout completed')

      // Navigate to login page
      try {
        await router.push('/login')
        console.log('✅ Navigation to login successful')
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

  async function checkAuth(): Promise<boolean> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        return false
      }

      // Verify token with backend
      const response = await apiCall('/auth-profile')

      // Update user in store
      authStore.setUser(response.user)

      return true
    } catch (error) {
      console.warn('🔍 Auth check failed:', error)

      // Try to refresh token
      try {
        await refreshToken()
        return await checkAuth() // Retry with new token
      } catch (refreshError) {
        console.warn('🔄 Token refresh failed during auth check')
        await logout()
        return false
      }
    }
  }

  // Clear error function
  function clearError(): void {
    authStore.setError(null)
  }

  // Mock login for development (remove in production)
  async function mockLogin(role: 'admin' | 'user'): Promise<boolean> {
    const mockCredentials = {
      email: `${role}@securedocs.com`,
      password: 'Password123',
    }

    return await login(mockCredentials)
  }

  const user = computed(() => authStore.user)

  function hasRole(role: string): boolean {
    return user.value?.role === role
  }

  function hasAnyRole(roles: string[]): boolean {
    return authStore.hasAnyRole(roles)
  }

  function initializeAuth(): void {
    // Check if user is already authenticated
    checkAuth().catch(() => {
      // Silently fail - user will need to login
    })
  }

  function isSessionValid(): boolean {
    const token = localStorage.getItem('access_token')
    const userValue = authStore.user
    return !!(token && userValue)
  }

  // Get user permissions based on role
  function getUserPermissions(): string[] {
    const userRole = user.value?.role
    if (!userRole) return []

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

    return permissions[userRole] || []
  }

  function hasPermission(permission: string): boolean {
    return getUserPermissions().includes(permission)
  }

  // Auto-refresh token when it's about to expire
  function startTokenRefreshTimer(): void {
    const token = localStorage.getItem('access_token')
    if (!token) return

    try {
      // Decode JWT to get expiration time (basic decode, no verification)
      const payload = JSON.parse(atob(token.split('.')[1]))
      const expirationTime = payload.exp * 1000 // Convert to milliseconds
      const currentTime = Date.now()
      const timeUntilExpiry = expirationTime - currentTime

      // Refresh token 5 minutes before expiry
      const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 60000) // At least 1 minute

      if (refreshTime > 0) {
        setTimeout(async () => {
          try {
            await refreshToken()
            startTokenRefreshTimer() // Start timer for new token
          } catch (error) {
            console.error('Auto token refresh failed:', error)
            await logout()
          }
        }, refreshTime)
      }
    } catch (error) {
      console.error('Error setting up token refresh timer:', error)
    }
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
    checkAuth,
    initializeAuth,
    startTokenRefreshTimer,
    clearError, // ← Added this

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
