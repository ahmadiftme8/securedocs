import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '@/pages/LoginPage.vue'
import DashboardPage from '@/pages/DashboardPage.vue'
import { useUserStore } from '@/stores/user'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginPage },
  { path: '/dashboard', component: DashboardPage },
  { path: '/:pathMatch(.*)*', redirect: '/login' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 🔐 Global route guard
router.beforeEach((to, from, next) => {
  const user = useUserStore()
  const isLoggedIn = user.role !== null

  if (to.path === '/dashboard' && !isLoggedIn) {
    next('/login')
  } else {
    next()
  }
})

export { router }
