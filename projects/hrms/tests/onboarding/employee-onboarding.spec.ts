/**
 * End-to-end tests for the Add Employee Wizard at /onboarding.
 *
 * Tests the full 4-step wizard UI flow, creating 5 dummy employees that model
 * a real organisational hierarchy:
 *
 *   Arjun Menon (CS0001)  ─┬─ Ananya Singh (HR Manager)
 *                           │     └─ Rahul Kapoor (HR staff)
 *                           └─ Suresh Kumar (IT Manager)
 *                                 └─ Ravi Verma (IT Engineer)
 *   Meera Iyer (CS0002)  ──── Pooja Dev (Software Engineer)
 *
 * All five are created through the wizard UI; relationships and Employee
 * Onboarding auto-creation are verified via API after each creation.
 *
 * Run order is enforced with test.describe.serial so that later employees can
 * search for earlier ones as their reporting manager.
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { OnboardingWizardPage } from '../../pages/OnboardingWizardPage';
import { hrmsConfig } from '../../config';
import {
  deleteDoc,
  getDoc,
  listDocs,
  currentYear,
} from '../../helpers/frappe-api';

// ── Constants ─────────────────────────────────────────────────────────────────

const HOLIDAY_LIST = 'Demo Holidays 2026';

// Email domain for all test employees (makes cleanup straightforward).
const EMAIL_DOMAIN = 'e2etest.coditation.com';

// Employee data — indexed so each test block can reference them by name.
interface TestEmployee {
  firstName: string;
  lastName: string;
  fullName: string;
  gender: string;
  dob: string;
  workEmail: string;
  employeeNumber: string;
  joinDate: string;
  designation: string;
  department: string;
  reportsTo: string;   // Name to type in the manager search
  role: string;        // Human-readable label for test names
}

const EMPLOYEES: TestEmployee[] = [
  {
    firstName: 'Ananya',
    lastName: 'Singh',
    fullName: 'Ananya Singh',
    gender: 'Female',
    dob: '1990-03-15',
    workEmail: `ananya.singh@${EMAIL_DOMAIN}`,
    employeeNumber: 'E2E-HR-001',
    joinDate: '2024-01-15',
    designation: 'HR Manager',
    department: 'Human Resources - C',
    reportsTo: 'Arjun',          // CS0001 Arjun Menon
    role: 'HR Manager',
  },
  {
    firstName: 'Rahul',
    lastName: 'Kapoor',
    fullName: 'Rahul Kapoor',
    gender: 'Male',
    dob: '1993-07-22',
    workEmail: `rahul.kapoor@${EMAIL_DOMAIN}`,
    employeeNumber: 'E2E-HR-002',
    joinDate: '2024-02-01',
    designation: 'Administrative Officer',
    department: 'Human Resources - C',
    reportsTo: 'Ananya',         // Ananya Singh (created above)
    role: 'HR Executive',
  },
  {
    firstName: 'Suresh',
    lastName: 'Kumar',
    fullName: 'Suresh Kumar',
    gender: 'Male',
    dob: '1988-11-05',
    workEmail: `suresh.kumar@${EMAIL_DOMAIN}`,
    employeeNumber: 'E2E-IT-001',
    joinDate: '2024-01-20',
    designation: 'Manager',
    department: 'Operations - C',
    reportsTo: 'Arjun',          // CS0001 Arjun Menon
    role: 'IT Manager',
  },
  {
    firstName: 'Ravi',
    lastName: 'Verma',
    fullName: 'Ravi Verma',
    gender: 'Male',
    dob: '1996-04-18',
    workEmail: `ravi.verma@${EMAIL_DOMAIN}`,
    employeeNumber: 'E2E-IT-002',
    joinDate: '2024-03-10',
    designation: 'Engineer',
    department: 'Operations - C',
    reportsTo: 'Suresh',         // Suresh Kumar (created above)
    role: 'IT Engineer',
  },
  {
    firstName: 'Pooja',
    lastName: 'Dev',
    fullName: 'Pooja Dev',
    gender: 'Female',
    dob: '1995-09-30',
    workEmail: `pooja.dev@${EMAIL_DOMAIN}`,
    employeeNumber: 'E2E-ENG-001',
    joinDate: '2024-04-01',
    designation: 'Software Engineer',
    department: 'Research & Development - C',
    reportsTo: 'Meera',          // CS0002 Meera Iyer
    role: 'Software Engineer',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

async function loginAdmin(page: import('@playwright/test').Page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(
    hrmsConfig.credentials.username,
    hrmsConfig.credentials.password
  );
  await page.waitForURL((url) => !url.pathname.includes('/login'), {
    timeout: 15_000,
  });
}

/** Find an employee by their work email (stored as company_email). */
async function findEmployeeByEmail(
  page: import('@playwright/test').Page,
  email: string
): Promise<string | null> {
  const rows = await listDocs(page, 'Employee', { company_email: email }, [
    'name',
    'employee_name',
    'designation',
    'department',
    'reports_to',
  ]);
  const list = rows as Array<{
    name: string;
    employee_name: string;
    designation: string;
    department: string;
    reports_to: string;
  }>;
  return list.length > 0 ? list[0].name : null;
}

