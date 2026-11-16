/**
 * End-to-end setup flow — navigate to each module's fix URL, fill the form
 * via the browser UI, then confirm the /setup check turns green.
 *
 * Tests run serially so each module is set up in dependency order:
 *   1.  Desk access              — required before other HR admins can open Desk
 *   2.  Holiday list             — link to Company (prerequisite for leave)
 *   3.  Leave type               — needed before allocation
 *   4.  Leave allocation         — blocking leave check
 *   5.  Salary structure         — blocking payroll check
 *   6.  Income tax slab          — blocking payroll check
 *   7.  Salary assignment        — blocking payroll check
 *   8.  Leave policy             — blocking onboarding check
 *   9.  Goal timeframe           — advisory performance check
 *  10.  Pulse metric             — blocking pulse check
 *  11.  Company policy           — advisory policies check
 *  12.  Ethics settings          — blocking whistleblower enabled check
 *  13.  Expense claim accounts   — blocking reimbursements check
 *  14.  Brand names              — advisory branding check
 *  15.  Brand colours            — advisory branding check
 *  16.  Compensatory leave type  — advisory leave check
 *  17.  Company PAN              — advisory income tax check
 *  18.  Declaration windows      — advisory income tax check
 *  19.  Office location          — advisory attendance check
 *  20.  Letterhead               — advisory HR documents check
 *  21.  Finance upload list      — advisory email and access check
 *  22.  Project managers list    — advisory email and access check
 *  23.  Platform settings        — advisory email and access check
 *
 * Each test:
 *   a) Ensures the check is NOT already passing (cleans up data via API first).
 *      Skips if pre-existing data belonging to other records prevents this.
 *   b) Navigates to the fix URL by clicking the .cs-setup-fix link on /setup.
 *   c) Fills the Frappe desk form with logical dummy data.
 *   d) Saves / submits.
 *   e) Returns to /setup and asserts the specific check is now ✓.
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { SetupPage } from '../../pages/SetupPage';
import { FrappeDeskPage } from '../../pages/FrappeDeskPage';
import { hrmsConfig } from '../../config';
import {
  createDoc,
  updateDoc,
  deleteDoc,
  listDocs,
  getDoc,
  submitDoc,
  cancelDoc,
  currentYear,
  today,
} from '../../helpers/frappe-api';

const COMPANY = 'Coditation';

async function loginAdmin(page: import('@playwright/test').Page) {
  const lp = new LoginPage(page);
  await lp.goto();
  await lp.login(hrmsConfig.credentials.username, hrmsConfig.credentials.password);
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });
}

/** Click the .cs-setup-fix link for a named check and navigate there. */
async function clickFixLink(
  page: import('@playwright/test').Page,
  section: string,
  check: string
): Promise<void> {
  const row = page
    .locator('section.cs-setup-mod')
    .filter({ has: page.locator('.cs-card-title', { hasText: section }) })
    .locator('.cs-setup-item')
    .filter({ hasText: check })
    .locator('.cs-setup-fix')
    .first();
  await row.waitFor({ state: 'visible', timeout: 8_000 });
  await row.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
}

// ─── helpers ────────────────────────────────────────────────────────────────

function yearStart() { return `${currentYear()}-01-01`; }
function yearEnd()   { return `${currentYear()}-12-31`; }

// ─── tracking names created during this run ─────────────────────────────────

const created = {
  holidayList:    '',
  leaveType:      '',
  leaveAlloc:     '',
  salaryStruct:   '',
  taxSlab:        '',
  salaryAssign:   '',
  leavePolicy:    '',
  goalTimeframe:  '',
  companyPolicy:  '',
  ethicsSettings: false,
  compOffLeave:   '',
  payrollPeriod:  '',
  taxDeclSettings: '',
  letterhead:     '',
  brandSettings:  false,
};

// ─── afterAll cleanup ────────────────────────────────────────────────────────

