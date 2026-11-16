/**
 * Whistleblower channel module setup tests.
 *
 * All eight required checks are blocking:
 *   enabled       - A company is set up for the channel
 *   handlers      - A committee member, case manager and independent handler are assigned
 *   grants        - Every Ethics role is held through an authorised grant
 *   configuration - Reporting options, categories and workflow are valid
 *   policy        - Deadlines and policy text are set and reviewed
 *   retention     - A retention policy is approved
 *   safeguards    - Rate limit and audit trail are in place
 *   keys          - The content encryption key is present and matches the data
 *
 * Three advisory (non-blocking) checks:
 *   log_hardening - Log hardening for the public form is attested
 *   backups       - Backups are encrypted and protected
 *   web_logger    - Frappe's web request logger is off
 *
 * Fix URL for all checks: /app/ethics-settings
 *
 * Tests:
 *  - Section appears on /setup.
 *  - Advisory checks are marked optional.
 *  - Blocking checks are NOT marked optional.
 *  - Section shows Not ready when no company has the channel enabled.
 *  - Creating an enabled Ethics Settings makes the "enabled" check pass.
 *  - All fix URLs point to /app/ethics-settings.
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { SetupPage } from '../../pages/SetupPage';
import { hrmsConfig } from '../../config';
import { createDoc, updateDoc, deleteDoc, listDocs } from '../../helpers/frappe-api';

const SECTION = 'Whistleblower channel';
const COMPANY = 'Coditation';
const FIX_URL = '/app/ethics-settings';

async function loginAdmin(page: import('@playwright/test').Page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(hrmsConfig.credentials.username, hrmsConfig.credentials.password);
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });
}

test.describe('Whistleblower channel — section visibility', () => {
  test('Whistleblower channel section appears on /setup', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    const section = page
      .locator('section.cs-setup-mod')
      .filter({ has: page.locator('.cs-card-title', { hasText: SECTION }) })
      .first();
    await expect(section).toBeVisible({ timeout: 10_000 });
  });

  test('Whistleblower channel section has a status pill (ready, slate, or not ready)', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    const section = page
      .locator('section.cs-setup-mod')
      .filter({ has: page.locator('.cs-card-title', { hasText: SECTION }) })
      .first();
    await section.waitFor({ state: 'visible', timeout: 10_000 });

    const hasGreen = await section.locator('.cs-pill-green').isVisible();
    const hasSlate = await section.locator('.cs-pill-slate').isVisible();
    const hasAmber = await section.locator('.cs-pill-amber').isVisible();
    expect(hasGreen || hasSlate || hasAmber, 'section must have a status pill').toBe(true);
  });
});

test.describe('Whistleblower channel — check classification', () => {
  test('Advisory check: log hardening is marked optional', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();
    const isOpt = await setupPage.isCheckOptional(SECTION, 'Log hardening for the public form is attested');
    expect(isOpt).toBe(true);
  });

  test('Advisory check: backups is marked optional', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();
    const isOpt = await setupPage.isCheckOptional(SECTION, 'Backups are encrypted and protected');
    expect(isOpt).toBe(true);
  });

  test('Advisory check: web request logger is marked optional', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();
    const isOpt = await setupPage.isCheckOptional(SECTION, "Frappe's web request logger is off");
    expect(isOpt).toBe(true);
  });

  test('Blocking check: enabled company is NOT marked optional', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();
    const isOpt = await setupPage.isCheckOptional(SECTION, 'A company is set up for the channel');
    expect(isOpt).toBe(false);
  });

  test('Blocking check: handlers assigned is NOT marked optional', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();
    const isOpt = await setupPage.isCheckOptional(
      SECTION, 'A committee member, case manager and independent handler are assigned'
    );
    expect(isOpt).toBe(false);
  });

  test('Blocking check: role grants is NOT marked optional', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();
    const isOpt = await setupPage.isCheckOptional(SECTION, 'Every Ethics role is held through an authorised grant');
    expect(isOpt).toBe(false);
  });

  test('Blocking check: configuration valid is NOT marked optional', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();
    const isOpt = await setupPage.isCheckOptional(SECTION, 'Reporting options, categories and workflow are valid');
    expect(isOpt).toBe(false);
  });

  test('Blocking check: policy reviewed is NOT marked optional', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();
    const isOpt = await setupPage.isCheckOptional(SECTION, 'Deadlines and policy text are set and reviewed');
    expect(isOpt).toBe(false);
  });

  test('Blocking check: retention policy is NOT marked optional', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();
    const isOpt = await setupPage.isCheckOptional(SECTION, 'A retention policy is approved');
    expect(isOpt).toBe(false);
  });

  test('Blocking check: safeguards is NOT marked optional', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();
    const isOpt = await setupPage.isCheckOptional(SECTION, 'Rate limit and audit trail are in place');
    expect(isOpt).toBe(false);
  });

  test('Blocking check: encryption key is NOT marked optional', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();
    const isOpt = await setupPage.isCheckOptional(SECTION, 'The content encryption key is present and matches the data');
    expect(isOpt).toBe(false);
  });
});

test.describe('Whistleblower channel — enabled check', () => {
  let createdSettings = '';

  test.afterAll(async ({ browser }) => {
    if (!createdSettings) return;
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await loginAdmin(page);
    try { await deleteDoc(page, 'Ethics Settings', createdSettings); } catch { /**/ }
    await ctx.close();
  });

  test('Enabled check passes when an Ethics Settings record exists with enabled=1', async ({ page }) => {
    await loginAdmin(page);

    // Check if already enabled for this company.
    const existing = await listDocs(page, 'Ethics Settings', { name: COMPANY }, ['name', 'enabled']);
    if ((existing as Array<{ name: string; enabled: number }>).length > 0) {
      const rec = (existing as Array<{ name: string; enabled: number }>)[0];
      if (!rec.enabled) {
        await updateDoc(page, 'Ethics Settings', COMPANY, { enabled: 1 });
      }
      // Settings already exist for this company, use them.
    } else {
      createdSettings = await createDoc(page, 'Ethics Settings', {
        company: COMPANY,
        enabled: 1,
      });
    }

    const setupPage = new SetupPage(page);
    await setupPage.goto();
    await setupPage.expectCheckOk(SECTION, 'A company is set up for the channel');
  });

  test('Section shows Not ready when no company has enabled=1', async ({ page }) => {
    await loginAdmin(page);

    // Skip if other companies (not COMPANY) also have enabled Ethics Settings.
    const others = await listDocs(page, 'Ethics Settings', { enabled: 1 }, ['name']);
    const otherCompanies = (others as Array<{ name: string }>).filter((r) => r.name !== COMPANY);
    if (otherCompanies.length > 0) { test.skip(); return; }

    // Temporarily disable for COMPANY.
    const existing = await listDocs(page, 'Ethics Settings', { name: COMPANY }, ['name', 'enabled']);
    const wasEnabled = (existing as Array<{ name: string; enabled: number }>).length > 0
      && (existing[0] as { enabled: number }).enabled;

    if (!wasEnabled && !createdSettings) {
      // No enabled settings exist — the check is already failing.
      const setupPage = new SetupPage(page);
      await setupPage.goto();
      await setupPage.expectCheckMissing(SECTION, 'A company is set up for the channel');
      await setupPage.expectSectionNotReady(SECTION);
      return;
    }

    // Disable it temporarily.
    await updateDoc(page, 'Ethics Settings', COMPANY, { enabled: 0 });

    const setupPage = new SetupPage(page);
    await setupPage.goto();
    await setupPage.expectCheckMissing(SECTION, 'A company is set up for the channel');
    await setupPage.expectSectionNotReady(SECTION);

    // Restore.
    await updateDoc(page, 'Ethics Settings', COMPANY, { enabled: 1 });
  });
});

