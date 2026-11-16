/**
 * Helpdesk module setup tests.
 *
 * Both checks are advisory (non-blocking):
 *   helpdesk: Someone assigned to each ticket category   (optional)
 *   helpdesk: Response and resolution targets (SLA)       (optional)
 *
 * So the module is always "Ready" from /setup's perspective.
 * Tests verify:
 *  - Both checks are marked optional.
 *  - Assigning a user to each Issue Type makes the assignees check pass.
 *  - Enabling the SLA makes the SLA check pass.
 *  - The module is never "Not ready".
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { SetupPage } from '../../pages/SetupPage';
import { hrmsConfig } from '../../config';
import { listDocs, updateDoc } from '../../helpers/frappe-api';

const SECTION = 'Helpdesk';

async function loginAdmin(page: import('@playwright/test').Page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(hrmsConfig.credentials.username, hrmsConfig.credentials.password);
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });
}

test.describe('Helpdesk module — setup checks', () => {
  test('Helpdesk section is never Not ready (no blocking checks)', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    const notReady = await setupPage.isSectionNotReady(SECTION);
    expect(notReady, 'Helpdesk must never show "Not ready"').toBe(false);
  });

  test('Ticket category assignees check is advisory', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();
    const isOpt = await setupPage.isCheckOptional(SECTION, 'Someone assigned to each ticket category');
    expect(isOpt).toBe(true);
  });

  test('SLA check is advisory', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();
    const isOpt = await setupPage.isCheckOptional(SECTION, 'Response and resolution targets (SLA)');
    expect(isOpt).toBe(true);
  });

  test('Assignees check passes when every active Issue Type has an assignee', async ({ page }) => {
    await loginAdmin(page);

    // Assign the Administrator user to every unassigned Issue Type.
    const issueTypes = await listDocs(
      page,
      'Issue Type',
      { custom_is_archived: ['in', [0, '']] },
      ['name', 'custom_assign_to']
    );
    for (const it of issueTypes as Array<{ name: string; custom_assign_to: string }>) {
      if (!it.custom_assign_to) {
        await updateDoc(page, 'Issue Type', it.name, { custom_assign_to: 'Administrator' });
      }
    }

    const setupPage = new SetupPage(page);
    await setupPage.goto();
    await setupPage.expectCheckOk(SECTION, 'Someone assigned to each ticket category');
  });

  test('SLA check passes when the helpdesk SLA is enabled', async ({ page }) => {
    await loginAdmin(page);

    // The check looks for a Service Level Agreement with service_level = "HR Helpdesk SLA" and enabled=1.
    const SLA_NAME = 'HR Helpdesk SLA';
    const slas = await listDocs(
      page,
      'Service Level Agreement',
      { service_level: SLA_NAME },
      ['name', 'enabled']
    );
    for (const sla of slas as Array<{ name: string; enabled: number }>) {
      if (!sla.enabled) {
        await updateDoc(page, 'Service Level Agreement', sla.name, { enabled: 1 });
      }
    }

    const setupPage = new SetupPage(page);
    await setupPage.goto();
    await setupPage.expectCheckOk(SECTION, 'Response and resolution targets (SLA)');
  });

  test('Fix URL for assignees check points to /helpdesk', async ({ page }) => {
    await loginAdmin(page);

    // Clear assignees on all issue types to force the check to fail.
    const issueTypes = await listDocs(page, 'Issue Type', {}, ['name']);
    for (const it of issueTypes as Array<{ name: string }>) {
      await updateDoc(page, 'Issue Type', it.name, { custom_assign_to: '' });
    }

    const setupPage = new SetupPage(page);
    await setupPage.goto();
    const fixUrl = await setupPage.checkFixUrl(SECTION, 'Someone assigned to each ticket category');
    expect(fixUrl).toBe('/helpdesk');

    // Restore.
    for (const it of issueTypes as Array<{ name: string }>) {
      await updateDoc(page, 'Issue Type', it.name, { custom_assign_to: 'Administrator' });
    }
  });
});
