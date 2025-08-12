// src/router/index.ts - Fixed with auth restoration
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAuth } from '@/composables/useAuth'

// Lazy load components for better performance
const LoginPage = () => import('@/pages/LoginPage.vue')
const RegisterPage = () => import('@/pages/RegisterPage.vue')
const DashboardPage = () => import('@/pages/DashboardPage.vue')
const AdminPanel = () => import('@/pages/AdminPanel.vue')
const ProfilePage = () => import('@/pages/ProfilePage.vue')
const UnauthorizedPage = () => import('@/pages/UnauthorizedPage.vue')

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: {
      requiresGuest: true,
      title: 'Login - SecureDocs',
    },
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterPage,
    meta: {
      requiresGuest: true,
      title: 'Register - SecureDocs',
    },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardPage,
    meta: {
      requiresAuth: true,
      title: 'Dashboard - SecureDocs',
    },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfilePage,
    meta: {
      requiresAuth: true,
      title: 'Profile - SecureDocs',
    },
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminPanel,
    meta: {
      requiresAuth: true,
      requiresRole: 'admin',
      title: 'Admin Panel - SecureDocs',
    },
  },
  {
    path: '/unauthorized',
    name: 'Unauthorized',
    component: UnauthorizedPage,
    meta: {
      title: 'Unauthorized - SecureDocs',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/dashboard',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Global navigation guards with auth restoration
router.beforeEach(async (to, from, next) => {
  console.log(`🚀 Navigating from ${from.path} to ${to.path}`)

  const authStore = useAuthStore()
  const { checkAuth } = useAuth()

  // Set page title
  document.title = (to.meta.title as string) || 'SecureDocs'

  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    console.log('🔒 Route requires authentication, checking auth state...')

    // If not authenticated, try to restore from localStorage/server
    if (!authStore.isAuthenticated) {
      console.log('❌ Not authenticated, attempting to restore auth...')

      try {
        // Try to restore authentication
        const isAuthenticated = await checkAuth()

        if (!isAuthenticated) {
          console.log('❌ Auth restoration failed, redirecting to login')
          return next({
            path: '/login',
            query: { redirect: to.fullPath },
          })
        }

        console.log('✅ Auth restored successfully')
      } catch (error) {
        console.error('❌ Auth check failed:', error)
        return next({
          path: '/login',
          query: { redirect: to.fullPath },
        })
      }
    }

    // Check if route requires specific role
    if (to.meta.requiresRole) {
      const requiredRole = to.meta.requiresRole as string
      if (!authStore.hasRole(requiredRole)) {
        console.log(`❌ Role ${requiredRole} required but user has ${authStore.user?.role}`)
        return next('/unauthorized')
      }
    }

    // Check if route requires any of multiple roles
    if (to.meta.requiresAnyRole) {
      const requiredRoles = to.meta.requiresAnyRole as string[]
      if (!authStore.hasAnyRole(requiredRoles)) {
        console.log(
          `❌ One of roles ${requiredRoles} required but user has ${authStore.user?.role}`,
        )
        return next('/unauthorized')
      }
    }
  }

  // Check if route is for guests only (login, register)
  if (to.meta.requiresGuest) {
    // Try to restore auth state first to check if user is actually logged in
    if (!authStore.isAuthenticated) {
      try {
        const isAuthenticated = await checkAuth()
        if (isAuthenticated) {
          console.log('✅ User is authenticated, redirecting to dashboard')
          return next('/dashboard')
        }
      } catch (error) {
        // User is not authenticated, allow access to guest route
        console.log('👤 User not authenticated, allowing guest route access')
      }
    } else {
      console.log('✅ User already authenticated, redirecting to dashboard')
      return next('/dashboard')
    }
  }

  console.log('✅ Navigation allowed')
  next()
})

// Global after navigation hooks for analytics, loading states, etc.
router.afterEach((to, from) => {
  console.log(`✅ Navigation completed: ${from.path} → ${to.path}`)

  // Scroll to top on route change
  window.scrollTo(0, 0)
})

export { router }

// Type extensions for route meta
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiresGuest?: boolean
    requiresRole?: string
    requiresAnyRole?: string[]
    title?: string
    description?: string
  }
}
