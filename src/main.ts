import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { useAuth } from './composables/useAuth'
import '@/assets/main.css'

async function initApp() {
  console.log('🚀 Starting app initialization...')

  const app = createApp(App)
  const pinia = createPinia()

  // Initialize Pinia
  app.use(pinia)

  // Initialize auth with Supabase
  const { initializeAuth } = useAuth()
  await initializeAuth() // Sets up auth listener and restores session

  // Log auth state for debugging
  const { useAuthStore } = await import('@/stores/auth')
  const authStore = useAuthStore()
  console.log('📊 Initial auth state:', {
    isAuthenticated: authStore.isAuthenticated,
    hasUser: !!authStore.user,
    userRole: authStore.user?.user_metadata?.role || 'none',
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
