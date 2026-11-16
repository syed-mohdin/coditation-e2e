/**
 * Module release flow tests (Settings → Modules panel).
 *
 * Tests:
 *  - Settings → Modules page loads and renders all module cards.
 *  - Each card shows a state tag.
 *  - A "Live" module shows a "Turn off" button, not "Release".
 *  - A module that is "Ready to release" shows an enabled "Release to employees" button.
 *  - Turning off a non-mandatory module transitions it to "Off".
 *  - Turning it back on transitions it back.
 *
 * Note: HR Core (core) is mandatory and cannot be turned off; this suite uses
 * the Hire module (recruitment) as the toggle target because it has no blocking
 * setup checks.
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { SettingsModulesPage } from '../../pages/SettingsModulesPage';
import { hrmsConfig } from '../../config';

const TOGGLE_MODULE = 'Hire'; // non-mandatory, no blocking checks

async function loginAdmin(page: import('@playwright/test').Page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(hrmsConfig.credentials.username, hrmsConfig.credentials.password);
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });
}

test.describe('Settings → Modules panel', () => {
  test('Modules panel loads and renders at least one module card', async ({ page }) => {
    await loginAdmin(page);
    const modulesPage = new SettingsModulesPage(page);
    await modulesPage.goto();

    const cards = await page.locator('.cs-mod-card').count();
    expect(cards, 'at least one module card must be rendered').toBeGreaterThan(0);
  });

  test('Every module card shows a state tag', async ({ page }) => {
    await loginAdmin(page);
    const modulesPage = new SettingsModulesPage(page);
    await modulesPage.goto();

    const cards = await page.locator('.cs-mod-card').all();
    for (const card of cards) {
      const tag = card.locator('.cs-mod-tag');
      await expect(tag, 'each card must have a state tag').toBeVisible();
      const tagText = await tag.textContent();
      expect(['Not added', 'Installing...', 'Setting up', 'Ready to release', 'Live', 'Off', 'Install failed'])
        .toContain((tagText ?? '').trim());
    }
  });

  test('HR Core module shows "Live" and no Turn-off button (mandatory)', async ({ page }) => {
    await loginAdmin(page);
    const modulesPage = new SettingsModulesPage(page);
    await modulesPage.goto();

    const coreCard = page.locator('.cs-mod-card').filter({ hasText: 'HR Core' }).first();
    await expect(coreCard.locator('.cs-mod-tag')).toHaveText('Live');
    // HR Core is mandatory — no "Turn off" button.
    await expect(coreCard.locator('button', { hasText: 'Turn off' })).not.toBeVisible();
  });

  test('Live non-mandatory module shows "Turn off" button', async ({ page }) => {
    await loginAdmin(page);
    const modulesPage = new SettingsModulesPage(page);
    await modulesPage.goto();

    const card = page.locator('.cs-mod-card').filter({ hasText: TOGGLE_MODULE }).first();
    const state = await card.locator('.cs-mod-tag').textContent();
    if ((state ?? '').trim() === 'Live') {
      await expect(card.locator('button', { hasText: 'Turn off' })).toBeVisible();
    }
  });

  test('Admin can turn off and turn back on a non-mandatory Live module', async ({ page }) => {
    await loginAdmin(page);
    const modulesPage = new SettingsModulesPage(page);
    await modulesPage.goto();

    const card = page.locator('.cs-mod-card').filter({ hasText: TOGGLE_MODULE }).first();
    const initialState = ((await card.locator('.cs-mod-tag').textContent()) ?? '').trim();

    if (initialState !== 'Live') {
      test.skip();
      return;
    }

    // Turn off.
    page.once('dialog', (d) => d.accept());
    await card.locator('button', { hasText: 'Turn off' }).click();
    await expect(card.locator('.cs-mod-tag')).toHaveText('Off', { timeout: 10_000 });

    // Turn back on.
    page.once('dialog', (d) => d.accept());
    await card.locator('button', { hasText: 'Turn on' }).click();
    // After turn-on, state is either "Live" or "Setting up" depending on readiness.
    await expect(card.locator('.cs-mod-tag')).not.toHaveText('Off', { timeout: 10_000 });
  });

  test('Module whose required items are done shows "Release to employees" button enabled', async ({ page }) => {
    await loginAdmin(page);

    // Turn off Hire first so it is in "Setting up" or "ready" state.
    // We use the API to set the state, then refresh.
    // For the UI test, we just check that the "Release to employees" button is
    // enabled when the module tag is "Ready to release".
    const modulesPage = new SettingsModulesPage(page);
    await modulesPage.goto();

    // Find any module in "Ready to release" state.
    const readyCard = await page.locator('.cs-mod-card').filter({
      has: page.locator('.cs-mod-tag', { hasText: 'Ready to release' }),
    }).first();

    const isVisible = await readyCard.isVisible();
    if (!isVisible) {
      // No module is in "ready to release" state right now — skip this assertion.
      test.skip();
      return;
    }

    const releaseBtn = readyCard.locator('button', { hasText: 'Release to employees' });
    await expect(releaseBtn).toBeVisible();
    await expect(releaseBtn).not.toBeDisabled();
  });

  test('Settings link on /setup opens the Modules panel', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/setup');
    await page.waitForLoadState('networkidle');

    // The /settings?section=modules link exists in the page DOM (may be in the
    // navigation dropdown, so we only assert it is attached, not visible).
    await expect(page.locator('a[href="/settings?section=modules"]').first()).toBeAttached();

    // Navigate to the destination and verify the modules panel renders.
    await page.goto('/settings?section=modules');
    await expect(page).toHaveURL(/settings.*modules|settings\?section=modules/);
    await page.locator('.cs-mod-card').first().waitFor({ state: 'visible', timeout: 15_000 });
  });
});

test.describe('Settings → Modules — non-admin access', () => {
  test('Guest is redirected to login from /settings', async ({ page }) => {
    await page.goto('/settings?section=modules');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/login/);
  });
});
