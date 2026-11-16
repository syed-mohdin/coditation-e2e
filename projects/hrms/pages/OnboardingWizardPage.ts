/**
 * Page object for the Add Employee Wizard at /onboarding.
 *
 * The wizard lives on a custom portal page (not Frappe Desk) and uses
 * its own element IDs (#aew*) rather than the standard Frappe form
 * fieldname attributes. The four steps are:
 *
 *   1. Basic Details     — name, gender, DOB, email, employee number
 *   2. Job Details       — joining date, designation, employment type,
 *                          company, department, location, manager, policies
 *   3. Work Details      — onboarding template, leave plan, holiday list, shift
 *   4. Compensation      — payroll toggle and annual salary
 */
import { Page, expect } from '@playwright/test';

export interface WizardStep1 {
  firstName: string;
  lastName: string;
  displayName?: string;   // defaults to firstName + ' ' + lastName
  gender: string;         // 'Male' | 'Female' | 'Other' | 'Prefer Not To Say'
  dob: string;            // YYYY-MM-DD
  workEmail: string;
  employeeNumber: string;
  mobile?: string;
}

export interface WizardStep2 {
  joinDate: string;        // YYYY-MM-DD
  designation: string;     // option label in #aewJobTitle
  timeType?: string;       // e.g. 'Full-time'
  department: string;      // option label in #aewDepartment
  location?: string;       // option label in #aewLocation (defaults to first)
  reportsTo?: string;      // employee name to search for
  probationPolicy?: string;
  noticePeriod?: string;
}

export interface WizardStep3 {
  onboardingTemplate?: string;
  leavePlan?: string;
  holidayList: string;
  shift?: string;
  inviteLogin?: boolean;
}

export interface WizardStep4 {
  enablePayroll?: boolean;
  annualSalary?: string;
}

