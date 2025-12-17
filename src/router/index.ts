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
const LandingPage = () => import('@/pages/LandingPage.vue')

const routes: RouteRecordRaw[] = [


  {
    path: '/',
    name: 'Home',
    component: LandingPage,
    meta: {
      requiresGuest: true,
      title: 'Fylor - Files that think',
    },
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: {
      requiresGuest: true,
      title: 'Login - Fylor',
    },
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterPage,
    meta: {
      requiresGuest: true,
      title: 'Register - Fylor',
    },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardPage,
    meta: {
      requiresAuth: true,
      title: 'Dashboard - Fylor',
    },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfilePage,
    meta: {
      requiresAuth: true,
      title: 'Profile - Fylor',
    },
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminPanel,
    meta: {
      requiresAuth: true,
      requiresRole: 'admin',
      title: 'Admin Panel - Fylor',
    },
  },
  {
    path: '/unauthorized',
    name: 'Unauthorized',
    component: UnauthorizedPage,
    meta: {
      title: 'Unauthorized - Fylor',
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

// Global navigation guards
router.beforeEach(async (to, from, next) => {
  console.log(`🚀 Navigating from ${from.path} to ${to.path}`)

  const authStore = useAuthStore()
  const { checkAuth } = useAuth()

  // Set page title
  document.title = (to.meta.title as string) || 'Fylor'

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    try {
      const isAuthenticated = await checkAuth()
      if (!isAuthenticated) {
        console.log('❌ Not authenticated, redirecting to login')
        return next({
          path: '/login',
          query: { redirect: to.fullPath }, // Preserve intended route
        })
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error)
      return next({
        path: '/login',
        query: { redirect: to.fullPath },
      })
    }
  }

  // Check role for protected routes
  if (to.meta.requiresRole) {
    const requiredRole = to.meta.requiresRole as string
    if (!authStore.hasRole(requiredRole)) {
      console.log(
        `❌ Role ${requiredRole} required but user has ${authStore.user?.user_metadata?.role || 'none'}`,
      )
      return next('/unauthorized')
    }
  }

  // Check if route is for guests only (login, register)
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    console.log('✅ User already authenticated, redirecting to dashboard')
    return next('/dashboard')
  }

  console.log('✅ Navigation allowed')
  next()
})

// Global after navigation hooks
router.afterEach((to, from) => {
  console.log(`✅ Navigation completed: ${from.path} → ${to.path}`)
  window.scrollTo(0, 0) // Scroll to top
})

export { router }

// Type extensions for route meta
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiresGuest?: boolean
    requiresRole?: string
    title?: string
    description?: string
  }
}
