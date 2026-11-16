/**
 * Policies and Documents module setup tests.
 *
 * Both checks are advisory (non-blocking):
 *   policies:  Your policies, published     (optional)
 *   documents: Your letterhead              (optional)
 *
 * So the module is always "Ready" from /setup's perspective.
 * Tests verify:
 *  - Both checks are shown as optional.
 *  - Publishing a Company Policy makes the policies check pass.
 *  - Creating a default Letter Head makes the letterhead check pass.
 *  - Fix URLs are correct.
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { SetupPage } from '../../pages/SetupPage';
import { hrmsConfig } from '../../config';
import { createDoc, updateDoc, deleteDoc, listDocs } from '../../helpers/frappe-api';

const SECTION_POLICIES = 'Policies';
const SECTION_DOCS = 'HR documents';

async function loginAdmin(page: import('@playwright/test').Page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(hrmsConfig.credentials.username, hrmsConfig.credentials.password);
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });
}

test.describe('Policies module — advisory checks', () => {
  test('Policies section is never Not ready', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    const notReady = await setupPage.isSectionNotReady(SECTION_POLICIES);
    expect(notReady, 'Policies should never be "Not ready"').toBe(false);
  });

  test('"Your policies, published" check is advisory', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();
    const isOpt = await setupPage.isCheckOptional(SECTION_POLICIES, 'Your policies, published');
    expect(isOpt).toBe(true);
  });

  test('Policies check passes when at least one policy is published', async ({ page }) => {
    await loginAdmin(page);

    let created = '';
    const existing = await listDocs(page, 'Company Policy', { status: 'Published' }, ['name']);
    if (existing.length === 0) {
      created = await createDoc(page, 'Company Policy', {
        title: 'E2E Code of Conduct',
        category: '',
        status: 'Published',
        content: '<p>This is a test policy.</p>',
      });
    }

    const setupPage = new SetupPage(page);
    await setupPage.goto();
    await setupPage.expectCheckOk(SECTION_POLICIES, 'Your policies, published');

    if (created) {
      // Unpublish then delete.
      await updateDoc(page, 'Company Policy', created, { status: 'Draft' });
      await deleteDoc(page, 'Company Policy', created);
    }
  });

  test('Fix URL for policies check points to /app/company-policy', async ({ page }) => {
    await loginAdmin(page);

    // Unpublish any published policies.
    const published = await listDocs(page, 'Company Policy', { status: 'Published' }, ['name']);
    for (const p of published as Array<{ name: string }>) {
      await updateDoc(page, 'Company Policy', p.name, { status: 'Draft' });
    }

    const setupPage = new SetupPage(page);
    await setupPage.goto();
    const fixUrl = await setupPage.checkFixUrl(SECTION_POLICIES, 'Your policies, published');
    expect(fixUrl).toBe('/app/company-policy');

    // Restore.
    for (const p of published as Array<{ name: string }>) {
      await updateDoc(page, 'Company Policy', p.name, { status: 'Published' });
    }
  });
});

test.describe('HR Documents module — advisory checks', () => {
  test('HR documents section is never Not ready', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    const notReady = await setupPage.isSectionNotReady(SECTION_DOCS);
    expect(notReady, 'HR documents should never be "Not ready"').toBe(false);
  });

  test('"Your letterhead" check is advisory', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();
    const isOpt = await setupPage.isCheckOptional(SECTION_DOCS, 'Your letterhead');
    expect(isOpt).toBe(true);
  });

  test('Letterhead check passes when a default non-disabled Letter Head exists', async ({ page }) => {
    await loginAdmin(page);

    let created = '';
    const existing = await listDocs(page, 'Letter Head', { is_default: 1, disabled: 0 }, ['name']);
    if (existing.length === 0) {
      created = await createDoc(page, 'Letter Head', {
        letter_head_name: 'E2E Company Letterhead',
        is_default: 1,
        disabled: 0,
        content: '<div><strong>Coditation</strong></div>',
      });
    }

    const setupPage = new SetupPage(page);
    await setupPage.goto();
    await setupPage.expectCheckOk(SECTION_DOCS, 'Your letterhead');

    if (created) {
      await updateDoc(page, 'Letter Head', created, { is_default: 0 });
      await deleteDoc(page, 'Letter Head', created);
    }
  });

  test('Fix URL for letterhead check points to /app/letter-head', async ({ page }) => {
    await loginAdmin(page);

    // Disable any default letter head to expose the fix link.
    const existing = await listDocs(page, 'Letter Head', { is_default: 1, disabled: 0 }, ['name']);
    for (const lh of existing as Array<{ name: string }>) {
      await updateDoc(page, 'Letter Head', lh.name, { is_default: 0 });
    }

    const setupPage = new SetupPage(page);
    await setupPage.goto();
    const fixUrl = await setupPage.checkFixUrl(SECTION_DOCS, 'Your letterhead');
    expect(fixUrl).toBe('/app/letter-head');

    // Restore.
    for (const lh of existing as Array<{ name: string }>) {
      await updateDoc(page, 'Letter Head', lh.name, { is_default: 1 });
    }
  });
});