test.describe('Whistleblower channel — fix URLs', () => {
  test('Fix URL for the enabled check points to /app/ethics-settings', async ({ page }) => {
    await loginAdmin(page);

    // The fix link only appears when the check is failing.
    // Skip if no Ethics Settings exist for COMPANY (no settings = check already failing).
    const existing = await listDocs(page, 'Ethics Settings', { name: COMPANY, enabled: 1 }, ['name']);
    if ((existing as Array<unknown>).length > 0) {
      // Temporarily disable so the fix link appears.
      await updateDoc(page, 'Ethics Settings', COMPANY, { enabled: 0 });

      // Also skip if other companies are still enabled.
      const others = await listDocs(page, 'Ethics Settings', { enabled: 1 }, ['name']);
      if ((others as Array<unknown>).length > 0) {
        await updateDoc(page, 'Ethics Settings', COMPANY, { enabled: 1 });
        test.skip(); return;
      }
    }

    const setupPage = new SetupPage(page);
    await setupPage.goto();
    const fixUrl = await setupPage.checkFixUrl(SECTION, 'A company is set up for the channel');
    expect(fixUrl).toBe(FIX_URL);

    // Restore.
    const existing2 = await listDocs(page, 'Ethics Settings', { name: COMPANY }, ['name']);
    if ((existing2 as Array<unknown>).length > 0) {
      await updateDoc(page, 'Ethics Settings', COMPANY, { enabled: 1 });
    }
  });

  test('Fix URL for the handlers check points to /app/ethics-settings', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    // The handlers check fails unless all three handler types are assigned.
    // Check if it is currently failing — if so, verify the fix URL.
    const isOk = await setupPage.isCheckOk(SECTION, 'A committee member, case manager and independent handler are assigned');
    if (isOk) { test.skip(); return; }

    const fixUrl = await setupPage.checkFixUrl(
      SECTION, 'A committee member, case manager and independent handler are assigned'
    );
    expect(fixUrl).toBe(FIX_URL);
  });

  test('Fix URL for the encryption key check points to /app/ethics-settings', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    // The keys check fails unless the ETHICS_CONTENT_KEY env var is set server-side.
    // On a standard dev bench without the env var, this check always fails.
    const isOk = await setupPage.isCheckOk(
      SECTION, 'The content encryption key is present and matches the data'
    );
    if (isOk) { test.skip(); return; }

    const fixUrl = await setupPage.checkFixUrl(
      SECTION, 'The content encryption key is present and matches the data'
    );
    expect(fixUrl).toBe(FIX_URL);
  });
});
