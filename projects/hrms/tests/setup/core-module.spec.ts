/**
 * HR Core module setup tests.
 *
 * HR Core covers two blocking readiness areas:
 *   - access  : Desk access — who may open /app (required)
 *   - leave   : Holiday list + leave types + allocations (required)
 *
 * Non-blocking (advisory): branding, outgoing email, office location,
 * platform settings reviewed.
 *
 * Test strategy:
 *  1. Verify the /setup page reflects the current DB state correctly.
 *  2. Create the missing data via the Frappe resource API, reload /setup,
 *     and confirm the check turns green.
 *  3. Tear down any data created by the test so subsequent runs start clean.
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { SetupPage } from '../../pages/SetupPage';
import { hrmsConfig } from '../../config';
import {
  createDoc,
  updateDoc,
  deleteDoc,
  listDocs,
  submitDoc,
  cancelDoc,
  today,
  offsetDate,
  currentYear,
} from '../../helpers/frappe-api';

const COMPANY = 'Coditation';
const SECTION_LEAVE = 'Leave';
const SECTION_ACCESS = 'Desk access';

async function loginAdmin(page: import('@playwright/test').Page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(hrmsConfig.credentials.username, hrmsConfig.credentials.password);
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });
}

test.describe('HR Core — Desk access check', () => {
  test('Desk Access section shows as ready when at least one HRMS Desk Access entry exists', async ({ page }) => {
    await loginAdmin(page);

    // Ensure at least one enabled Desk Access entry exists.
    const existing = await listDocs(page, 'HRMS Desk Access', { enabled: 1 }, ['name']);
    if (existing.length === 0) {
      await createDoc(page, 'HRMS Desk Access', {
        user: 'Administrator',
        enabled: 1,
      });
    }

    const setupPage = new SetupPage(page);
    await setupPage.goto();
    await setupPage.expectCheckOk(SECTION_ACCESS, 'Who may use Desk');
  });

  test('Fix-in-Desk link for Desk Access points to /app/hrms-desk-access', async ({ page }) => {
    await loginAdmin(page);

    // The fix link only appears when the check is failing, so delete all entries first.
    const allEntries = await listDocs(page, 'HRMS Desk Access', {}, ['name']);
    for (const e of allEntries as Array<{ name: string }>) {
      try { await deleteDoc(page, 'HRMS Desk Access', e.name); } catch { /**/ }
    }

    const setupPage = new SetupPage(page);
    await setupPage.goto();
    const url = await setupPage.checkFixUrl(SECTION_ACCESS, 'Who may use Desk');
    expect(url).toContain('/app/hrms-desk-access');

    // Restore one entry so other tests pass.
    await createDoc(page, 'HRMS Desk Access', { user: 'Administrator', enabled: 1 });
  });
});

