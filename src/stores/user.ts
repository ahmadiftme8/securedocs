import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useDocsStore } from './docs'

export const useUserStore = defineStore('user', () => {
  const role = ref<'admin' | 'user' | null>(null)

  // ✅ Load role from localStorage when store is created
  const storedRole = localStorage.getItem('userRole')
  if (storedRole === 'admin' || storedRole === 'user') {
    role.value = storedRole
  }

  function login(selectedRole: 'admin' | 'user') {

    role.value = selectedRole
    localStorage.setItem('userRole', selectedRole)

    const docsStore = useDocsStore()
    docsStore.forceReload()
    docsStore.docs = [
      {
        id: Date.now(),
        name: 'Project Overview.pdf',
        uploadedBy: 'admin',
        createdAt: new Date().toISOString(),
      },
      {
        id: Date.now() + 1,
        name: 'Budget.xlsx',
        uploadedBy: 'user',
        createdAt: new Date().toISOString(),
      },
    ]
  }

  function logout() {
    role.value = null
    localStorage.removeItem('userRole')
  }

  const isLoggedIn = () => role.value !== null

  return {
    role,
    login,
    logout,
    isLoggedIn,
  }
})
