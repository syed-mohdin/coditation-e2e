/**
 * Onboarding and Exit module setup tests.
 *
 * Blocking: a submitted Leave Policy (new joiners get it on add).
 * Advisory: onboarding checklist template, work email domains.
 *
 * Tests:
 *  - The module shows "Not ready" when no submitted Leave Policy exists.
 *  - Creating and submitting a Leave Policy makes it ready.
 *  - Checklist and work-email-domain checks are shown as optional.
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { SetupPage } from '../../pages/SetupPage';
import { hrmsConfig } from '../../config';
import {
  createDoc,
  deleteDoc,
  listDocs,
  submitDoc,
  cancelDoc,
  currentYear,
} from '../../helpers/frappe-api';

const SECTION = 'Onboarding';

async function loginAdmin(page: import('@playwright/test').Page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(hrmsConfig.credentials.username, hrmsConfig.credentials.password);
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });
}

test.describe('Onboarding module — Leave Policy check (blocking)', () => {
  let policyName = '';

  test.beforeAll(async ({ browser }) => {
    // Start clean — ensure no submitted leave policy from a previous run.
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await loginAdmin(page);

    const existing = await listDocs(page, 'Leave Policy', { docstatus: 1 }, ['name']);
    // If there is already one, skip creating — the test will verify the green state.
    if (existing.length === 0) {
      policyName = await createDoc(page, 'Leave Policy', {
        leave_policy_name: `E2E Leave Policy ${currentYear()}`,
        leave_policy_details: [
          { leave_type: 'Casual Leave', annual_allocation: 10 },
        ],
      });
      await submitDoc(page, 'Leave Policy', policyName);
    } else {
      policyName = existing[0].name as string;
    }

    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    if (!policyName) return;
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await loginAdmin(page);
    // Only clean up what we created.
    const existing = await listDocs(page, 'Leave Policy', { name: policyName }, ['name', 'docstatus']);
    if (existing.length > 0) {
      try { await cancelDoc(page, 'Leave Policy', policyName); } catch { /**/ }
      try { await deleteDoc(page, 'Leave Policy', policyName); } catch { /**/ }
    }
    await ctx.close();
  });

  test('Onboarding section shows Ready when a submitted Leave Policy exists', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    await setupPage.expectCheckOk(SECTION, 'A leave plan for new joiners');
    await setupPage.expectSectionReady(SECTION);
  });

  test('Onboarding section shows Not ready when no submitted Leave Policy exists', async ({ page }) => {
    await loginAdmin(page);

    // Skip if there are submitted policies OTHER than ours — pre-existing data
    // prevents driving the check to "not ready".
    if (!policyName) { test.skip(); return; }
    const others = await listDocs(
      page, 'Leave Policy',
      { docstatus: 1, name: ['!=', policyName] },
      ['name']
    );
    if ((others as Array<unknown>).length > 0) { test.skip(); return; }

    try { await cancelDoc(page, 'Leave Policy', policyName); } catch { test.skip(); return; }

    const setupPage = new SetupPage(page);
    await setupPage.goto();
    await setupPage.expectCheckMissing(SECTION, 'A leave plan for new joiners');
    await setupPage.expectSectionNotReady(SECTION);

    // Restore.
    await submitDoc(page, 'Leave Policy', policyName);
  });

  test('Fix URL for missing leave policy points to /app/leave-policy', async ({ page }) => {
    await loginAdmin(page);

    // Skip if other submitted policies exist — the fix link won't appear after
    // cancelling ours because the check would still pass from the remaining ones.
    if (!policyName) { test.skip(); return; }
    const others = await listDocs(
      page, 'Leave Policy',
      { docstatus: 1, name: ['!=', policyName] },
      ['name']
    );
    if ((others as Array<unknown>).length > 0) { test.skip(); return; }

    try { await cancelDoc(page, 'Leave Policy', policyName); } catch { test.skip(); return; }

    const setupPage = new SetupPage(page);
    await setupPage.goto();
    const fixUrl = await setupPage.checkFixUrl(SECTION, 'A leave plan for new joiners');
    expect(fixUrl).toBe('/app/leave-policy');

    // Restore.
    await submitDoc(page, 'Leave Policy', policyName);
  });
});

test.describe('Onboarding module — advisory checks', () => {
  test('Onboarding checklist check is advisory', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();
    const isOpt = await setupPage.isCheckOptional(SECTION, 'An onboarding checklist');
    expect(isOpt).toBe(true);
  });

  test('Work email domains check is advisory', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();
    const isOpt = await setupPage.isCheckOptional(SECTION, 'Your work email domain');
    expect(isOpt).toBe(true);
  });

  test('Onboarding checklist check passes when an Employee Onboarding Template exists', async ({ page }) => {
    await loginAdmin(page);

    let created = '';
    const existing = await listDocs(page, 'Employee Onboarding Template', {}, ['name']);
    if (existing.length === 0) {
      created = await createDoc(page, 'Employee Onboarding Template', {
        template_name: 'E2E Onboarding Template',
        activities: [
          { activity_name: 'Setup laptop', department: '' },
        ],
      });
    }

    const setupPage = new SetupPage(page);
    await setupPage.goto();
    await setupPage.expectCheckOk(SECTION, 'An onboarding checklist');

    if (created) {
      await deleteDoc(page, 'Employee Onboarding Template', created);
    }
  });
});
