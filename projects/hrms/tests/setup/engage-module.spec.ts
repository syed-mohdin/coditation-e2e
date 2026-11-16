/**
 * Engage and Pulse module setup tests.
 *
 * One blocking check:
 *   pulse: At least one pulse metric enabled (required)
 *
 * Tests:
 *  - Module shows "Not ready" when no enabled pulse metrics exist.
 *  - Enabling a pulse metric makes the module ready.
 *  - Fix URL points to /app/pulse-metric.
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { SetupPage } from '../../pages/SetupPage';
import { hrmsConfig } from '../../config';
import { listDocs, updateDoc, createDoc, deleteDoc } from '../../helpers/frappe-api';

const SECTION = 'Pulse surveys';

async function loginAdmin(page: import('@playwright/test').Page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(hrmsConfig.credentials.username, hrmsConfig.credentials.password);
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });
}

test.describe('Engage and Pulse — Pulse metric check', () => {
  test('Pulse surveys section shows Ready when at least one metric is enabled', async ({ page }) => {
    await loginAdmin(page);

    // Ensure at least one metric is enabled.
    const metrics = await listDocs(page, 'Pulse Metric', {}, ['name', 'enabled']);
    let enabledCount = (metrics as Array<{ enabled: number }>).filter((m) => m.enabled).length;
    if (enabledCount === 0 && metrics.length > 0) {
      await updateDoc(page, 'Pulse Metric', (metrics[0] as { name: string }).name, { enabled: 1 });
      enabledCount = 1;
    }
    if (enabledCount === 0) {
      // No metrics at all — create one.
      await createDoc(page, 'Pulse Metric', {
        metric_name: 'E2E Overall Mood',
        question: 'How are you feeling today?',
        enabled: 1,
      });
    }

    const setupPage = new SetupPage(page);
    await setupPage.goto();
    await setupPage.expectCheckOk(SECTION, 'At least one pulse metric enabled');
    await setupPage.expectSectionReady(SECTION);
  });

  test('Pulse surveys section shows Not ready when all metrics are disabled', async ({ page }) => {
    await loginAdmin(page);

    const metrics = await listDocs(page, 'Pulse Metric', {}, ['name', 'enabled']);
    // Disable all metrics.
    for (const m of metrics as Array<{ name: string; enabled: number }>) {
      if (m.enabled) {
        await updateDoc(page, 'Pulse Metric', m.name, { enabled: 0 });
      }
    }

    const setupPage = new SetupPage(page);
    await setupPage.goto();
    await setupPage.expectCheckMissing(SECTION, 'At least one pulse metric enabled');
    await setupPage.expectSectionNotReady(SECTION);

    // Re-enable the first metric.
    if (metrics.length > 0) {
      await updateDoc(page, 'Pulse Metric', (metrics[0] as { name: string }).name, { enabled: 1 });
    }
  });

  test('Fix URL for missing pulse metric points to /app/pulse-metric', async ({ page }) => {
    await loginAdmin(page);

    // Disable all.
    const metrics = await listDocs(page, 'Pulse Metric', {}, ['name', 'enabled']);
    for (const m of metrics as Array<{ name: string; enabled: number }>) {
      if (m.enabled) {
        await updateDoc(page, 'Pulse Metric', m.name, { enabled: 0 });
      }
    }

    const setupPage = new SetupPage(page);
    await setupPage.goto();
    const fixUrl = await setupPage.checkFixUrl(SECTION, 'At least one pulse metric enabled');
    expect(fixUrl).toBe('/app/pulse-metric');

    // Restore.
    if (metrics.length > 0) {
      await updateDoc(page, 'Pulse Metric', (metrics[0] as { name: string }).name, { enabled: 1 });
    }
  });

  test('Detail text shows count of enabled metrics when check passes', async ({ page }) => {
    await loginAdmin(page);

    const metrics = await listDocs(page, 'Pulse Metric', { enabled: 1 }, ['name']);
    if (metrics.length === 0) {
      await updateDoc(
        page,
        'Pulse Metric',
        ((await listDocs(page, 'Pulse Metric', {}, ['name']))[0] as { name: string }).name,
        { enabled: 1 }
      );
    }

    const setupPage = new SetupPage(page);
    await setupPage.goto();

    const section = page
      .locator('section.cs-setup-mod')
      .filter({ has: page.locator('.cs-card-title', { hasText: SECTION }) })
      .first();
    const row = section
      .locator('.cs-setup-item')
      .filter({ hasText: 'At least one pulse metric enabled' })
      .first();
    const detail = row.locator('.cs-setup-detail');
    // Detail shows "{n} enabled" when the check passes.
    await expect(detail).toHaveText(/\d+ enabled/, { timeout: 5_000 });
  });
});
