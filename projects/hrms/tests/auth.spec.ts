import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { hrmsConfig } from '../config';

test.describe('HRMS Authentication', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login(hrmsConfig.credentials.username, hrmsConfig.credentials.password);

    // After login, Frappe redirects away from /login (to launchpad or /apps)
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('should remain on login page with invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login('wrong@example.com', 'wrongpassword');

    // Frappe keeps the user on the login page after a failed attempt
    await loginPage.expectLoginError();
  });

  test('should logout and return to unauthenticated state', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(hrmsConfig.credentials.username, hrmsConfig.credentials.password);
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });

    // Frappe logout: /?cmd=web_logout lands on a "Logged Out" page, then JS redirects to /login
    await page.goto('/?cmd=web_logout');
    await page.waitForLoadState('networkidle');

    // After logout the user is either on /login or on the "Logged Out" page — either way,
    // they cannot access a protected route: navigating there should redirect back to /login.
    await page.goto('/me');
    await expect(page).toHaveURL(/\/login/);
  });
});
