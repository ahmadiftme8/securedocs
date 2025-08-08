// src/router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

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
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: {
      requiresGuest: true,
      title: 'Login - SecureDocs'
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterPage,
    meta: {
      requiresGuest: true,
      title: 'Register - SecureDocs'
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardPage,
    meta: {
      requiresAuth: true,
      title: 'Dashboard - SecureDocs'
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfilePage,
    meta: {
      requiresAuth: true,
      title: 'Profile - SecureDocs'
    }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminPanel,
    meta: {
      requiresAuth: true,
      requiresRole: 'admin',
      title: 'Admin Panel - SecureDocs'
    }
  },
  {
    path: '/unauthorized',
    name: 'Unauthorized',
    component: UnauthorizedPage,
    meta: {
      title: 'Unauthorized - SecureDocs'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Global navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Set page title
  document.title = to.meta.title as string || 'SecureDocs'

  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      // Redirect to login with return path
      return next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    }

    // Check if route requires specific role
    if (to.meta.requiresRole) {
      const requiredRole = to.meta.requiresRole as string
      if (!authStore.hasRole(requiredRole)) {
        return next('/unauthorized')
      }
    }

    // Check if route requires any of multiple roles
    if (to.meta.requiresAnyRole) {
      const requiredRoles = to.meta.requiresAnyRole as string[]
      if (!authStore.hasAnyRole(requiredRoles)) {
        return next('/unauthorized')
      }
    }
  }

  // Check if route is for guests only (login, register)
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return next('/dashboard')
  }

  next()
})

// Global after navigation hooks for analytics, loading states, etc.
router.afterEach((to, from) => {
  // You can add analytics tracking here
  // analytics.page(to.path)

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
