import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/vue'
import DashboardPage from '@/views/DashboardPage.vue'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/login', component: { template: '<div>Login</div>' } }]
})

describe('DashboardPage.vue', () => {
  beforeEach(() => {
    // Clean test setup happens here if needed
  })

  it('lets user upload a document and displays it', async () => {
    render(DashboardPage, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              user: { role: 'user' },
              docs: { docs: [] }
            },
            createSpy: () => () => {}
          }),
          router
        ]
      }
    })

    // Type a document name
    const input = screen.getByPlaceholderText('Enter document name...')
    await fireEvent.update(input, 'TestDocument.pdf')

    // Click the Upload button
    const uploadButton = screen.getByText('Upload')
    await fireEvent.click(uploadButton)

    // Expect the new doc to appear in the list
    expect(screen.getByText(/TestDocument.pdf/i)).toBeTruthy()
  })
})
