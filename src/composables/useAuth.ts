import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import { useAuthStore } from '@/stores/auth'
import type { LoginCredentials, RegisterCredentials, User } from '@/types/auth'

export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()
  const error = ref<string | null>(null)
  const isLoading = ref(false)

  // Login
  async function login(credentials: LoginCredentials): Promise<boolean> {
    isLoading.value = true
    error.value = null

    console.log('🔐 Starting login process for:', credentials.email)

    try {
      const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (supabaseError) {
        console.error('❌ Supabase login error:', supabaseError)
        throw supabaseError
      }

      if (!data.user) {
        throw new Error('No user data received')
      }

      console.log('✅ Login successful for user:', data.user.email)
      authStore.setUser(data.user as User)
      return true

    } catch (err: any) {
      console.error('❌ Login failed:', err)
      error.value = err.message || 'Login failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Register - FIXED: Removed auto-login
  async function registerUser(credentials: RegisterCredentials): Promise<boolean> {
    isLoading.value = true
    error.value = null

    console.log('📝 Starting registration for:', credentials.email)

    try {
      const { data, error: supabaseError } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            name: credentials.name,
            role: credentials.role,
          },
          // Add redirect URL for email confirmation
          emailRedirectTo: `${window.location.origin}/dashboard`
        },
      })

      if (supabaseError) {
        console.error('❌ Supabase registration error:', supabaseError)
        throw supabaseError
      }

      console.log('✅ Registration successful. Please check email for confirmation.')

      // Don't auto-login - let user confirm email first
      return true

    } catch (err: any) {
      console.error('❌ Registration failed:', err)
      error.value = err.message || 'Registration failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Logout
  async function logout(): Promise<void> {
    console.log('👋 Logging out...')
    await supabase.auth.signOut()
    authStore.clearAuth()
    router.push('/login')
  }

  // Check auth (restore session)
  async function checkAuth(): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error('❌ Session check error:', error)
        return false
      }

      if (data.session?.user) {
        console.log('✅ Session restored for:', data.session.user.email)
        authStore.setUser(data.session.user as User)
        return true
      }

      console.log('ℹ️ No active session found')
      return false
    } catch (err) {
      console.error('❌ Auth check failed:', err)
      return false
    }
  }

  // Initialize auth listener
  function initializeAuth(): void {
    console.log('🚀 Initializing auth listener...')

    supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email || 'no user')

      if (session?.user) {
        authStore.setUser(session.user as User)
      } else {
        authStore.clearAuth()
      }

      // Handle email confirmation
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        console.log('✅ Email confirmed and signed in')
      }
    })

    // Restore session on load
    checkAuth()
  }

  // Mock login - IMPROVED error handling
  async function mockLogin(role: 'admin' | 'user'): Promise<boolean> {
    const mockEmail = `${role}@securedocs.com`
    const mockPassword = 'Password123'

    console.log(`🎭 Attempting mock login as ${role}`)

    try {
      // Try to login first
      const loginSuccess = await login({ email: mockEmail, password: mockPassword })

      if (loginSuccess) {
        return true
      }

      // If login fails, try to register
      console.log(`📝 Mock user doesn't exist, creating ${role} account...`)
      const registerSuccess = await registerUser({
        email: mockEmail,
        password: mockPassword,
        name: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
        role
      })

      if (registerSuccess) {
        // After registration, user needs to confirm email
        error.value = 'Mock account created. Please check email for confirmation.'
        return false
      }

      return false

    } catch (err: any) {
      console.error('❌ Mock login error:', err)
      error.value = err.message || 'Mock login failed'
      return false
    }
  }

  // Computed properties
  const user = computed(() => authStore.user)
  const hasRole = (role: string) => user.value?.user_metadata?.role === role
  const hasAnyRole = (roles: string[]) => roles.some((r) => hasRole(r))
  const hasPermission = (permission: string) => authStore.getUserPermissions().includes(permission)

  return {
    login,
    registerUser,
    logout,
    checkAuth,
    initializeAuth,
    mockLogin,
    user,
    isLoading,
    error: computed(() => error.value),
    hasRole,
    hasAnyRole,
    hasPermission,
    getUserPermissions: authStore.getUserPermissions,
    isAuthenticated: authStore.isAuthenticated,
    isAdmin: authStore.isAdmin,
    isUser: authStore.isUser,
  }
}
