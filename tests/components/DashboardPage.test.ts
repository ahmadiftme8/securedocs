import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/vue'
import DashboardPage from '@/pages/DashboardPage.vue'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'
import { ref } from 'vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/login', component: { template: '<div>Login</div>' } }]
})

describe('DashboardPage.vue', () => {
  it('uploads a document and displays it in the list', async () => {
    const docs = ref([])

    render(DashboardPage, {
      global: {
        plugins: [
          createTestingPinia({
            stubActions: false,
            initialState: {
              user: { role: 'user' }
            },
            createSpy: () => () => {},
            defineStore: {
              docs: () => ({
                docs,
                uploadDoc: (name: string, uploadedBy: string) => {
                  docs.value.push({
                    id: Date.now(),
                    name,
                    uploadedBy,
                    createdAt: new Date().toISOString()
                  })
                },
                deleteDoc: () => {}
              })
            }
          }),
          router
        ]
      }
    })

    // Upload a document
    const input = screen.getByPlaceholderText('Enter document name...')
    await fireEvent.update(input, 'MyReport.pdf')

    const uploadButton = screen.getByText('Upload')
    await fireEvent.click(uploadButton)

    // Expect to see the uploaded document
    expect(screen.getByText('MyReport.pdf')).toBeTruthy()
  })
})
