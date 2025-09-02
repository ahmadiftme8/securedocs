import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase' // Import client
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
    try {
      const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })
      if (supabaseError) throw supabaseError
      authStore.setUser(data.user as User) // Set user in store
      return true
    } catch (err: any) {
      error.value = err.message || 'Login failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Register
  async function registerUser(credentials: RegisterCredentials): Promise<boolean> {
    isLoading.value = true
    error.value = null
    try {
      const { data, error: supabaseError } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            name: credentials.name,
            role: credentials.role, // Store role in metadata
          },
        },
      })
      if (supabaseError) throw supabaseError
      // Auto-login after signup
      await login({ email: credentials.email, password: credentials.password })
      return true
    } catch (err: any) {
      error.value = err.message || 'Registration failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Logout
  async function logout(): Promise<void> {
    await supabase.auth.signOut()
    authStore.clearAuth()
    router.push('/login')
  }

  // Check auth (restore session)
  async function checkAuth(): Promise<boolean> {
    const { data } = await supabase.auth.getSession()
    if (data.session) {
      authStore.setUser(data.session.user as User)
      return true
    }
    return false
  }

  // Initialize auth listener
  function initializeAuth(): void {
    supabase.auth.onAuthStateChange((_, session) => {
      authStore.setUser((session?.user as User) ?? null)
    })
    checkAuth() // Restore on load
  }

  // Mock login (for dev; remove in prod if not needed)
  async function mockLogin(role: 'admin' | 'user'): Promise<boolean> {
    const mockEmail = `${role}@securedocs.com`
    const mockPassword = 'Password123'
    // Check if exists, else register
    const { data } = await supabase.auth.signInWithPassword({
      email: mockEmail,
      password: mockPassword,
    })
    if (!data.user) {
      await registerUser({ email: mockEmail, password: mockPassword, name: `${role} User`, role })
    }
    return await login({ email: mockEmail, password: mockPassword })
  }

  // Other utils (adapted)
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
    error: computed(() => error.value), // Expose as computed for reactivity
    hasRole,
    hasAnyRole,
    hasPermission,
    getUserPermissions: authStore.getUserPermissions,
    isAuthenticated: authStore.isAuthenticated,
    isAdmin: authStore.isAdmin,
    isUser: authStore.isUser,
  }
}
