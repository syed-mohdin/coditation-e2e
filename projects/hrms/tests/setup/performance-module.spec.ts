/**
 * Performance module setup tests.
 *
 * Performance has only one readiness check and it is advisory (non-blocking):
 *   performance: A goal timeframe covering today (optional)
 *
 * So the module has no blocking items — /setup shows it as "Ready · N to review"
 * rather than "Not ready".
 *
 * Tests verify:
 *  - The timeframe check appears as optional.
 *  - Creating an active timeframe makes the check pass.
 *  - The module shows the right state without a timeframe (ready but with pending optional).
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { SetupPage } from '../../pages/SetupPage';
import { hrmsConfig } from '../../config';
import {
  createDoc,
  deleteDoc,
  listDocs,
  today,
  offsetDate,
  currentYear,
} from '../../helpers/frappe-api';

const SECTION = 'Performance';

async function loginAdmin(page: import('@playwright/test').Page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(hrmsConfig.credentials.username, hrmsConfig.credentials.password);
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });
}

test.describe('Performance module — setup checks', () => {
  test('Performance section is always Ready (no blocking checks)', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    // The section must NOT show the amber "Not ready" pill.
    const notReady = await setupPage.isSectionNotReady(SECTION);
    expect(notReady, 'Performance should never be "Not ready"').toBe(false);
  });

  test('Goal timeframe check is advisory (optional)', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    const isOptional = await setupPage.isCheckOptional(SECTION, 'A goal timeframe covering today');
    expect(isOptional).toBe(true);
  });

  test('Goal timeframe check passes when an active timeframe covers today', async ({ page }) => {
    await loginAdmin(page);

    // Create an active timeframe covering today if none exists.
    const existing = await listDocs(
      page,
      'Goal Timeframe',
      { status: 'Active', start_date: ['<=', today()], end_date: ['>=', today()] },
      ['name']
    );
    let created = '';
    if (existing.length === 0) {
      created = await createDoc(page, 'Goal Timeframe', {
        timeframe_name: `E2E FY ${currentYear()}`,
        status: 'Active',
        start_date: `${currentYear()}-04-01`,
        end_date: `${parseInt(currentYear()) + 1}-03-31`,
      });
    }

    const setupPage = new SetupPage(page);
    await setupPage.goto();
    await setupPage.expectCheckOk(SECTION, 'A goal timeframe covering today');

    if (created) {
      await deleteDoc(page, 'Goal Timeframe', created);
    }
  });

  test('Fix URL for missing goal timeframe points to /app/goal-timeframe', async ({ page }) => {
    await loginAdmin(page);

    // Delete any active timeframe temporarily to expose the fix link.
    const existing = await listDocs(
      page,
      'Goal Timeframe',
      { status: 'Active', start_date: ['<=', today()], end_date: ['>=', today()] },
      ['name']
    );
    const deleted: string[] = [];
    for (const tf of existing as Array<{ name: string }>) {
      await deleteDoc(page, 'Goal Timeframe', tf.name);
      deleted.push(tf.name);
    }

    const setupPage = new SetupPage(page);
    await setupPage.goto();
    const fixUrl = await setupPage.checkFixUrl(SECTION, 'A goal timeframe covering today');
    expect(fixUrl).toBe('/app/goal-timeframe');

    // Restore.
    for (const name of deleted) {
      try {
        await createDoc(page, 'Goal Timeframe', {
          name,
          timeframe_name: name,
          status: 'Active',
          start_date: `${currentYear()}-04-01`,
          end_date: `${parseInt(currentYear()) + 1}-03-31`,
        });
      } catch { /**/ }
    }
  });
});
