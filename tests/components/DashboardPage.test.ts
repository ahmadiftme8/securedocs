import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';
import DashboardPage from '@/pages/DashboardPage.vue';
import { createTestingPinia } from '@pinia/testing';
import { createRouter, createWebHistory } from 'vue-router';

// ❗️ FIX: Import the store you are testing
import { useDocsStore } from '@/stores/docs';


// Setup a minimal router with needed routes to avoid warnings
const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ✨ FIX: Add a dummy root path to silence the warning
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/dashboard', component: DashboardPage },
    { path: '/login', component: { template: '<div>Login</div>' } },
  ],
});

describe('DashboardPage.vue', () => {
  it('calls uploadDoc when uploading a new document', async () => {
    // This test was mostly correct, just needed the store import to work.
    render(DashboardPage, {
      global: {
        plugins: [
          createTestingPinia({
            stubActions: true, // Automatically mocks actions
            initialState: {
              user: { role: 'user' },
              docs: { docs: [] },
            },
          }),
          router,
        ],
      },
    });

    const input = screen.getByPlaceholderText('Enter document name...');
    await fireEvent.update(input, 'MyReport.pdf');
    const uploadButton = screen.getByText('Upload');
    await fireEvent.click(uploadButton);

    // Now that the store is imported, this will work correctly.
    const docsStore = useDocsStore();
    expect(docsStore.uploadDoc).toHaveBeenCalledWith('MyReport.pdf', 'user');
  });

  // ✨ REFACTORED: This test is now much simpler and more robust.
  it('shows delete button only for admin users and calls deleteDoc on click', async () => {
    const sampleDocs = [
      {
        id: 123,
        name: 'TestFile.pdf',
        uploadedBy: 'user',
        createdAt: new Date().toISOString(),
      },
    ];

    // 1. Render as a regular user
    const { unmount } = render(DashboardPage, {
      global: {
        plugins: [
          createTestingPinia({
            stubActions: true,
            initialState: {
              user: { role: 'user' },
              docs: { docs: sampleDocs }, // Provide initial documents
            },
          }),
          router,
        ],
      },
    });

    // A regular user should NOT see the delete button
    expect(screen.queryByText('Delete')).toBeNull();

    // Clean up before rendering again
    unmount();

    // 2. Render as an admin user
    render(DashboardPage, {
      global: {
        plugins: [
          createTestingPinia({
            stubActions: true,
            initialState: {
              user: { role: 'admin' }, // Set role to admin
              docs: { docs: sampleDocs },
            },
          }),
          router,
        ],
      },
    });

    // Admin user SHOULD see the delete button
    const deleteButton = screen.getByText('Delete');
    expect(deleteButton).not.toBeNull();

    // 3. Click the delete button and verify the action was called
    await fireEvent.click(deleteButton);

    const docsStore = useDocsStore();
    expect(docsStore.deleteDoc).toHaveBeenCalledWith(123);
  });
});
