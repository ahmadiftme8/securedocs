// src/main.ts - Enhanced with proper auth initialization
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import '@/assets/main.css'

async function initApp() {
  console.log('🚀 Starting app initialization...')

  const app = createApp(App)
  const pinia = createPinia()

  // Initialize Pinia first
  app.use(pinia)

  // Now we can use stores
  const { useAuthStore } = await import('@/stores/auth')
  const authStore = useAuthStore()

  console.log('🔍 Initializing auth store from localStorage...')

  // Initialize auth store from localStorage
  authStore.initializeAuth()

  console.log('📊 Initial auth state:', {
    isAuthenticated: authStore.isAuthenticated,
    hasUser: !!authStore.user,
    hasToken: !!localStorage.getItem('access_token'),
  })

  // Mount router
  app.use(router)

  // Mount the app
  app.mount('#app')

  console.log('✅ App initialization complete')
}

initApp().catch((error) => {
  console.error('❌ Failed to initialize app:', error)
})
