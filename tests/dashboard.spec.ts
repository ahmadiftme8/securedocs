import { test, expect } from '@playwright/test';

test.describe('Dashboard Functionality', () => {

  // Helper function to login as user
  async function loginAsUser(page) {
    await page.goto('/login');
    await page.click('button:has-text("Login as User")');
    await expect(page).toHaveURL('/dashboard');
  }

  // Helper function to login as admin
  async function loginAsAdmin(page) {
    await page.goto('/login');
    await page.click('button:has-text("Login as Admin")');
    await expect(page).toHaveURL('/dashboard');
  }

  test('user can upload a new document', async ({ page }) => {
    await loginAsUser(page);

    // Count initial documents
    const initialDocs = await page.locator('.doc-list li').count();

    // Upload a new document
    const docName = 'My Test Document';
    await page.fill('input[placeholder="Enter document name..."]', docName);
    await page.click('button:has-text("Upload")');

    // Check if document was added
    await expect(page.locator('.doc-list li')).toHaveCount(initialDocs + 1);
    await expect(page.locator('.doc-list li').last()).toContainText(docName);
    await expect(page.locator('.doc-list li').last()).toContainText('uploaded by user');

    // Input should be cleared
    await expect(page.locator('input[placeholder="Enter document name..."]')).toHaveValue('');
  });

  test('search functionality works', async ({ page }) => {
    await loginAsUser(page);

    // Search for a specific document
    await page.fill('input[placeholder="Search documents..."]', 'Project');

    // Should show only documents containing "Project"
    const visibleDocs = page.locator('.doc-list li');
    await expect(visibleDocs).toContainText('Project Overview.pdf');

    // Clear search
    await page.fill('input[placeholder="Search documents..."]', '');

    // Should show all documents again
    await expect(page.locator('.doc-list li')).toHaveCount(2); // Initial 2 docs
  });

  test('show only my documents filter works', async ({ page }) => {
    await loginAsUser(page);

    // Check the "show only mine" checkbox
    await page.check('input[type="checkbox"]');

    // Should only show user's documents
    const visibleDocs = page.locator('.doc-list li');
    const count = await visibleDocs.count();

    // Verify all visible docs are uploaded by user
    for (let i = 0; i < count; i++) {
      await expect(visibleDocs.nth(i)).toContainText('uploaded by user');
    }

    // Uncheck the filter
    await page.uncheck('input[type="checkbox"]');

    // Should show all documents again
    await expect(page.locator('.doc-list li')).toHaveCount(2);
  });

  test('admin can delete documents', async ({ page }) => {
    await loginAsAdmin(page);

    // Count initial documents
    const initialCount = await page.locator('.doc-list li').count();

    // Click first delete button
    await page.click('.doc-list li:first-child button:has-text("Delete")');

    // Should have one less document
    await expect(page.locator('.doc-list li')).toHaveCount(initialCount - 1);
  });

  test('user cannot see delete buttons', async ({ page }) => {
    await loginAsUser(page);

    // User should not see any delete buttons
    await expect(page.locator('button:has-text("Delete")')).toHaveCount(0);
  });

  test('logout functionality works', async ({ page }) => {
    await loginAsUser(page);

    // Click logout button
    await page.click('button:has-text("Log out")');

    // Should redirect to login page
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h2')).toContainText('Select a role to log in');
  });
});
