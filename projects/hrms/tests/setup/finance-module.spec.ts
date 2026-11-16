/**
 * Payroll and Finance module setup tests.
 *
 * Blocking readiness areas:
 *   payroll        : payable account, submitted salary structure,
 *                    submitted income tax slab, salary assignment
 *   reimbursements : account per expense claim type, cost center on company
 *
 * Advisory: all employees assigned, company PAN, declaration windows.
 *
 * Test strategy: create the minimum required records via API, verify /setup
 * turns green, then tear down.
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
  getDoc,
  currentYear,
  today,
} from '../../helpers/frappe-api';

const COMPANY = 'Coditation';
const SECTION_PAYROLL = 'Payroll';
const SECTION_REIMB = 'Reimbursements';

async function loginAdmin(page: import('@playwright/test').Page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(hrmsConfig.credentials.username, hrmsConfig.credentials.password);
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });
}

async function ensurePayableAccount(page: import('@playwright/test').Page): Promise<void> {
  const company = await getDoc(page, 'Company', COMPANY, ['default_payroll_payable_account']);
  if (!company.default_payroll_payable_account) {
    // Find the Payable account under the company's chart of accounts.
    const accounts = await listDocs(
      page,
      'Account',
      { company: COMPANY, account_type: 'Payable', is_group: 0 },
      ['name', 'account_name']
    );
    if (accounts.length > 0) {
      await updateDoc(page, 'Company', COMPANY, {
        default_payroll_payable_account: accounts[0].name,
      });
    }
  }
}

async function ensureCostCenter(page: import('@playwright/test').Page): Promise<void> {
  const company = await getDoc(page, 'Company', COMPANY, ['cost_center']);
  if (!company.cost_center) {
    const centers = await listDocs(page, 'Cost Center', { company: COMPANY, is_group: 0 }, ['name']);
    if (centers.length > 0) {
      await updateDoc(page, 'Company', COMPANY, { cost_center: centers[0].name });
    }
  }
}

test.describe('Payroll and Finance — required checks', () => {
  let structureName = '';
  let taxSlabName = '';
  let assignmentName = '';

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await loginAdmin(page);

    // 1. Payroll payable account on the Company.
    await ensurePayableAccount(page);

    // 2. Submitted salary structure.
    const existing = await listDocs(
      page,
      'Salary Structure',
      { docstatus: 1, is_active: 'Yes', company: COMPANY },
      ['name']
    );
    if (existing.length === 0) {
      structureName = await createDoc(page, 'Salary Structure', {
        name: `E2E Basic Structure ${currentYear()}`,
        company: COMPANY,
        is_active: 'Yes',
        payroll_frequency: 'Monthly',
        salary_component: 'Basic',
        earnings: [
          { salary_component: 'Basic', amount_based_on_formula: 0, amount: 10000 },
        ],
      });
      await submitDoc(page, 'Salary Structure', structureName);
    } else {
      structureName = existing[0].name as string;
    }

    // 3. Submitted income tax slab.
    const slabs = await listDocs(
      page,
      'Income Tax Slab',
      { docstatus: 1, disabled: 0 },
      ['name']
    );
    const realSlabs = (slabs as Array<{ name: string }>).filter((s) => !s.name.startsWith('_Test'));
    if (realSlabs.length === 0) {
      taxSlabName = await createDoc(page, 'Income Tax Slab', {
        name: `E2E Tax Slab ${currentYear()}`,
        effective_from: `${currentYear()}-04-01`,
        allow_tax_exemption: 0,
        slabs: [
          { from_amount: 0, to_amount: 300000, percent_deduction: 0 },
          { from_amount: 300001, to_amount: 600000, percent_deduction: 5 },
          { from_amount: 600001, to_amount: 900000, percent_deduction: 10 },
        ],
      });
      await submitDoc(page, 'Income Tax Slab', taxSlabName);
    } else {
      taxSlabName = realSlabs[0].name;
    }

    // 4. Salary structure assignment for the first active employee.
    const employees = await listDocs(page, 'Employee', { status: 'Active', company: COMPANY }, ['name']);
    if (employees.length > 0) {
      const emp = employees[0].name as string;
      const assignExisting = await listDocs(
        page,
        'Salary Structure Assignment',
        { employee: emp, docstatus: 1 },
        ['name']
      );
      if (assignExisting.length === 0) {
        assignmentName = await createDoc(page, 'Salary Structure Assignment', {
          employee: emp,
          salary_structure: structureName,
          from_date: `${currentYear()}-01-01`,
          base: 10000,
          income_tax_slab: taxSlabName,
        });
        await submitDoc(page, 'Salary Structure Assignment', assignmentName);
      } else {
        assignmentName = assignExisting[0].name as string;
      }
    }

    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await loginAdmin(page);

    if (assignmentName) {
      try { await cancelDoc(page, 'Salary Structure Assignment', assignmentName); } catch { /**/ }
      try { await deleteDoc(page, 'Salary Structure Assignment', assignmentName); } catch { /**/ }
    }
    if (taxSlabName) {
      try { await cancelDoc(page, 'Income Tax Slab', taxSlabName); } catch { /**/ }
      try { await deleteDoc(page, 'Income Tax Slab', taxSlabName); } catch { /**/ }
    }
    if (structureName) {
      try { await cancelDoc(page, 'Salary Structure', structureName); } catch { /**/ }
      try { await deleteDoc(page, 'Salary Structure', structureName); } catch { /**/ }
    }

    await ctx.close();
  });

  test('Payroll section shows Ready when payable account, structure, slab and assignment all exist', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    await setupPage.expectCheckOk(SECTION_PAYROLL, 'Payroll payable account on the Company');
    await setupPage.expectCheckOk(SECTION_PAYROLL, 'A submitted salary structure');
    await setupPage.expectCheckOk(SECTION_PAYROLL, 'A submitted income tax slab');
    await setupPage.expectCheckOk(SECTION_PAYROLL, 'Salary assigned to employees');
    await setupPage.expectSectionReady(SECTION_PAYROLL);
  });

  test('"Every active employee has a salary assigned" is advisory', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();
    const isOpt = await setupPage.isCheckOptional(SECTION_PAYROLL, 'Every active employee has a salary assigned');
    expect(isOpt).toBe(true);
  });

  test('Payroll section shows Not ready when no salary structure is submitted', async ({ page }) => {
    await loginAdmin(page);

    // Skip if there are submitted structures OTHER than ours — we can't remove
    // pre-existing data, so the check can't be driven to "not ready".
    if (!structureName) { test.skip(); return; }
    const others = await listDocs(
      page, 'Salary Structure',
      { docstatus: 1, is_active: 'Yes', company: COMPANY, name: ['!=', structureName] },
      ['name']
    );
    if ((others as Array<unknown>).length > 0) { test.skip(); return; }

    try { await cancelDoc(page, 'Salary Structure', structureName); } catch { test.skip(); return; }

    const setupPage = new SetupPage(page);
    await setupPage.goto();
    await setupPage.expectCheckMissing(SECTION_PAYROLL, 'A submitted salary structure');
    await setupPage.expectSectionNotReady(SECTION_PAYROLL);

    // Restore.
    await submitDoc(page, 'Salary Structure', structureName);
  });

  test('Fix-in-Desk URL for salary structure points to /app/salary-structure', async ({ page }) => {
    await loginAdmin(page);

    // Skip if other submitted structures exist — the check would still pass
    // after cancelling ours, so the fix link would never appear.
    if (!structureName) { test.skip(); return; }
    const others = await listDocs(
      page, 'Salary Structure',
      { docstatus: 1, is_active: 'Yes', company: COMPANY, name: ['!=', structureName] },
      ['name']
    );
    if ((others as Array<unknown>).length > 0) { test.skip(); return; }

    try { await cancelDoc(page, 'Salary Structure', structureName); } catch { test.skip(); return; }

    const setupPage = new SetupPage(page);
    await setupPage.goto();
    const fixUrl = await setupPage.checkFixUrl(SECTION_PAYROLL, 'A submitted salary structure');
    expect(fixUrl).toBe('/app/salary-structure');

    // Restore.
    await submitDoc(page, 'Salary Structure', structureName);
  });
});

