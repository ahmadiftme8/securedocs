import { test, expect } from '@playwright/test';

test.describe('Complete User Journey', () => {

  test('complete admin workflow: login, upload, search, delete, logout', async ({ page }) => {
    // Step 1: Go to login page
    await page.goto('/login');
    await expect(page.locator('h2')).toContainText('Select a role to log in');

    // Step 2: Login as admin
    await page.click('button:has-text("Login as Admin")');
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('p')).toContainText('You are logged in as: admin');

    // Step 3: Upload a new document
    const newDocName = 'Admin Test Document';
    await page.fill('input[placeholder="Enter document name..."]', newDocName);
    await page.click('button:has-text("Upload")');
    await expect(page.locator('.doc-list li').last()).toContainText(newDocName);

    // Step 4: Search for the uploaded document
    await page.fill('input[placeholder="Search documents..."]', 'Admin Test');
    await expect(page.locator('.doc-list li')).toContainText(newDocName);

    // Step 5: Clear search to see all documents
    await page.fill('input[placeholder="Search documents..."]', '');
    const docsBeforeDelete = await page.locator('.doc-list li').count();

    // Step 6: Delete a document (admin privilege)
    await page.click('.doc-list li:first-child button:has-text("Delete")');
    await expect(page.locator('.doc-list li')).toHaveCount(docsBeforeDelete - 1);

    // Step 7: Test "Show only my documents" filter
    await page.check('input[type="checkbox"]');
    const myDocs = page.locator('.doc-list li');
    const count = await myDocs.count();

    // All visible docs should be uploaded by admin
    for (let i = 0; i < count; i++) {
      await expect(myDocs.nth(i)).toContainText('uploaded by admin');
    }

    // Step 8: Logout
    await page.click('button:has-text("Log out")');
    await expect(page).toHaveURL('/login');
  });

  test('complete user workflow: login, upload, search, logout', async ({ page }) => {
    // Step 1: Login as user
    await page.goto('/login');
    await page.click('button:has-text("Login as User")');
    await expect(page).toHaveURL('/dashboard');

    // Step 2: Verify user has limited permissions
    await expect(page.locator('.info')).toContainText('You can upload, but not delete documents');
    await expect(page.locator('button:has-text("Delete")')).toHaveCount(0);

    // Step 3: Upload multiple documents
    const docs = ['User Doc 1', 'User Doc 2', 'Important Notes'];

    for (const docName of docs) {
      await page.fill('input[placeholder="Enter document name..."]', docName);
      await page.click('button:has-text("Upload")');
      await expect(page.locator('.doc-list li').last()).toContainText(docName);
    }

    // Step 4: Test search functionality
    await page.fill('input[placeholder="Search documents..."]', 'Important');
    await expect(page.locator('.doc-list li')).toContainText('Important Notes');
    await expect(page.locator('.doc-list li')).toHaveCount(1);

    // Step 5: Clear search and use "Show only mine" filter
    await page.fill('input[placeholder="Search documents..."]', '');
    await page.check('input[type="checkbox"]');

    // Should only show user's documents
    const myDocs = page.locator('.doc-list li');
    const count = await myDocs.count();

    for (let i = 0; i < count; i++) {
      await expect(myDocs.nth(i)).toContainText('uploaded by user');
    }

    // Step 6: Logout
    await page.click('button:has-text("Log out")');
    await expect(page).toHaveURL('/login');
  });

  test('switching between user and admin roles', async ({ page }) => {
    // Login as user first
    await page.goto('/login');
    await page.click('button:has-text("Login as User")');
    await expect(page.locator('p')).toContainText('You are logged in as: user');

    // Logout
    await page.click('button:has-text("Log out")');
    await expect(page).toHaveURL('/login');

    // Login as admin
    await page.click('button:has-text("Login as Admin")');
    await expect(page.locator('p')).toContainText('You are logged in as: admin');

    // Admin should see delete buttons
    await expect(page.locator('button:has-text("Delete")')).toBeVisible();

    // Logout again
    await page.click('button:has-text("Log out")');
    await expect(page).toHaveURL('/login');
  });
});