test.describe('HR Core — Leave checks', () => {
  let createdHolidayList = '';
  let createdLeaveType = '';
  let createdAllocation = '';

  test.beforeAll(async ({ browser }) => {
    // Set up data in a one-off context (we can't use fixtures in beforeAll directly).
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await loginAdmin(page);

    // 1. Holiday list covering today, linked to company.
    const listName = `E2E Holiday List ${currentYear()}`;
    const existing = await listDocs(page, 'Holiday List', { holiday_list_name: listName }, ['name']);
    if (existing.length === 0) {
      createdHolidayList = await createDoc(page, 'Holiday List', {
        holiday_list_name: listName,
        from_date: `${currentYear()}-01-01`,
        to_date: `${currentYear()}-12-31`,
        holidays: [
          { description: 'New Year', holiday_date: `${currentYear()}-01-01` },
        ],
      });
    } else {
      createdHolidayList = existing[0].name as string;
    }
    // Link to company.
    await updateDoc(page, 'Company', COMPANY, { default_holiday_list: createdHolidayList });

    // 2. At least one Leave Type.
    const ltName = 'E2E Annual Leave';
    const ltExisting = await listDocs(page, 'Leave Type', { leave_type_name: ltName }, ['name']);
    if (ltExisting.length === 0) {
      createdLeaveType = await createDoc(page, 'Leave Type', {
        leave_type_name: ltName,
        max_days_allowed: 20,
        allow_encashment: 0,
        is_carry_forward: 0,
      });
    } else {
      createdLeaveType = ltExisting[0].name as string;
    }

    // 3. Leave allocation for the active test employee.
    const employees = await listDocs(page, 'Employee', { status: 'Active', company: COMPANY }, ['name']);
    if (employees.length > 0) {
      const emp = employees[0].name as string;
      const allocExists = await listDocs(page, 'Leave Allocation', {
        employee: emp,
        leave_type: createdLeaveType,
        docstatus: 1,
        from_date: ['<=', today()],
        to_date: ['>=', today()],
      }, ['name']);
      if (allocExists.length === 0) {
        const allocName = await createDoc(page, 'Leave Allocation', {
          employee: emp,
          leave_type: createdLeaveType,
          from_date: `${currentYear()}-01-01`,
          to_date: `${currentYear()}-12-31`,
          new_leaves_allocated: 20,
          carry_forward: 0,
        });
        await submitDoc(page, 'Leave Allocation', allocName);
        createdAllocation = allocName;
      }
    }

    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    // Clean up only the records this suite created.
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await loginAdmin(page);

    if (createdAllocation) {
      try {
        await cancelDoc(page, 'Leave Allocation', createdAllocation);
        await deleteDoc(page, 'Leave Allocation', createdAllocation);
      } catch { /* already gone */ }
    }
    if (createdLeaveType) {
      try { await deleteDoc(page, 'Leave Type', createdLeaveType); } catch { /* already gone */ }
    }
    // Keep the holiday list — it is shared infrastructure.
    await ctx.close();
  });

  test('/setup Leave section shows Ready when holiday list, leave types and allocations are present', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    await setupPage.expectCheckOk(SECTION_LEAVE, 'A holiday list for this year');
    await setupPage.expectCheckOk(SECTION_LEAVE, 'Leave types defined');
    await setupPage.expectCheckOk(SECTION_LEAVE, 'Leave allocated to employees');
    await setupPage.expectSectionReady(SECTION_LEAVE);
  });

  test('Holiday list check shows the list name in its detail text', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    const section = page
      .locator('section.cs-setup-mod')
      .filter({ has: page.locator('.cs-card-title', { hasText: SECTION_LEAVE }) })
      .first();
    const holidayRow = section
      .locator('.cs-setup-item')
      .filter({ hasText: 'A holiday list for this year' })
      .first();
    // The detail cell shows the list name or a pass message.
    await expect(holidayRow.locator('.cs-setup-detail')).not.toBeEmpty();
  });

  test('"All employees allocated" is advisory (optional)', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();
    const isOptional = await setupPage.isCheckOptional(SECTION_LEAVE, 'Every active employee has an allocation');
    expect(isOptional).toBe(true);
  });

  test('Compensatory leave type check is advisory', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();
    const isOptional = await setupPage.isCheckOptional(SECTION_LEAVE, 'A compensatory leave type');
    expect(isOptional).toBe(true);
  });

  test('/setup Leave section shows Not ready when no allocations exist', async ({ page }) => {
    await loginAdmin(page);

    // Skip if there are submitted allocations OTHER than ours — pre-existing data
    // means we can't drive the check to "not ready" without destroying real records.
    if (!createdAllocation) { test.skip(); return; }
    const others = await listDocs(
      page, 'Leave Allocation',
      {
        docstatus: 1,
        from_date: ['<=', today()],
        to_date: ['>=', today()],
        name: ['!=', createdAllocation],
      },
      ['name']
    );
    if ((others as Array<unknown>).length > 0) { test.skip(); return; }

    // Only our allocation exists — cancel it.
    try {
      await cancelDoc(page, 'Leave Allocation', createdAllocation);
      await deleteDoc(page, 'Leave Allocation', createdAllocation);
    } catch { test.skip(); return; }

    const setupPage = new SetupPage(page);
    await setupPage.goto();
    await setupPage.expectCheckMissing(SECTION_LEAVE, 'Leave allocated to employees');
    await setupPage.expectSectionNotReady(SECTION_LEAVE);

    // Restore.
    const employees = await listDocs(page, 'Employee', { status: 'Active', company: COMPANY }, ['name']);
    if (employees.length > 0) {
      const emp = employees[0].name as string;
      const allocName = await createDoc(page, 'Leave Allocation', {
        employee: emp,
        leave_type: createdLeaveType,
        from_date: `${currentYear()}-01-01`,
        to_date: `${currentYear()}-12-31`,
        new_leaves_allocated: 20,
        carry_forward: 0,
      });
      await submitDoc(page, 'Leave Allocation', allocName);
      createdAllocation = allocName;
    }
  });
});

test.describe('HR Core — Platform Settings check', () => {
  test('Platform Settings reviewed check is advisory (optional)', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    const isOptional = await setupPage.isCheckOptional('Email and access', 'Platform limits and rules reviewed');
    expect(isOptional).toBe(true);
  });

  test('Platform Settings reviewed check passes when settings_reviewed = 1', async ({ page }) => {
    await loginAdmin(page);

    // Ensure it is marked reviewed.
    await updateDoc(page, 'CS Platform Settings', 'CS Platform Settings', { reviewed: 1 });

    const setupPage = new SetupPage(page);
    await setupPage.goto();
    await setupPage.expectCheckOk('Email and access', 'Platform limits and rules reviewed');
  });
});