export class OnboardingWizardPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/onboarding');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(600);
  }

  async openWizard(): Promise<void> {
    await this.page.locator('#aewOpenBtn').click();
    await this.page.waitForSelector('#aewRoot:not([hidden])', { timeout: 5_000 });
    await this.page.waitForTimeout(400);
  }

  // ── Step 1: Basic Details ───────────────────────────────────────────────────

  async fillStep1(data: WizardStep1): Promise<void> {
    await this.page.locator('#aewFirstName').fill(data.firstName);
    await this.page.locator('#aewLastName').fill(data.lastName);

    // Display name auto-fills from first + last; optionally override.
    const displayName = data.displayName ?? `${data.firstName} ${data.lastName}`;
    await this.page.locator('#aewDisplayName').fill(displayName);

    // Gender — native <select>.
    await this.page.selectOption('#aewGender', { label: data.gender });

    // Date of Birth — native date input.
    await this.page.locator('#aewDob').fill(data.dob);
    await this.page.keyboard.press('Tab');
    await this.page.waitForTimeout(200);

    // Work email — fires async uniqueness check on blur.
    await this.page.locator('#aewWorkEmail').fill(data.workEmail);
    await this.page.keyboard.press('Tab');
    await this.page.waitForTimeout(300);

    if (data.mobile) {
      await this.page.locator('#aewMobile').fill(data.mobile);
    }

    // Pick the first available naming series.
    const seriesOpts = await this.page.locator('#aewNamingSeries option:not([value=""])').count();
    if (seriesOpts > 0) {
      await this.page.locator('#aewNamingSeries option:not([value=""])').first().click();
      // Use selectOption to properly trigger change event.
      const firstVal = await this.page.locator('#aewNamingSeries option:not([value=""])').first().getAttribute('value');
      if (firstVal) await this.page.selectOption('#aewNamingSeries', firstVal);
    }

    await this.page.locator('#aewEmpNumber').fill(data.employeeNumber);
  }

  /** Click Continue on Step 1 and wait for the async email check to finish. */
  async continueStep1(): Promise<void> {
    await this.page.locator('#aewBtnContinue').click();
    // The button is disabled while the email check runs; wait for it to re-enable
    // and for pane 2 to become visible.
    await this.page.waitForSelector('#aewPane2:not([hidden])', { timeout: 10_000 });
    await this.page.waitForTimeout(300);
  }

  // ── Step 2: Job Details ─────────────────────────────────────────────────────

  async fillStep2(data: WizardStep2): Promise<void> {
    await this.page.locator('#aewJoinDate').fill(data.joinDate);
    await this.page.keyboard.press('Tab');

    await this.page.selectOption('#aewJobTitle', { label: data.designation });

    if (data.timeType) {
      await this.page.selectOption('#aewTimeType', { label: data.timeType });
    } else {
      // Pick first available.
      const opts = await this.page.locator('#aewTimeType option:not([value=""])').count();
      if (opts > 0) {
        const v = await this.page.locator('#aewTimeType option:not([value=""])').first().getAttribute('value');
        if (v) await this.page.selectOption('#aewTimeType', v);
      }
    }

    // Company — select Coditation (or first option).
    const co = await this.page.locator('#aewCompany option:not([value=""])').count();
    if (co > 0) {
      const v = await this.page.locator('#aewCompany option:not([value=""])').first().getAttribute('value');
      if (v) await this.page.selectOption('#aewCompany', v);
    }
    await this.page.waitForTimeout(400); // Let department list filter.

    await this.page.selectOption('#aewDepartment', { label: data.department });

    if (data.location) {
      await this.page.selectOption('#aewLocation', { label: data.location });
    } else {
      const lo = await this.page.locator('#aewLocation option:not([value=""])').count();
      if (lo > 0) {
        const v = await this.page.locator('#aewLocation option:not([value=""])').first().getAttribute('value');
        if (v) await this.page.selectOption('#aewLocation', v);
      }
    }

    if (data.reportsTo) {
      await this.searchManager(data.reportsTo);
    }

    if (data.probationPolicy) {
      await this.page.selectOption('#aewProbation', { label: data.probationPolicy });
    } else {
      const pp = await this.page.locator('#aewProbation option:not([value=""])').count();
      if (pp > 0) {
        const v = await this.page.locator('#aewProbation option:not([value=""])').first().getAttribute('value');
        if (v) await this.page.selectOption('#aewProbation', v);
      }
    }

    if (data.noticePeriod) {
      await this.page.selectOption('#aewNotice', { label: data.noticePeriod });
    } else {
      const np = await this.page.locator('#aewNotice option:not([value=""])').count();
      if (np > 0) {
        const v = await this.page.locator('#aewNotice option:not([value=""])').first().getAttribute('value');
        if (v) await this.page.selectOption('#aewNotice', v);
      }
    }
  }

  /** Type in the manager search and pick the first matching result. */
  async searchManager(name: string): Promise<void> {
    const search = this.page.locator('#aewReportsToSearch');
    await search.fill(name);
    // Wait for the debounce (200ms) + network request.
    await this.page.waitForSelector('#aewReportsToDd:not([hidden])', { timeout: 6_000 });
    const opts = this.page.locator('#aewReportsToDd .aew-emp-opt');
    await opts.first().waitFor({ state: 'visible', timeout: 4_000 });
    // Click the option that contains the searched name.
    const match = opts.filter({ hasText: name }).first();
    if (await match.count() > 0) {
      await match.click();
    } else {
      await opts.first().click();
    }
    await this.page.waitForTimeout(300);
  }

  async continueStep2(): Promise<void> {
    await this.page.locator('#aewBtnContinue').click();
    await this.page.waitForSelector('#aewPane3:not([hidden])', { timeout: 5_000 });
    await this.page.waitForTimeout(300);
  }

  // ── Step 3: Work Details ────────────────────────────────────────────────────

  async fillStep3(data: WizardStep3): Promise<void> {
    if (data.inviteLogin !== undefined) {
      const cb = this.page.locator('#aewInviteLogin');
      const checked = await cb.isChecked();
      if (data.inviteLogin && !checked) await cb.check();
      if (!data.inviteLogin && checked) await cb.uncheck();
    }

    if (data.onboardingTemplate) {
      await this.page.selectOption('#aewOnbTemplate', { label: data.onboardingTemplate });
      await this.page.waitForTimeout(500); // Activities load after template selection.
    } else {
      const tmpl = await this.page.locator('#aewOnbTemplate option:not([value=""])').count();
      if (tmpl > 0) {
        const v = await this.page.locator('#aewOnbTemplate option:not([value=""])').first().getAttribute('value');
        if (v) {
          await this.page.selectOption('#aewOnbTemplate', v);
          await this.page.waitForTimeout(500);
        }
      }
    }

    if (data.leavePlan) {
      await this.page.selectOption('#aewLeavePlan', { label: data.leavePlan });
    } else {
      const lp = await this.page.locator('#aewLeavePlan option:not([value=""])').count();
      if (lp > 0) {
        const v = await this.page.locator('#aewLeavePlan option:not([value=""])').first().getAttribute('value');
        if (v) await this.page.selectOption('#aewLeavePlan', v);
      }
    }

    await this.page.selectOption('#aewHoliday', { label: data.holidayList });

    if (data.shift) {
      await this.page.selectOption('#aewShift', { label: data.shift });
    } else {
      const sh = await this.page.locator('#aewShift option:not([value=""])').count();
      if (sh > 0) {
        const v = await this.page.locator('#aewShift option:not([value=""])').first().getAttribute('value');
        if (v) await this.page.selectOption('#aewShift', v);
      }
    }
  }

  async continueStep3(): Promise<void> {
    await this.page.locator('#aewBtnContinue').click();
    await this.page.waitForSelector('#aewPane4:not([hidden])', { timeout: 5_000 });
    await this.page.waitForTimeout(300);
  }

  // ── Step 4: Compensation ────────────────────────────────────────────────────

  async fillStep4(data: WizardStep4): Promise<void> {
    if (data.enablePayroll === false) {
      const toggle = this.page.locator('#aewEnablePayroll');
      if (await toggle.isChecked()) await toggle.uncheck();
    } else if (data.annualSalary) {
      await this.page.locator('#aewAnnualSalary').fill(data.annualSalary);
    }
  }

  // ── Finish and verify ───────────────────────────────────────────────────────

  async finish(): Promise<void> {
    await this.page.locator('#aewBtnFinish').click();
  }

  /** Wait for the success toast to appear and return any warning text. */
  async waitForSuccess(timeout = 15_000): Promise<string> {
    await this.page.waitForSelector('#aewToast:not([hidden])', { timeout });
    const warning = await this.page.locator('#aewToastWarning').textContent().catch(() => '');
    return (warning ?? '').trim();
  }

  /** Wait for the wizard to auto-close after success. */
  async waitForClose(): Promise<void> {
    // Wizard closes after 1600ms (4000ms if there is a compensation warning).
    await this.page.waitForSelector('#aewRoot[hidden], #aewListView:not([hidden])', {
      timeout: 10_000,
    });
    await this.page.waitForTimeout(500);
  }

  /** Assert the error element is NOT visible (no wizard error shown). */
  async expectNoError(): Promise<void> {
    const err = this.page.locator('#aewErr:not([hidden])');
    await expect(err).toHaveCount(0);
  }

  // ── List view helpers ───────────────────────────────────────────────────────

  /** Wait for the list table to load (not showing "Loading…"). */
  async waitForListLoaded(): Promise<void> {
    await this.page.waitForFunction(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tbody = (globalThis as any).document?.querySelector('#aewOnbBody');
      return tbody && !tbody.textContent?.includes('Loading');
    }, { timeout: 10_000 });
  }

  /** Returns true if the employee name appears in the onboarding list. */
  async isEmployeeInList(name: string): Promise<boolean> {
    await this.waitForListLoaded();
    return this.page.locator('#aewOnbTable').getByText(name, { exact: false }).count().then((n) => n > 0);
  }
}
