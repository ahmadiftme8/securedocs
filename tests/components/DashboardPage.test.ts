import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/vue'
import DashboardPage from '@/pages/DashboardPage.vue'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'
import { ref } from 'vue'

// Setup a minimal router with needed routes to avoid warnings
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },  // dummy home
    { path: '/login', component: { template: '<div>Login</div>' } }
  ]
})

describe('DashboardPage.vue', () => {
  it('calls uploadDoc when uploading a new document', async () => {
  const fakeUploadDoc = vi.fn()

  render(DashboardPage, {
    global: {
      plugins: [
        createTestingPinia({
          stubActions: true, // STUB actions to enable spying on them
          initialState: {
            user: { role: 'user' },
            docs: { docs: [] }
          },
          // This will auto-mock uploadDoc as a spy function
          // So you can check if it was called
        }),
        router
      ]
    }
  })

  const input = screen.getByPlaceholderText('Enter document name...')
  await fireEvent.update(input, 'MyReport.pdf')
  const uploadButton = screen.getByText('Upload')
  await fireEvent.click(uploadButton)

  // Now get the docs store instance to check spy calls
  const docsStore = useDocsStore()
  expect(docsStore.uploadDoc).toHaveBeenCalledWith('MyReport.pdf', 'user')
})


  it('shows delete button only for admin users and calls deleteDoc on click', async () => {
    // Prepare a sample document
    const docs = ref([
      {
        id: 123,
        name: 'TestFile.pdf',
        uploadedBy: 'user',
        createdAt: new Date().toISOString()
      }
    ])

    // Fake deleteDoc function to spy on delete calls
    const fakeDeleteDoc = vi.fn()

    // Render as a regular user first - no Delete button should show
    const { unmount } = render(DashboardPage, {
      global: {
        plugins: [
          createTestingPinia({
            stubActions: false,
            initialState: { user: { role: 'user' } },
            defineStore: {
              docs: () => ({
                docs,
                uploadDoc: () => {},
                deleteDoc: () => {}
              })
            }
          }),
          router
        ]
      }
    })

    expect(screen.queryByText('Delete')).toBeNull()

    // Clean up before rendering again
    unmount()

    // Render as admin user - Delete button should show
    render(DashboardPage, {
      global: {
        plugins: [
          createTestingPinia({
            stubActions: false,
            initialState: { user: { role: 'admin' } },
            defineStore: {
              docs: () => ({
                docs,
                uploadDoc: () => {},
                deleteDoc: fakeDeleteDoc
              })
            }
          }),
          router
        ]
      }
    })

    // Confirm Delete button is visible
    const deleteButton = screen.getByText('Delete')
    expect(deleteButton).toBeInTheDocument()

    // Click the Delete button
    await fireEvent.click(deleteButton)

    // Check that deleteDoc was called with the doc id
    expect(fakeDeleteDoc).toHaveBeenCalledWith(123)
  })
})
