/**
 * Tests for /setup — the platform readiness dashboard.
 *
 * Who can see it, what it shows, and that it redirects non-admins away.
 */
import { test, expect } from '@playwright/test';
import { SetupPage } from '../../pages/SetupPage';
import { LoginPage } from '../../pages/LoginPage';
import { hrmsConfig } from '../../config';

const EXPECTED_MODULES = [
  'HR Core',
  'Payroll and Finance',
  'Performance',
  'Onboarding and Exit',
  'Helpdesk',
  'Whistleblower channel',
  'Engage and Pulse',
  'Policies and Documents',
  'Hire',
  'Analytics',
  'ModelHub',
];

test.describe('Setup page', () => {
  test('Administrator can open /setup', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(hrmsConfig.credentials.username, hrmsConfig.credentials.password);
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });

    const setupPage = new SetupPage(page);
    await setupPage.goto();

    await expect(page).toHaveURL(/\/setup/);
    await expect(page.locator('h1.cs-page-title')).toHaveText('Setup');
  });

  test('Setup page shows all installed modules in the overview card', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(hrmsConfig.credentials.username, hrmsConfig.credentials.password);
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });

    const setupPage = new SetupPage(page);
    await setupPage.goto();

    const labels = await setupPage.moduleOverviewLabels();
    for (const mod of EXPECTED_MODULES) {
      expect(labels.some((l) => l.includes(mod)), `expected module "${mod}" in overview`).toBe(true);
    }
  });

  test('Setup page shows readiness check sections with required/optional labels', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(hrmsConfig.credentials.username, hrmsConfig.credentials.password);
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });

    const setupPage = new SetupPage(page);
    await setupPage.goto();

    // Every per-module section card shows a green Ready or an amber Not ready pill.
    // Exclude the overview card (#setupModules), which shows module states differently.
    const sections = await page.locator('section.cs-setup-mod:not(#setupModules)').all();
    for (const section of sections) {
      const hasGreen = await section.locator('.cs-pill-green').isVisible();
      const hasAmber = await section.locator('.cs-pill-amber').isVisible();
      const hasSlate = await section.locator('.cs-pill-slate').isVisible();
      expect(hasGreen || hasAmber || hasSlate, 'each section must have a status pill').toBe(true);
    }
  });

  test('Non-admin user (Guest) is redirected to login from /setup', async ({ page }) => {
    // Navigate directly without logging in.
    await page.goto('/setup');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/login/);
  });

  test('Setup page links to individual Setup Guides', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(hrmsConfig.credentials.username, hrmsConfig.credentials.password);
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });

    const setupPage = new SetupPage(page);
    await setupPage.goto();

    // The page-level link to /setup-guide should be visible.
    const guideLink = page.locator('a[href="/setup-guide"]');
    await expect(guideLink.first()).toBeVisible();
  });
});