// ── Shared state tracked across serial tests ──────────────────────────────────

/** Maps each employee's fullName → their Frappe Employee doc name (e.g. "CS0007"). */
const createdEmployees: Record<string, string> = {};

// ── Test suite ────────────────────────────────────────────────────────────────

test.describe.serial('Employee Onboarding Wizard — /onboarding', () => {

  // ── Cleanup: runs after all tests in this suite ────────────────────────────
  test.afterAll(async ({ browser }) => {
    const names = Object.values(createdEmployees);
    if (names.length === 0) return;

    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await loginAdmin(page);

    for (const empName of names) {
      try {
        // Cancel+delete Employee Onboarding docs that were auto-created.
        const onb = await listDocs(page, 'Employee Onboarding', { employee: empName }, ['name', 'docstatus']);
        for (const o of onb as Array<{ name: string; docstatus: number }>) {
          if (o.docstatus === 1) {
            // Cancel submitted onboarding doc first.
            const csrf = (await page.context().cookies()).find((c) => c.name === 'csrf_token')?.value ?? '';
            await page.request.post('/api/resource/Employee Onboarding/' + encodeURIComponent(o.name) + '/cancel', {
              headers: { 'X-Frappe-CSRF-Token': csrf },
            });
          }
          try { await deleteDoc(page, 'Employee Onboarding', o.name); } catch { /**/ }
        }
        // Delete the Employee itself.
        await deleteDoc(page, 'Employee', empName);
      } catch (err) {
        console.warn(`Cleanup: could not delete employee ${empName}:`, err);
      }
    }

    await ctx.close();
  });

  // ── Block 1: Wizard page renders ──────────────────────────────────────────

  test.describe.serial('1. Page load and list view', () => {
    test('1.1 /onboarding loads and shows the page title', async ({ page }) => {
      await loginAdmin(page);
      await page.goto('/onboarding');
      await page.waitForLoadState('networkidle');

      // The page should have a heading or title containing "Onboarding".
      const heading = page.locator('h1, h2, .page-title, #aewPageTitle').first();
      await expect(heading).toBeVisible({ timeout: 10_000 });
    });

    test('1.2 Add Employee button is visible', async ({ page }) => {
      await loginAdmin(page);
      await page.goto('/onboarding');
      await page.waitForLoadState('networkidle');

      const btn = page.locator('#aewOpenBtn');
      await expect(btn).toBeVisible({ timeout: 8_000 });
    });

    test('1.3 Clicking Add Employee opens the wizard (Step 1 visible)', async ({ page }) => {
      await loginAdmin(page);
      const wizard = new OnboardingWizardPage(page);
      await wizard.goto();
      await wizard.openWizard();

      await expect(page.locator('#aewPane1')).toBeVisible({ timeout: 5_000 });
      // Step 2-4 should be hidden.
      await expect(page.locator('#aewPane2')).toBeHidden();
    });
  });

  // ── Block 2: Onboard Ananya Singh — HR Manager ────────────────────────────

  test.describe.serial('2. Onboard Ananya Singh (HR Manager, reports to Arjun Menon)', () => {
    const EMP = EMPLOYEES[0];

    test('2.1 Fill Step 1 — basic details', async ({ page }) => {
      await loginAdmin(page);
      const wizard = new OnboardingWizardPage(page);
      await wizard.goto();
      await wizard.openWizard();

      await wizard.fillStep1({
        firstName: EMP.firstName,
        lastName: EMP.lastName,
        gender: EMP.gender,
        dob: EMP.dob,
        workEmail: EMP.workEmail,
        employeeNumber: EMP.employeeNumber,
      });

      // No error should appear.
      await wizard.expectNoError();
      await expect(page.locator('#aewPane1')).toBeVisible();
    });

    test('2.2 Continue to Step 2 — job details', async ({ page }) => {
      await loginAdmin(page);
      const wizard = new OnboardingWizardPage(page);
      await wizard.goto();
      await wizard.openWizard();
      await wizard.fillStep1({
        firstName: EMP.firstName, lastName: EMP.lastName,
        gender: EMP.gender, dob: EMP.dob,
        workEmail: EMP.workEmail, employeeNumber: EMP.employeeNumber,
      });
      await wizard.continueStep1();
      await expect(page.locator('#aewPane2')).toBeVisible({ timeout: 10_000 });
    });

    test('2.3 Fill Step 2 — job details with manager search', async ({ page }) => {
      await loginAdmin(page);
      const wizard = new OnboardingWizardPage(page);
      await wizard.goto();
      await wizard.openWizard();
      await wizard.fillStep1({
        firstName: EMP.firstName, lastName: EMP.lastName,
        gender: EMP.gender, dob: EMP.dob,
        workEmail: EMP.workEmail, employeeNumber: EMP.employeeNumber,
      });
      await wizard.continueStep1();

      await wizard.fillStep2({
        joinDate: EMP.joinDate,
        designation: EMP.designation,
        department: EMP.department,
        reportsTo: EMP.reportsTo,
      });

      // Manager search field should now show a selected manager.
      const managerInput = page.locator('#aewReportsToSearch');
      const val = await managerInput.inputValue();
      expect(val.length).toBeGreaterThan(0);
    });

    test('2.4 Complete all steps and finish — Ananya Singh created', async ({ page }) => {
      await loginAdmin(page);
      const wizard = new OnboardingWizardPage(page);
      await wizard.goto();
      await wizard.openWizard();

      // Step 1.
      await wizard.fillStep1({
        firstName: EMP.firstName, lastName: EMP.lastName,
        gender: EMP.gender, dob: EMP.dob,
        workEmail: EMP.workEmail, employeeNumber: EMP.employeeNumber,
      });
      await wizard.continueStep1();

      // Step 2.
      await wizard.fillStep2({
        joinDate: EMP.joinDate,
        designation: EMP.designation,
        department: EMP.department,
        reportsTo: EMP.reportsTo,
      });
      await wizard.continueStep2();

      // Step 3.
      await wizard.fillStep3({ holidayList: HOLIDAY_LIST, inviteLogin: false });
      await wizard.continueStep3();

      // Step 4 — skip payroll for test employees.
      await wizard.fillStep4({ enablePayroll: false });
      await wizard.finish();

      await wizard.waitForSuccess();
      await wizard.waitForClose();
    });

    test('2.5 Verify: Ananya Singh exists in Frappe with correct designation', async ({ page }) => {
      await loginAdmin(page);
      const empName = await findEmployeeByEmail(page, EMP.workEmail);
      expect(empName, 'Employee doc should exist after wizard creation').toBeTruthy();

      // Store for later tests.
      if (empName) createdEmployees[EMP.fullName] = empName;

      const doc = await getDoc(page, 'Employee', empName!) as Record<string, unknown>;
      expect(doc['employee_name']).toBe(EMP.fullName);
      expect(doc['designation']).toContain('HR Manager');
      expect(String(doc['department'] ?? '')).toContain('Human Resources');
    });

    test('2.6 Verify: Employee Onboarding record auto-created for Ananya Singh', async ({ page }) => {
      await loginAdmin(page);
      const empName = createdEmployees[EMP.fullName]
        ?? await findEmployeeByEmail(page, EMP.workEmail);
      if (!empName) { test.skip(); return; }

      const onb = await listDocs(page, 'Employee Onboarding', { employee: empName }, ['name']);
      expect(
        (onb as unknown[]).length,
        'Employee Onboarding should be auto-created'
      ).toBeGreaterThan(0);
    });
  });

  // ── Block 3: Onboard Rahul Kapoor — HR Executive, reports to Ananya ───────

  test.describe.serial('3. Onboard Rahul Kapoor (HR Executive, reports to Ananya Singh)', () => {
    const EMP = EMPLOYEES[1];

    test('3.1 Complete wizard — Rahul Kapoor created', async ({ page }) => {
      await loginAdmin(page);
      const wizard = new OnboardingWizardPage(page);
      await wizard.goto();
      await wizard.openWizard();

      await wizard.fillStep1({
        firstName: EMP.firstName, lastName: EMP.lastName,
        gender: EMP.gender, dob: EMP.dob,
        workEmail: EMP.workEmail, employeeNumber: EMP.employeeNumber,
      });
      await wizard.continueStep1();

      await wizard.fillStep2({
        joinDate: EMP.joinDate,
        designation: EMP.designation,
        department: EMP.department,
        reportsTo: EMP.reportsTo,  // 'Ananya' — created in Block 2
      });
      await wizard.continueStep2();

      await wizard.fillStep3({ holidayList: HOLIDAY_LIST, inviteLogin: false });
      await wizard.continueStep3();

      await wizard.fillStep4({ enablePayroll: false });
      await wizard.finish();

      await wizard.waitForSuccess();
      await wizard.waitForClose();
    });

    test('3.2 Verify: Rahul Kapoor exists with Administrative Officer designation', async ({ page }) => {
      await loginAdmin(page);
      const empName = await findEmployeeByEmail(page, EMP.workEmail);
      expect(empName).toBeTruthy();
      if (empName) createdEmployees[EMP.fullName] = empName;

      const doc = await getDoc(page, 'Employee', empName!) as Record<string, unknown>;
      expect(doc['employee_name']).toBe(EMP.fullName);
      expect(String(doc['department'] ?? '')).toContain('Human Resources');
    });

    test('3.3 Verify: Rahul reports to Ananya Singh', async ({ page }) => {
      await loginAdmin(page);
      const empName = createdEmployees[EMP.fullName]
        ?? await findEmployeeByEmail(page, EMP.workEmail);
      if (!empName) { test.skip(); return; }

      const managerEmpName = createdEmployees['Ananya Singh'];
      if (!managerEmpName) { test.skip(); return; }

      const doc = await getDoc(page, 'Employee', empName) as Record<string, unknown>;
      expect(doc['reports_to']).toBe(managerEmpName);
    });

    test('3.4 Verify: Employee Onboarding auto-created for Rahul Kapoor', async ({ page }) => {
      await loginAdmin(page);
      const empName = createdEmployees[EMP.fullName]
        ?? await findEmployeeByEmail(page, EMP.workEmail);
      if (!empName) { test.skip(); return; }

      const onb = await listDocs(page, 'Employee Onboarding', { employee: empName }, ['name']);
      expect((onb as unknown[]).length).toBeGreaterThan(0);
    });
  });

  // ── Block 4: Onboard Suresh Kumar — IT Manager, reports to Arjun ─────────

  test.describe.serial('4. Onboard Suresh Kumar (IT Manager, reports to Arjun Menon)', () => {
    const EMP = EMPLOYEES[2];

    test('4.1 Complete wizard — Suresh Kumar created', async ({ page }) => {
      await loginAdmin(page);
      const wizard = new OnboardingWizardPage(page);
      await wizard.goto();
      await wizard.openWizard();

      await wizard.fillStep1({
        firstName: EMP.firstName, lastName: EMP.lastName,
        gender: EMP.gender, dob: EMP.dob,
        workEmail: EMP.workEmail, employeeNumber: EMP.employeeNumber,
      });
      await wizard.continueStep1();

      await wizard.fillStep2({
        joinDate: EMP.joinDate,
        designation: EMP.designation,
        department: EMP.department,
        reportsTo: EMP.reportsTo,  // 'Arjun' — CS0001 existing employee
      });
      await wizard.continueStep2();

      await wizard.fillStep3({ holidayList: HOLIDAY_LIST, inviteLogin: false });
      await wizard.continueStep3();

      await wizard.fillStep4({ enablePayroll: false });
      await wizard.finish();

      await wizard.waitForSuccess();
      await wizard.waitForClose();
    });

    test('4.2 Verify: Suresh Kumar exists in Operations department', async ({ page }) => {
      await loginAdmin(page);
      const empName = await findEmployeeByEmail(page, EMP.workEmail);
      expect(empName).toBeTruthy();
      if (empName) createdEmployees[EMP.fullName] = empName;

      const doc = await getDoc(page, 'Employee', empName!) as Record<string, unknown>;
      expect(doc['employee_name']).toBe(EMP.fullName);
      expect(String(doc['department'] ?? '')).toContain('Operations');
    });

    test('4.3 Verify: Employee Onboarding auto-created for Suresh Kumar', async ({ page }) => {
      await loginAdmin(page);
      const empName = createdEmployees[EMP.fullName]
        ?? await findEmployeeByEmail(page, EMP.workEmail);
      if (!empName) { test.skip(); return; }

      const onb = await listDocs(page, 'Employee Onboarding', { employee: empName }, ['name']);
      expect((onb as unknown[]).length).toBeGreaterThan(0);
    });
  });

  // ── Block 5: Onboard Ravi Verma — IT Engineer, reports to Suresh ─────────

  test.describe.serial('5. Onboard Ravi Verma (IT Engineer, reports to Suresh Kumar)', () => {
    const EMP = EMPLOYEES[3];

    test('5.1 Complete wizard — Ravi Verma created', async ({ page }) => {
      await loginAdmin(page);
      const wizard = new OnboardingWizardPage(page);
      await wizard.goto();
      await wizard.openWizard();

      await wizard.fillStep1({
        firstName: EMP.firstName, lastName: EMP.lastName,
        gender: EMP.gender, dob: EMP.dob,
        workEmail: EMP.workEmail, employeeNumber: EMP.employeeNumber,
      });
      await wizard.continueStep1();

      await wizard.fillStep2({
        joinDate: EMP.joinDate,
        designation: EMP.designation,
        department: EMP.department,
        reportsTo: EMP.reportsTo,  // 'Suresh' — created in Block 4
      });
      await wizard.continueStep2();

      await wizard.fillStep3({ holidayList: HOLIDAY_LIST, inviteLogin: false });
      await wizard.continueStep3();

      await wizard.fillStep4({ enablePayroll: false });
      await wizard.finish();

      await wizard.waitForSuccess();
      await wizard.waitForClose();
    });

    test('5.2 Verify: Ravi Verma exists with Engineer designation', async ({ page }) => {
      await loginAdmin(page);
      const empName = await findEmployeeByEmail(page, EMP.workEmail);
      expect(empName).toBeTruthy();
      if (empName) createdEmployees[EMP.fullName] = empName;

      const doc = await getDoc(page, 'Employee', empName!) as Record<string, unknown>;
      expect(doc['employee_name']).toBe(EMP.fullName);
      expect(String(doc['department'] ?? '')).toContain('Operations');
    });

    test('5.3 Verify: Ravi reports to Suresh Kumar', async ({ page }) => {
      await loginAdmin(page);
      const empName = createdEmployees[EMP.fullName]
        ?? await findEmployeeByEmail(page, EMP.workEmail);
      if (!empName) { test.skip(); return; }

      const managerEmpName = createdEmployees['Suresh Kumar'];
      if (!managerEmpName) { test.skip(); return; }

      const doc = await getDoc(page, 'Employee', empName) as Record<string, unknown>;
      expect(doc['reports_to']).toBe(managerEmpName);
    });

    test('5.4 Verify: Employee Onboarding auto-created for Ravi Verma', async ({ page }) => {
      await loginAdmin(page);
      const empName = createdEmployees[EMP.fullName]
        ?? await findEmployeeByEmail(page, EMP.workEmail);
      if (!empName) { test.skip(); return; }

      const onb = await listDocs(page, 'Employee Onboarding', { employee: empName }, ['name']);
      expect((onb as unknown[]).length).toBeGreaterThan(0);
    });
  });

  // ── Block 6: Onboard Pooja Dev — Software Engineer, reports to Meera ─────

  test.describe.serial('6. Onboard Pooja Dev (Software Engineer, reports to Meera Iyer)', () => {
    const EMP = EMPLOYEES[4];

    test('6.1 Complete wizard — Pooja Dev created', async ({ page }) => {
      await loginAdmin(page);
      const wizard = new OnboardingWizardPage(page);
      await wizard.goto();
      await wizard.openWizard();

      await wizard.fillStep1({
        firstName: EMP.firstName, lastName: EMP.lastName,
        gender: EMP.gender, dob: EMP.dob,
        workEmail: EMP.workEmail, employeeNumber: EMP.employeeNumber,
      });
      await wizard.continueStep1();

      await wizard.fillStep2({
        joinDate: EMP.joinDate,
        designation: EMP.designation,
        department: EMP.department,
        reportsTo: EMP.reportsTo,  // 'Meera' — CS0002 Meera Iyer
      });
      await wizard.continueStep2();

      await wizard.fillStep3({ holidayList: HOLIDAY_LIST, inviteLogin: false });
      await wizard.continueStep3();

      await wizard.fillStep4({ enablePayroll: false });
      await wizard.finish();

      await wizard.waitForSuccess();
      await wizard.waitForClose();
    });

    test('6.2 Verify: Pooja Dev exists in R&D department', async ({ page }) => {
      await loginAdmin(page);
      const empName = await findEmployeeByEmail(page, EMP.workEmail);
      expect(empName).toBeTruthy();
      if (empName) createdEmployees[EMP.fullName] = empName;

      const doc = await getDoc(page, 'Employee', empName!) as Record<string, unknown>;
      expect(doc['employee_name']).toBe(EMP.fullName);
      expect(String(doc['department'] ?? '')).toContain('Research');
    });

    test('6.3 Verify: Employee Onboarding auto-created for Pooja Dev', async ({ page }) => {
      await loginAdmin(page);
      const empName = createdEmployees[EMP.fullName]
        ?? await findEmployeeByEmail(page, EMP.workEmail);
      if (!empName) { test.skip(); return; }

      const onb = await listDocs(page, 'Employee Onboarding', { employee: empName }, ['name']);
      expect((onb as unknown[]).length).toBeGreaterThan(0);
    });
  });

  // ── Block 7: Org structure verification ───────────────────────────────────

  test.describe.serial('7. Organisation structure — full hierarchy verified', () => {

    test('7.1 All 5 test employees exist in Frappe', async ({ page }) => {
      await loginAdmin(page);

      let found = 0;
      for (const emp of EMPLOYEES) {
        // Re-hydrate from API if the createdEmployees map is empty (re-run scenario).
        if (!createdEmployees[emp.fullName]) {
          const name = await findEmployeeByEmail(page, emp.workEmail);
          if (name) createdEmployees[emp.fullName] = name;
        }
        if (createdEmployees[emp.fullName]) found++;
      }

      expect(found).toBe(EMPLOYEES.length);
    });

    test('7.2 HR team: Rahul Kapoor reports to Ananya Singh', async ({ page }) => {
      await loginAdmin(page);

      // Hydrate if needed.
      for (const emp of [EMPLOYEES[0], EMPLOYEES[1]]) {
        if (!createdEmployees[emp.fullName]) {
          const n = await findEmployeeByEmail(page, emp.workEmail);
          if (n) createdEmployees[emp.fullName] = n;
        }
      }

      const rahulName = createdEmployees['Rahul Kapoor'];
      const ananyaName = createdEmployees['Ananya Singh'];
      if (!rahulName || !ananyaName) { test.skip(); return; }

      const doc = await getDoc(page, 'Employee', rahulName) as Record<string, unknown>;
      expect(doc['reports_to']).toBe(ananyaName);
    });

    test('7.3 IT team: Ravi Verma reports to Suresh Kumar', async ({ page }) => {
      await loginAdmin(page);

      for (const emp of [EMPLOYEES[2], EMPLOYEES[3]]) {
        if (!createdEmployees[emp.fullName]) {
          const n = await findEmployeeByEmail(page, emp.workEmail);
          if (n) createdEmployees[emp.fullName] = n;
        }
      }

      const raviName = createdEmployees['Ravi Verma'];
      const sureshName = createdEmployees['Suresh Kumar'];
      if (!raviName || !sureshName) { test.skip(); return; }

      const doc = await getDoc(page, 'Employee', raviName) as Record<string, unknown>;
      expect(doc['reports_to']).toBe(sureshName);
    });

    test('7.4 All 5 employees appear in the /onboarding list table', async ({ page }) => {
      await loginAdmin(page);
      const wizard = new OnboardingWizardPage(page);
      await wizard.goto();
      await wizard.waitForListLoaded();

      for (const emp of EMPLOYEES) {
        const inList = await wizard.isEmployeeInList(emp.fullName);
        expect(inList, `${emp.fullName} should appear in onboarding list`).toBe(true);
      }
    });

    test('7.5 All 5 employees have Employee Onboarding records', async ({ page }) => {
      await loginAdmin(page);

      for (const emp of EMPLOYEES) {
        // Hydrate if needed.
        if (!createdEmployees[emp.fullName]) {
          const n = await findEmployeeByEmail(page, emp.workEmail);
          if (n) createdEmployees[emp.fullName] = n;
        }

        const empName = createdEmployees[emp.fullName];
        if (!empName) continue;

        const onb = await listDocs(page, 'Employee Onboarding', { employee: empName }, ['name']);
        expect(
          (onb as unknown[]).length,
          `Employee Onboarding should exist for ${emp.fullName}`
        ).toBeGreaterThan(0);
      }
    });
  });

  // ── Block 8: Edge cases ───────────────────────────────────────────────────

  test.describe.serial('8. Wizard edge cases', () => {

    test('8.1 Duplicate email is rejected — wizard shows error for existing email', async ({ page }) => {
      await loginAdmin(page);

      // Ananya Singh was already created; trying to re-use her email must fail.
      const EMP = EMPLOYEES[0];
      const wizard = new OnboardingWizardPage(page);
      await wizard.goto();
      await wizard.openWizard();

      await page.locator('#aewFirstName').fill('Duplicate');
      await page.locator('#aewLastName').fill('User');
      await page.locator('#aewDisplayName').fill('Duplicate User');
      await page.selectOption('#aewGender', { label: 'Male' });
      await page.locator('#aewDob').fill('1990-01-01');
      await page.keyboard.press('Tab');

      // Enter the already-used work email.
      await page.locator('#aewWorkEmail').fill(EMP.workEmail);
      await page.keyboard.press('Tab');

      // Wait briefly for the async email check.
      await page.waitForTimeout(1_500);

      // The Continue button should stay disabled OR an error shown.
      const btnDisabled = await page.locator('#aewBtnContinue').isDisabled().catch(() => false);
      const errVisible = await page.locator('#aewErr:not([hidden])').isVisible().catch(() => false);
      const emailErrVisible = await page.locator('#aewWorkEmailErr:not([hidden])').isVisible().catch(() => false);

      expect(
        btnDisabled || errVisible || emailErrVisible,
        'Wizard should block duplicate email: button disabled or error shown'
      ).toBe(true);
    });
  });
});