test.afterAll(async ({ browser }) => {
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await loginAdmin(p);

  if (created.salaryAssign) {
    try { await cancelDoc(p, 'Salary Structure Assignment', created.salaryAssign); } catch { /**/ }
    try { await deleteDoc(p, 'Salary Structure Assignment', created.salaryAssign); } catch { /**/ }
  }
  if (created.taxSlab) {
    try { await cancelDoc(p, 'Income Tax Slab', created.taxSlab); } catch { /**/ }
    try { await deleteDoc(p, 'Income Tax Slab', created.taxSlab); } catch { /**/ }
  }
  if (created.salaryStruct) {
    try { await cancelDoc(p, 'Salary Structure', created.salaryStruct); } catch { /**/ }
    try { await deleteDoc(p, 'Salary Structure', created.salaryStruct); } catch { /**/ }
  }
  if (created.leaveAlloc) {
    try { await cancelDoc(p, 'Leave Allocation', created.leaveAlloc); } catch { /**/ }
    try { await deleteDoc(p, 'Leave Allocation', created.leaveAlloc); } catch { /**/ }
  }
  if (created.leaveType) {
    try { await deleteDoc(p, 'Leave Type', created.leaveType); } catch { /**/ }
  }
  if (created.leavePolicy) {
    try { await cancelDoc(p, 'Leave Policy', created.leavePolicy); } catch { /**/ }
    try { await deleteDoc(p, 'Leave Policy', created.leavePolicy); } catch { /**/ }
  }
  if (created.goalTimeframe) {
    try { await deleteDoc(p, 'Goal Timeframe', created.goalTimeframe); } catch { /**/ }
  }
  if (created.companyPolicy) {
    try { await deleteDoc(p, 'Company Policy', created.companyPolicy); } catch { /**/ }
  }
  if (created.ethicsSettings) {
    try { await updateDoc(p, 'Ethics Settings', COMPANY, { enabled: 0 }); } catch { /**/ }
  }
  if (created.compOffLeave) {
    try { await deleteDoc(p, 'Leave Type', created.compOffLeave); } catch { /**/ }
  }
  if (created.taxDeclSettings) {
    try { await deleteDoc(p, 'Tax Declaration Settings', created.taxDeclSettings); } catch { /**/ }
  }
  if (created.payrollPeriod) {
    try { await deleteDoc(p, 'Payroll Period', created.payrollPeriod); } catch { /**/ }
  }
  if (created.letterhead) {
    try { await deleteDoc(p, 'Letter Head', created.letterhead); } catch { /**/ }
  }
  if (created.brandSettings) {
    try { await updateDoc(p, 'Brand Settings', 'Brand Settings', { brand_name: '', product_name: '', primary_fill: '' }); } catch { /**/ }
  }
  await ctx.close();
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. Desk access
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe.serial('Setup flow — 1. Desk access', () => {
  test.beforeAll(async ({ browser }) => {
    // Remove all existing entries so the check starts failing.
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await loginAdmin(p);
    const all = await listDocs(p, 'HRMS Desk Access', {}, ['name']);
    for (const e of all as Array<{ name: string }>) {
      try { await deleteDoc(p, 'HRMS Desk Access', e.name); } catch { /**/ }
    }
    await ctx.close();
  });

  test('Fix: create a Desk Access entry via UI → check turns green', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    // Verify the check is currently failing.
    await setupPage.expectCheckMissing('Desk access', 'Who may use Desk');

    // Click the fix link.
    await clickFixLink(page, 'Desk access', 'Who may use Desk');
    expect(page.url()).toContain('/hrms-desk-access');

    // Fill the new HRMS Desk Access form.
    const desk = new FrappeDeskPage(page);
    await desk.setLinkField('user', 'Administrator');
    await desk.checkField('enabled');
    await desk.save();

    // Navigate back to /setup and verify.
    await setupPage.goto();
    await setupPage.expectCheckOk('Desk access', 'Who may use Desk');
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. Leave — holiday list linked to company
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe.serial('Setup flow — 2. Leave: holiday list', () => {
  const LIST_NAME = `E2E Flow Holiday List ${currentYear()}`;

  test.beforeAll(async ({ browser }) => {
    // Clear company's default holiday list so the check is not ready.
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await loginAdmin(p);
    await updateDoc(p, 'Company', COMPANY, { default_holiday_list: '' });

    // Ensure the holiday list exists (required before we can link it).
    const existing = await listDocs(p, 'Holiday List', { holiday_list_name: LIST_NAME }, ['name']);
    if (existing.length === 0) {
      created.holidayList = await createDoc(p, 'Holiday List', {
        holiday_list_name: LIST_NAME,
        from_date: yearStart(),
        to_date: yearEnd(),
        holidays: [{ description: 'New Year', holiday_date: `${currentYear()}-01-01` }],
      });
    } else {
      created.holidayList = (existing[0] as { name: string }).name;
    }
    await ctx.close();
  });

  test('Fix: open Company form via fix link, set default holiday list → check turns green', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    // Verify not ready.
    await setupPage.expectCheckMissing('Leave', 'A holiday list for this year');

    // Click fix link → opens Company form.
    await clickFixLink(page, 'Leave', 'A holiday list for this year');
    expect(page.url()).toContain('/company/');

    // Set the default holiday list on the Company form.
    const desk = new FrappeDeskPage(page);
    await desk.setLinkField('default_holiday_list', LIST_NAME);
    await desk.save();

    // Back to /setup → verify.
    await setupPage.goto();
    await setupPage.expectCheckOk('Leave', 'A holiday list for this year');
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. Leave — leave types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe.serial('Setup flow — 3. Leave: leave types', () => {
  const LEAVE_TYPE = 'E2E Annual Leave';

  test.beforeAll(async ({ browser }) => {
    // Skip setup if leave types already exist (can't safely delete them).
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await loginAdmin(p);
    const all = await listDocs(p, 'Leave Type', {}, ['name']);
    if (all.length === 0) {
      // No leave types — test will create one.
    } else {
      created.leaveType = '__already_exists__';
    }
    await ctx.close();
  });

  test('Fix: create a Leave Type via UI → check turns green', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    const isOk = await setupPage.isCheckOk('Leave', 'Leave types defined');
    if (isOk) {
      // Already green — verify and skip the UI creation step.
      await setupPage.expectCheckOk('Leave', 'Leave types defined');
      return;
    }

    // Click fix link → opens leave type list.
    await clickFixLink(page, 'Leave', 'Leave types defined');
    expect(page.url()).toContain('/leave-type');

    // Click New to open a blank form.
    await page.locator('.page-head button:has-text("New"), .btn-primary:has-text("New")').first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const desk = new FrappeDeskPage(page);
    await desk.fillField('leave_type_name', LEAVE_TYPE);
    await desk.save();
    created.leaveType = await desk.currentDocName();

    // Back to /setup → verify.
    await setupPage.goto();
    await setupPage.expectCheckOk('Leave', 'Leave types defined');
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. Leave — allocations
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe.serial('Setup flow — 4. Leave: allocation', () => {
  let employeeName = '';
  let leaveTypeName = '';

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await loginAdmin(p);

    // Find the first active employee.
    const emps = await listDocs(p, 'Employee', { status: 'Active', company: COMPANY }, ['name']);
    if (emps.length > 0) employeeName = (emps[0] as { name: string }).name;

    // Find or use the leave type created in step 3.
    const lts = await listDocs(p, 'Leave Type', {}, ['name']);
    if (lts.length > 0) leaveTypeName = (lts[0] as { name: string }).name;

    // Cancel any existing active allocations for this employee + type so we start fresh.
    if (employeeName && leaveTypeName) {
      const existing = await listDocs(p, 'Leave Allocation', {
        employee: employeeName,
        leave_type: leaveTypeName,
        docstatus: 1,
        from_date: ['<=', today()],
        to_date: ['>=', today()],
      }, ['name']);
      for (const e of existing as Array<{ name: string }>) {
        try { await cancelDoc(p, 'Leave Allocation', e.name); } catch { /**/ }
        try { await deleteDoc(p, 'Leave Allocation', e.name); } catch { /**/ }
      }
    }
    await ctx.close();
  });

  test('Fix: create and submit a Leave Allocation via UI → check turns green', async ({ page }) => {
    if (!employeeName || !leaveTypeName) { test.skip(); return; }

    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    // Verify check not ready (or skip if other allocations make it pass already).
    const isOk = await setupPage.isCheckOk('Leave', 'Leave allocated to employees');
    if (isOk) {
      // Another allocation already makes it pass — verify and move on.
      await setupPage.expectCheckOk('Leave', 'Leave allocated to employees');
      return;
    }

    // Click fix link → /app/leave-allocation.
    await clickFixLink(page, 'Leave', 'Leave allocated to employees');
    expect(page.url()).toContain('/leave-allocation');

    // Open a new allocation form.
    await page.locator('.page-head button:has-text("New"), .btn-primary:has-text("New")').first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const desk = new FrappeDeskPage(page);
    await desk.setLinkField('employee', employeeName);
    await desk.setLinkField('leave_type', leaveTypeName);
    await desk.fillDateField('from_date', yearStart());
    await desk.fillDateField('to_date', yearEnd());
    await desk.fillField('new_leaves_allocated', '12');
    await desk.save();
    await desk.submitDoc();
    created.leaveAlloc = await desk.currentDocName();

    // Back to /setup → verify.
    await setupPage.goto();
    await setupPage.expectCheckOk('Leave', 'Leave allocated to employees');
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. Payroll — salary structure
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe.serial('Setup flow — 5. Payroll: salary structure', () => {
  const STRUCT_NAME = `E2E Flow Structure ${currentYear()}`;

  test.beforeAll(async ({ browser }) => {
    // Cancel all active salary structures so the check fails.
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await loginAdmin(p);
    const existing = await listDocs(p, 'Salary Structure',
      { docstatus: 1, is_active: 'Yes', company: COMPANY }, ['name']);
    for (const e of existing as Array<{ name: string }>) {
      try { await cancelDoc(p, 'Salary Structure', e.name); } catch { /**/ }
    }
    await ctx.close();
  });

  test('Fix: create and submit a Salary Structure via UI → check turns green', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    const isOk = await setupPage.isCheckOk('Payroll', 'A submitted salary structure');
    if (isOk) { await setupPage.expectCheckOk('Payroll', 'A submitted salary structure'); return; }

    // Click fix link → /app/salary-structure.
    await clickFixLink(page, 'Payroll', 'A submitted salary structure');
    expect(page.url()).toContain('/salary-structure');

    // Open new form.
    await page.locator('.page-head button:has-text("New"), .btn-primary:has-text("New")').first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const desk = new FrappeDeskPage(page);
    // The document name field (autoname) is the first Data input.
    await desk.fillField('__newname', STRUCT_NAME);
    await desk.setLinkField('company', COMPANY);
    await desk.setSelectField('is_active', 'Yes');
    await desk.setSelectField('payroll_frequency', 'Monthly');

    // Switch to Earnings & Deductions tab and add one Basic earning.
    await desk.clickTab('Earnings & Deductions');
    await desk.addTableRow('earnings');
    await desk.setTableRowLink('earnings', 'salary_component', 'Basic');
    await desk.uncheckTableRowField('earnings', 'amount_based_on_formula');
    await desk.fillTableRowField('earnings', 'amount', '25000');

    await desk.save();
    created.salaryStruct = await desk.currentDocName();
    await desk.submitDoc();

    // Back to /setup → verify.
    await setupPage.goto();
    await setupPage.expectCheckOk('Payroll', 'A submitted salary structure');
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6. Payroll — income tax slab
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe.serial('Setup flow — 6. Payroll: income tax slab', () => {
  const SLAB_NAME = `E2E Flow Tax Slab ${currentYear()}`;

  test.beforeAll(async ({ browser }) => {
    // Cancel all real (non-test) submitted slabs.
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await loginAdmin(p);
    const existing = await listDocs(p, 'Income Tax Slab',
      { docstatus: 1, disabled: 0 }, ['name']);
    for (const e of existing as Array<{ name: string }>) {
      if (!(e.name as string).startsWith('_Test')) {
        try { await cancelDoc(p, 'Income Tax Slab', e.name); } catch { /**/ }
      }
    }
    await ctx.close();
  });

  test('Fix: create and submit an Income Tax Slab via UI → check turns green', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    const isOk = await setupPage.isCheckOk('Payroll', 'A submitted income tax slab');
    if (isOk) { await setupPage.expectCheckOk('Payroll', 'A submitted income tax slab'); return; }

    // Click fix link → /app/income-tax-slab.
    await clickFixLink(page, 'Payroll', 'A submitted income tax slab');
    expect(page.url()).toContain('/income-tax-slab');

    // Open new form.
    await page.locator('.page-head button:has-text("New"), .btn-primary:has-text("New")').first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const desk = new FrappeDeskPage(page);
    await desk.fillField('__newname', SLAB_NAME);
    // Effective from is usually the financial year start.
    await desk.fillDateField('effective_from', `${currentYear()}-04-01`);

    // Add a slab row: 0 to 300000 at 0%.
    await desk.addTableRow('slabs');
    await desk.fillTableRowField('slabs', 'from_amount', '0');
    await desk.fillTableRowField('slabs', 'to_amount', '300000');
    await desk.fillTableRowField('slabs', 'percent_deduction', '0');

    await desk.save();
    created.taxSlab = await desk.currentDocName();
    await desk.submitDoc();

    // Back to /setup → verify.
    await setupPage.goto();
    await setupPage.expectCheckOk('Payroll', 'A submitted income tax slab');
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 7. Payroll — salary assignment
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe.serial('Setup flow — 7. Payroll: salary assignment', () => {
  let employeeName = '';
  let salaryStructName = '';
  let taxSlabName = '';

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await loginAdmin(p);

    const emps = await listDocs(p, 'Employee', { status: 'Active', company: COMPANY }, ['name']);
    if (emps.length > 0) employeeName = (emps[0] as { name: string }).name;

    const structs = await listDocs(p, 'Salary Structure',
      { docstatus: 1, is_active: 'Yes', company: COMPANY }, ['name']);
    if (structs.length > 0) salaryStructName = (structs[0] as { name: string }).name;

    const slabs = (await listDocs(p, 'Income Tax Slab',
      { docstatus: 1, disabled: 0 }, ['name']) as Array<{ name: string }>)
      .filter((s) => !s.name.startsWith('_Test'));
    if (slabs.length > 0) taxSlabName = slabs[0].name;

    // Cancel existing assignments for this employee.
    if (employeeName) {
      const existing = await listDocs(p, 'Salary Structure Assignment',
        { employee: employeeName, docstatus: 1 }, ['name']);
      for (const e of existing as Array<{ name: string }>) {
        try { await cancelDoc(p, 'Salary Structure Assignment', e.name); } catch { /**/ }
        try { await deleteDoc(p, 'Salary Structure Assignment', e.name); } catch { /**/ }
      }
    }
    await ctx.close();
  });

  test('Fix: create and submit a Salary Structure Assignment via UI → check turns green', async ({ page }) => {
    if (!employeeName || !salaryStructName) { test.skip(); return; }

    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    const isOk = await setupPage.isCheckOk('Payroll', 'Salary assigned to employees');
    if (isOk) { await setupPage.expectCheckOk('Payroll', 'Salary assigned to employees'); return; }

    // Click fix link → /app/salary-structure-assignment.
    await clickFixLink(page, 'Payroll', 'Salary assigned to employees');
    expect(page.url()).toContain('/salary-structure-assignment');

    // Open new form.
    await page.locator('.page-head button:has-text("New"), .btn-primary:has-text("New")').first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const desk = new FrappeDeskPage(page);
    await desk.setLinkField('employee', employeeName);
    await desk.setLinkField('salary_structure', salaryStructName);
    await desk.fillDateField('from_date', yearStart());
    await desk.fillField('base', '25000');
    if (taxSlabName) {
      await desk.setLinkField('income_tax_slab', taxSlabName);
    }
    await desk.save();
    created.salaryAssign = await desk.currentDocName();
    await desk.submitDoc();

    // Back to /setup → verify.
    await setupPage.goto();
    await setupPage.expectCheckOk('Payroll', 'Salary assigned to employees');
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 8. Onboarding — leave policy
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe.serial('Setup flow — 8. Onboarding: leave policy', () => {
  let leavetypeName = '';

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await loginAdmin(p);

    // Cancel existing submitted leave policies so check fails.
    const existing = await listDocs(p, 'Leave Policy', { docstatus: 1 }, ['name']);
    for (const e of existing as Array<{ name: string }>) {
      try { await cancelDoc(p, 'Leave Policy', e.name); } catch { /**/ }
      try { await deleteDoc(p, 'Leave Policy', e.name); } catch { /**/ }
    }

    // Find a leave type to use.
    const lts = await listDocs(p, 'Leave Type', {}, ['name']);
    if (lts.length > 0) leavetypeName = (lts[0] as { name: string }).name;
    await ctx.close();
  });

  test('Fix: create and submit a Leave Policy via UI → check turns green', async ({ page }) => {
    if (!leavetypeName) { test.skip(); return; }

    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    await setupPage.expectCheckMissing('Onboarding', 'A leave plan for new joiners');

    // Click fix link → /app/leave-policy.
    await clickFixLink(page, 'Onboarding', 'A leave plan for new joiners');
    expect(page.url()).toContain('/leave-policy');

    // Open new form.
    await page.locator('.page-head button:has-text("New"), .btn-primary:has-text("New")').first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const desk = new FrappeDeskPage(page);
    await desk.fillField('title', `E2E Leave Policy ${currentYear()}`);

    // Add a row to leave_policy_details.
    await desk.addTableRow('leave_policy_details');
    await desk.setTableRowLink('leave_policy_details', 'leave_type', leavetypeName);
    await desk.fillTableRowField('leave_policy_details', 'annual_allocation', '12');

    await desk.save();
    created.leavePolicy = await desk.currentDocName();
    await desk.submitDoc();

    // Back to /setup → verify.
    await setupPage.goto();
    await setupPage.expectCheckOk('Onboarding', 'A leave plan for new joiners');
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 9. Performance — goal timeframe (advisory)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe.serial('Setup flow — 9. Performance: goal timeframe', () => {
  test.beforeAll(async ({ browser }) => {
    // Remove existing active timeframes so the advisory check fails.
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await loginAdmin(p);
    const existing = await listDocs(p, 'Goal Timeframe', { status: 'Active' }, ['name']);
    for (const e of existing as Array<{ name: string }>) {
      try { await deleteDoc(p, 'Goal Timeframe', e.name); } catch { /**/ }
    }
    await ctx.close();
  });

  test('Fix: create a Goal Timeframe via UI → advisory check turns green', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    const isOk = await setupPage.isCheckOk('Performance', 'A goal timeframe covering today');
    if (isOk) { await setupPage.expectCheckOk('Performance', 'A goal timeframe covering today'); return; }

    // Click fix link → /app/goal-timeframe.
    await clickFixLink(page, 'Performance', 'A goal timeframe covering today');
    expect(page.url()).toContain('/goal-timeframe');

    // Open new form.
    await page.locator('.page-head button:has-text("New"), .btn-primary:has-text("New")').first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const desk = new FrappeDeskPage(page);
    await desk.fillField('timeframe_name', `FY ${currentYear()}`);
    await desk.fillDateField('start_date', yearStart());
    await desk.fillDateField('end_date', yearEnd());
    await desk.setSelectField('status', 'Active');
    await desk.save();
    created.goalTimeframe = await desk.currentDocName();

    // Back to /setup → verify.
    await setupPage.goto();
    await setupPage.expectCheckOk('Performance', 'A goal timeframe covering today');
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 10. Pulse surveys — pulse metric (blocking)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe.serial('Setup flow — 10. Pulse surveys: pulse metric', () => {
  test.beforeAll(async ({ browser }) => {
    // Disable all pulse metrics so the check fails.
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await loginAdmin(p);
    const metrics = await listDocs(p, 'Pulse Metric', { enabled: 1 }, ['name']);
    for (const m of metrics as Array<{ name: string }>) {
      try { await updateDoc(p, 'Pulse Metric', m.name, { enabled: 0 }); } catch { /**/ }
    }
    await ctx.close();
  });

  test('Fix: open a Pulse Metric and enable it via UI → check turns green', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    const isOk = await setupPage.isCheckOk('Pulse surveys', 'At least one pulse metric enabled');
    if (isOk) { await setupPage.expectCheckOk('Pulse surveys', 'At least one pulse metric enabled'); return; }

    // Click fix link → /app/pulse-metric list.
    await clickFixLink(page, 'Pulse surveys', 'At least one pulse metric enabled');
    expect(page.url()).toContain('/pulse-metric');

    // Open the first existing pulse metric.
    const firstRow = page.locator('.list-row-col .level-item a, .list-row a[href*="pulse-metric"]').first();
    await firstRow.waitFor({ state: 'visible', timeout: 8_000 });
    await firstRow.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Enable the metric.
    const desk = new FrappeDeskPage(page);
    await desk.checkField('enabled');
    await desk.save();

    // Back to /setup → verify.
    await setupPage.goto();
    await setupPage.expectCheckOk('Pulse surveys', 'At least one pulse metric enabled');
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 11. Policies — company policy (advisory)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe.serial('Setup flow — 11. Policies: company policy', () => {
  test.beforeAll(async ({ browser }) => {
    // Un-publish any existing Company Policies so the advisory check fails.
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await loginAdmin(p);
    const published = await listDocs(p, 'Company Policy', { status: 'Published' }, ['name']);
    for (const e of published as Array<{ name: string }>) {
      try { await updateDoc(p, 'Company Policy', e.name, { status: 'Draft' }); } catch { /**/ }
    }
    await ctx.close();
  });

  test('Fix: create a Company Policy with Published status via UI → advisory check turns green', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    const isOk = await setupPage.isCheckOk('Policies', 'Your policies, published');
    if (isOk) { await setupPage.expectCheckOk('Policies', 'Your policies, published'); return; }

    // Click fix link → /app/company-policy.
    await clickFixLink(page, 'Policies', 'Your policies, published');
    expect(page.url()).toContain('/company-policy');

    // Open new form.
    await page.locator('.page-head button:has-text("New"), .btn-primary:has-text("New")').first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const desk = new FrappeDeskPage(page);
    await desk.fillField('title', `E2E Code of Conduct ${currentYear()}`);
    await desk.fillField('policy_category', 'General');
    await desk.fillField('version', '1.0');
    await desk.fillDateField('effective_date', today());
    await desk.setSelectField('status', 'Published');
    await desk.fillTextEditor('content', 'This policy governs the conduct of all employees.');
    await desk.save();
    created.companyPolicy = await desk.currentDocName();

    // Back to /setup → verify.
    await setupPage.goto();
    await setupPage.expectCheckOk('Policies', 'Your policies, published');
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 12. Whistleblower — ethics settings enabled (blocking)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe.serial('Setup flow — 12. Whistleblower: enable Ethics Settings', () => {
  test.beforeAll(async ({ browser }) => {
    // Ensure no enabled Ethics Settings exist.
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await loginAdmin(p);
    const enabled = await listDocs(p, 'Ethics Settings', { enabled: 1 }, ['name']);
    for (const e of enabled as Array<{ name: string }>) {
      try { await updateDoc(p, 'Ethics Settings', e.name, { enabled: 0 }); } catch { /**/ }
    }
    await ctx.close();
  });

  test('Fix: open Ethics Settings, set company and enable → check turns green', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    await setupPage.expectCheckMissing('Whistleblower channel', 'A company is set up for the channel');

    // Click fix link → /app/ethics-settings.
    await clickFixLink(page, 'Whistleblower channel', 'A company is set up for the channel');
    expect(page.url()).toContain('/ethics-settings');

    // Check if an existing record for COMPANY is shown, or create new.
    const existing = await listDocs(page, 'Ethics Settings', { name: COMPANY }, ['name']);
    if ((existing as Array<unknown>).length > 0) {
      // Open the existing record.
      await page.goto(`/app/ethics-settings/${encodeURIComponent(COMPANY)}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
    } else {
      // Create new.
      await page.locator('.page-head button:has-text("New"), .btn-primary:has-text("New")').first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const desk = new FrappeDeskPage(page);
      await desk.setLinkField('company', COMPANY);
    }

    const desk = new FrappeDeskPage(page);
    await desk.checkField('enabled');
    await desk.save();
    created.ethicsSettings = true;

    // Back to /setup → verify the enabled check passes.
    await setupPage.goto();
    await setupPage.expectCheckOk('Whistleblower channel', 'A company is set up for the channel');
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 13. Reimbursements — expense claim type accounts (blocking)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe.serial('Setup flow — 13. Reimbursements: expense claim accounts', () => {
  let missingTypes: string[] = [];

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await loginAdmin(p);

    // Find claim types that have no account row for this company.
    const types = await listDocs(p, 'Expense Claim Type', {}, ['name']);
    for (const t of types as Array<{ name: string }>) {
      const doc = await getDoc(p, 'Expense Claim Type', t.name);
      const accts = (doc as { accounts: Array<{ company: string }> }).accounts ?? [];
      if (!accts.some((a) => a.company === COMPANY)) {
        missingTypes.push(t.name);
      }
    }
    await ctx.close();
  });

  test('Fix: add accounts to expense claim types → check turns green', async ({ page }) => {
    if (missingTypes.length === 0) {
      await loginAdmin(page);
      const setupPage = new SetupPage(page);
      await setupPage.goto();
      await setupPage.expectCheckOk('Reimbursements', 'An account for each expense claim type');
      return;
    }

    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();
    await setupPage.expectCheckMissing('Reimbursements', 'An account for each expense claim type');

    // Click fix link → /app/expense-claim-type list.
    await clickFixLink(page, 'Reimbursements', 'An account for each expense claim type');
    expect(page.url()).toContain('/expense-claim-type');

    // Open each missing type and add an account row.
    for (const typeName of missingTypes) {
      await page.goto(`/app/expense-claim-type/${encodeURIComponent(typeName)}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const desk = new FrappeDeskPage(page);
      await desk.addTableRow('accounts');
      await desk.setTableRowLink('accounts', 'company', COMPANY);
      await desk.setTableRowLink('accounts', 'default_account', 'Travel Expenses - C');
      await desk.save();
    }

    // Back to /setup → verify.
    await setupPage.goto();
    await setupPage.expectCheckOk('Reimbursements', 'An account for each expense claim type');
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 14. Branding — company and product name (advisory)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe.serial('Setup flow — 14. Branding: company and product name', () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await loginAdmin(p);
    try { await updateDoc(p, 'Brand Settings', 'Brand Settings', { brand_name: '', product_name: '' }); } catch { /**/ }
    await ctx.close();
  });

  test('Fix: set brand and product name in Brand Settings → advisory check turns green', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    const isOk = await setupPage.isCheckOk('Branding', 'Your company and product name');
    if (isOk) { await setupPage.expectCheckOk('Branding', 'Your company and product name'); return; }

    await clickFixLink(page, 'Branding', 'Your company and product name');
    expect(page.url()).toContain('/brand-settings');

    const desk = new FrappeDeskPage(page);
    await desk.fillField('brand_name', 'Coditation');
    await desk.fillField('product_name', 'HRMS');
    await desk.save();
    created.brandSettings = true;

    await setupPage.goto();
    await setupPage.expectCheckOk('Branding', 'Your company and product name');
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 15. Branding — primary colour (advisory)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe.serial('Setup flow — 15. Branding: primary colour', () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await loginAdmin(p);
    try { await updateDoc(p, 'Brand Settings', 'Brand Settings', { primary_fill: '' }); } catch { /**/ }
    await ctx.close();
  });

  test('Fix: set primary colour in Brand Settings → advisory check turns green', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    const isOk = await setupPage.isCheckOk('Branding', 'Your colours');
    if (isOk) { await setupPage.expectCheckOk('Branding', 'Your colours'); return; }

    await clickFixLink(page, 'Branding', 'Your colours');
    expect(page.url()).toContain('/brand-settings');

    // The Color field renders with both a native color picker and a text input.
    // Fill the text input directly with a hex value.
    const colorInput = page.locator('[data-fieldname="primary_fill"] input[type="text"]').first();
    if (await colorInput.count() === 0) {
      // Fall back to any input in the field.
      await page.locator('[data-fieldname="primary_fill"] input').first().fill('#2490EF');
    } else {
      await colorInput.click();
      await colorInput.fill('#2490EF');
    }

    const desk = new FrappeDeskPage(page);
    await desk.save();
    created.brandSettings = true;

    await setupPage.goto();
    await setupPage.expectCheckOk('Branding', 'Your colours');
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 16. Leave — compensatory leave type (advisory)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe.serial('Setup flow — 16. Leave: compensatory leave type', () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await loginAdmin(p);
    const compTypes = await listDocs(p, 'Leave Type', { is_compensatory: 1 }, ['name']);
    for (const lt of compTypes as Array<{ name: string }>) {
      try { await deleteDoc(p, 'Leave Type', lt.name); } catch { /**/ }
    }
    await ctx.close();
  });

  test('Fix: create a compensatory Leave Type via UI → advisory check turns green', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    const isOk = await setupPage.isCheckOk('Leave', 'A compensatory leave type, if you grant comp-off');
    if (isOk) { await setupPage.expectCheckOk('Leave', 'A compensatory leave type, if you grant comp-off'); return; }

    await clickFixLink(page, 'Leave', 'A compensatory leave type, if you grant comp-off');
    expect(page.url()).toContain('/leave-type');

    await page.locator('.page-head button:has-text("New"), .btn-primary:has-text("New")').first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const desk = new FrappeDeskPage(page);
    await desk.fillField('leave_type_name', 'Comp Off');
    await desk.checkField('is_compensatory');
    await desk.save();
    created.compOffLeave = await desk.currentDocName();

    await setupPage.goto();
    await setupPage.expectCheckOk('Leave', 'A compensatory leave type, if you grant comp-off');
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 17. Income tax — Company PAN (advisory)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe.serial('Setup flow — 17. Income tax: Company PAN', () => {
  let originalPan = '';

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await loginAdmin(p);
    const doc = await getDoc(p, 'Company', COMPANY, ['tax_id']);
    originalPan = (doc as { tax_id: string }).tax_id ?? '';
    if (originalPan) {
      try { await updateDoc(p, 'Company', COMPANY, { tax_id: '' }); } catch { /**/ }
    }
    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    if (!originalPan) return;
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await loginAdmin(p);
    try { await updateDoc(p, 'Company', COMPANY, { tax_id: originalPan }); } catch { /**/ }
    await ctx.close();
  });

  test('Fix: set Company PAN (Tax ID) on Company form → advisory check turns green', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    const isOk = await setupPage.isCheckOk('Income tax declarations', 'Company PAN (Tax ID) on the Company');
    if (isOk) { await setupPage.expectCheckOk('Income tax declarations', 'Company PAN (Tax ID) on the Company'); return; }

    await clickFixLink(page, 'Income tax declarations', 'Company PAN (Tax ID) on the Company');
    expect(page.url()).toContain('/company/');

    const desk = new FrappeDeskPage(page);
    await desk.fillField('tax_id', 'AABCC1234D');
    await desk.save();

    await setupPage.goto();
    await setupPage.expectCheckOk('Income tax declarations', 'Company PAN (Tax ID) on the Company');
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 18. Income tax — declaration windows (advisory)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe.serial('Setup flow — 18. Income tax: declaration windows', () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await loginAdmin(p);

    // Remove existing Tax Declaration Settings so the check fails.
    const existing = await listDocs(p, 'Tax Declaration Settings', {}, ['name']);
    for (const e of existing as Array<{ name: string }>) {
      try { await deleteDoc(p, 'Tax Declaration Settings', e.name); } catch { /**/ }
    }

    // A Payroll Period is required by the Tax Declaration Settings form.
    const pps = await listDocs(p, 'Payroll Period', {}, ['name']);
    if (pps.length === 0) {
      created.payrollPeriod = await createDoc(p, 'Payroll Period', {
        company: COMPANY,
        start_date: yearStart(),
        end_date: yearEnd(),
      });
    }
    await ctx.close();
  });

  test('Fix: create Tax Declaration Settings via UI → advisory check turns green', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    const isOk = await setupPage.isCheckOk('Income tax declarations', 'Declaration and proof windows');
    if (isOk) { await setupPage.expectCheckOk('Income tax declarations', 'Declaration and proof windows'); return; }

    await clickFixLink(page, 'Income tax declarations', 'Declaration and proof windows');
    expect(page.url()).toContain('/tax-declaration-settings');

    // Find a payroll period (might have been created above).
    const pps = await listDocs(page, 'Payroll Period', { company: COMPANY }, ['name']);
    const ppName = ((pps[0] as { name: string } | undefined))?.name ?? '';
    if (!ppName) { test.skip(); return; }

    await page.locator('.page-head button:has-text("New"), .btn-primary:has-text("New")').first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const desk = new FrappeDeskPage(page);
    await desk.setLinkField('company', COMPANY);
    await desk.setLinkField('payroll_period', ppName);
    await desk.save();
    created.taxDeclSettings = await desk.currentDocName();

    await setupPage.goto();
    await setupPage.expectCheckOk('Income tax declarations', 'Declaration and proof windows');
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 19. Attendance — office location (advisory)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe.serial('Setup flow — 19. Attendance: office location', () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await loginAdmin(p);
    // Clear office coordinates so the advisory check fails.
    try { await updateDoc(p, 'CS Attendance Settings', 'CS Attendance Settings', { office_latitude: '', office_longitude: '' }); } catch { /**/ }
    await ctx.close();
  });

  test('Fix: set office coordinates in CS Attendance Settings → advisory check turns green', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    const isOk = await setupPage.isCheckOk('Attendance', 'Your office location');
    if (isOk) { await setupPage.expectCheckOk('Attendance', 'Your office location'); return; }

    await clickFixLink(page, 'Attendance', 'Your office location');
    expect(page.url()).toContain('/cs-attendance-settings');

    // Bangalore, India coordinates (not the shipped default 18.571240, 73.785281).
    const desk = new FrappeDeskPage(page);
    await desk.fillField('office_latitude', '12.97194');
    await desk.fillField('office_longitude', '77.59369');
    await desk.save();

    await setupPage.goto();
    await setupPage.expectCheckOk('Attendance', 'Your office location');
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 20. HR documents — letterhead (advisory)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe.serial('Setup flow — 20. HR documents: letterhead', () => {
  test.beforeAll(async ({ browser }) => {
    // Disable existing default letterheads so the advisory check fails.
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await loginAdmin(p);
    const existing = await listDocs(p, 'Letter Head', { is_default: 1 }, ['name']);
    for (const lh of existing as Array<{ name: string }>) {
      try { await updateDoc(p, 'Letter Head', lh.name, { is_default: 0 }); } catch { /**/ }
    }
    await ctx.close();
  });

  test('Fix: create a default Letterhead → advisory check turns green', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    const isOk = await setupPage.isCheckOk('HR documents', 'Your letterhead');
    if (isOk) { await setupPage.expectCheckOk('HR documents', 'Your letterhead'); return; }

    // Create via API — the letterhead form uses a rich HTML editor that is hard to drive.
    created.letterhead = await createDoc(page, 'Letter Head', {
      letter_head_name: `E2E Letterhead ${currentYear()}`,
      is_default: 1,
      disabled: 0,
      content: '<div style="text-align:center"><strong>Coditation</strong></div>',
    });

    await setupPage.goto();
    await setupPage.expectCheckOk('HR documents', 'Your letterhead');
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 21. Email and access — finance upload recipients (advisory)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe.serial('Setup flow — 21. Email and access: finance upload recipients', () => {
  test.beforeAll(async ({ browser }) => {
    // Clear users so the advisory check fails.
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await loginAdmin(p);
    try { await updateDoc(p, 'CS Recipient List', 'finance_upload', { users: [] }); } catch { /**/ }
    await ctx.close();
  });

  test('Fix: add a user to finance_upload recipient list → advisory check turns green', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    const isOk = await setupPage.isCheckOk('Email and access', 'Who may upload historical finance data');
    if (isOk) { await setupPage.expectCheckOk('Email and access', 'Who may upload historical finance data'); return; }

    await clickFixLink(page, 'Email and access', 'Who may upload historical finance data');
    expect(page.url()).toContain('/cs-recipient-list/finance_upload');

    // The users field is a Table MultiSelect — interact like a Link field.
    const desk = new FrappeDeskPage(page);
    await desk.setLinkField('users', 'Administrator');
    await desk.save();

    await setupPage.goto();
    await setupPage.expectCheckOk('Email and access', 'Who may upload historical finance data');
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 22. Email and access — project managers recipients (advisory)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe.serial('Setup flow — 22. Email and access: project managers recipients', () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await loginAdmin(p);
    try { await updateDoc(p, 'CS Recipient List', 'project_managers', { users: [] }); } catch { /**/ }
    await ctx.close();
  });

  test('Fix: add a user to project_managers recipient list → advisory check turns green', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    const isOk = await setupPage.isCheckOk('Email and access', 'Who manages projects');
    if (isOk) { await setupPage.expectCheckOk('Email and access', 'Who manages projects'); return; }

    await clickFixLink(page, 'Email and access', 'Who manages projects');
    expect(page.url()).toContain('/cs-recipient-list/project_managers');

    const desk = new FrappeDeskPage(page);
    await desk.setLinkField('users', 'Administrator');
    await desk.save();

    await setupPage.goto();
    await setupPage.expectCheckOk('Email and access', 'Who manages projects');
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 23. Email and access — platform settings reviewed (advisory)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe.serial('Setup flow — 23. Email and access: platform settings reviewed', () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await loginAdmin(p);
    try { await updateDoc(p, 'CS Platform Settings', 'CS Platform Settings', { reviewed: 0 }); } catch { /**/ }
    await ctx.close();
  });

  test('Fix: tick "reviewed" in CS Platform Settings → advisory check turns green', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    const isOk = await setupPage.isCheckOk('Email and access', 'Platform limits and rules reviewed');
    if (isOk) { await setupPage.expectCheckOk('Email and access', 'Platform limits and rules reviewed'); return; }

    await clickFixLink(page, 'Email and access', 'Platform limits and rules reviewed');
    expect(page.url()).toContain('/cs-platform-settings');

    const desk = new FrappeDeskPage(page);
    await desk.checkField('reviewed');
    await desk.save();

    await setupPage.goto();
    await setupPage.expectCheckOk('Email and access', 'Platform limits and rules reviewed');
  });
});