test.describe('Payroll and Finance — Reimbursements checks', () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await loginAdmin(page);

    // Ensure cost center is set on company.
    await ensureCostCenter(page);

    // Ensure every Expense Claim Type has an account for COMPANY.
    // NOTE: 'Expense Claim Account' is a child doctype — it cannot be listed
    // directly via REST API (returns 403). Read each parent doc instead.
    // The chart of accounts may not have an 'Expense Account' type account, so
    // fall back to any account that is already set on another type (known to work).
    const types = await listDocs(page, 'Expense Claim Type', {}, ['name']);

    // First pass: collect an account already in use for COMPANY on any type.
    let fallbackAccount = '';
    for (const t of types as Array<{ name: string }>) {
      const doc = await getDoc(page, 'Expense Claim Type', t.name);
      const existing = ((doc.accounts as Array<{ company: string; default_account: string }>) || [])
        .find((a) => a.company === COMPANY && a.default_account);
      if (existing) { fallbackAccount = existing.default_account; break; }
    }
    // If no type has an account yet, try to find one in the chart of accounts.
    if (!fallbackAccount) {
      const expAccounts = await listDocs(
        page, 'Account',
        { company: COMPANY, account_type: 'Expense Account', is_group: 0 },
        ['name']
      );
      if ((expAccounts as Array<unknown>).length > 0) {
        fallbackAccount = (expAccounts[0] as { name: string }).name;
      }
    }

    // Second pass: add the fallback account to types that don't have one.
    for (const t of types as Array<{ name: string }>) {
      const typDoc = await getDoc(page, 'Expense Claim Type', t.name);
      const accountsList = (typDoc.accounts as Array<{ company: string; default_account: string }>) || [];
      const companyAccount = accountsList.find((a) => a.company === COMPANY);
      if ((!companyAccount || !companyAccount.default_account) && fallbackAccount) {
        await updateDoc(page, 'Expense Claim Type', t.name, {
          accounts: [
            ...accountsList.filter((a) => a.company !== COMPANY),
            { company: COMPANY, default_account: fallbackAccount },
          ],
        });
      }
    }

    await ctx.close();
  });

  test('Reimbursements section shows Ready when claim accounts and cost center are set', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();

    await setupPage.expectCheckOk(SECTION_REIMB, 'An account for each expense claim type');
    await setupPage.expectCheckOk(SECTION_REIMB, 'A default cost center on the Company');
    await setupPage.expectSectionReady(SECTION_REIMB);
  });

  test('Reimbursements check links to /app/expense-claim-type for the accounts fix', async ({ page }) => {
    await loginAdmin(page);

    // The fix link only appears when the check fails. Remove the company account
    // from the first Expense Claim Type, get the fix URL, then restore.
    const types = await listDocs(page, 'Expense Claim Type', {}, ['name']);
    let removedFrom = '';
    let removedAccounts: unknown[] = [];
    if ((types as Array<{ name: string }>).length > 0) {
      const firstName = (types[0] as { name: string }).name;
      const typDoc = await getDoc(page, 'Expense Claim Type', firstName);
      removedFrom = firstName;
      removedAccounts = (typDoc.accounts as unknown[]) || [];
      await updateDoc(page, 'Expense Claim Type', firstName, {
        accounts: (removedAccounts as Array<{ company: string }>).filter((a) => a.company !== COMPANY),
      });
    }

    const setupPage = new SetupPage(page);
    await setupPage.goto();
    const fixUrl = await setupPage.checkFixUrl(SECTION_REIMB, 'An account for each expense claim type');
    expect(fixUrl).toBe('/app/expense-claim-type');

    // Restore.
    if (removedFrom) {
      await updateDoc(page, 'Expense Claim Type', removedFrom, { accounts: removedAccounts });
    }
  });
});

test.describe('Payroll and Finance — advisory income tax checks', () => {
  test('Company PAN check is advisory', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();
    const isOpt = await setupPage.isCheckOptional('Income tax declarations', 'Company PAN (Tax ID) on the Company');
    expect(isOpt).toBe(true);
  });

  test('Declaration and proof windows check is advisory', async ({ page }) => {
    await loginAdmin(page);
    const setupPage = new SetupPage(page);
    await setupPage.goto();
    const isOpt = await setupPage.isCheckOptional('Income tax declarations', 'Declaration and proof windows');
    expect(isOpt).toBe(true);
  });
});
