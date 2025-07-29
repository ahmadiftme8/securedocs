// src/stores/user.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useDocsStore } from './docs'

export const useUserStore = defineStore('user', () => {
  const role = ref<'admin' | 'user' | null>(null)

  function login(selectedRole: 'admin' | 'user') {
    role.value = selectedRole
    const docsStore = useDocsStore()
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
  }

  return { role, login, logout }
})
