// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '@/pages/LoginPage.vue'
import DashboardPage from '@/pages/DashboardPage.vue'
import { useUserStore } from '@/stores/user'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginPage },
  {
    path: '/dashboard',
    component: DashboardPage,
    meta: { requiresAuth: true },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const user = useUserStore()

  if (to.meta.requiresAuth && !user.role) {
    next('/login')
  } else {
    next()
  }
})
