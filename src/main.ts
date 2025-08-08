// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { useAuth } from '@/composables/useAuth'
import '@/assets/main.css'

async function initApp() {
  const app = createApp(App)
  app.use(createPinia())

  // Initialize auth
  const { initializeAuth } = useAuth()
  initializeAuth()

  app.use(router)
  app.mount('#app')
}

initApp().catch((error) => {
  console.error('Failed to initialize app:', error)
})
