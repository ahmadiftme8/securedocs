import { test, expect } from '@playwright/test';

// This test covers the login flow
test.describe('Login Flow', () => {

  test('should allow user to login as user', async ({ page }) => {
    // Go to the login page
    await page.goto('/login');

    // Check if login page elements are visible
    await expect(page.locator('h2')).toContainText('Select a role to log in');
    await expect(page.locator('button:has-text("Login as User")')).toBeVisible();
    await expect(page.locator('button:has-text("Login as Admin")')).toBeVisible();

    // Click the "Login as User" button
    await page.click('button:has-text("Login as User")');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');

    // Check if we're on the dashboard and see user-specific content
    await expect(page.locator('h1')).toContainText('Welcome to the Dashboard');
    await expect(page.locator('p')).toContainText('You are logged in as: user');
    await expect(page.locator('.info')).toContainText('You have user access. You can upload, but not delete documents.');
  });

  test('should allow user to login as admin', async ({ page }) => {
    await page.goto('/login');

    // Click the "Login as Admin" button
    await page.click('button:has-text("Login as Admin")');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');

    // Check admin-specific content
    await expect(page.locator('p')).toContainText('You are logged in as: admin');
    await expect(page.locator('.info')).toContainText('You have admin access. You can delete documents.');

    // Admin should see delete buttons for documents
    await expect(page.locator('button:has-text("Delete")')).toBeVisible();
  });
});
