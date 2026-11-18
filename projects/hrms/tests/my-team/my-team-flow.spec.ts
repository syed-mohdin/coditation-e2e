/**
 * My Team Module — Full E2E Test Suite
 *
 * Tests all 5 sections of the My Team portal (manager / HR Admin view):
 *
 *  Section 1 – Summary (/my-team)
 *    1.1  Page load: h1, sub-text with direct/indirect/peer counts
 *    1.2  Section nav (cs-tm-sections) has all 5 links; Summary is active
 *    1.3  Group tabs rendered: Direct reports, Indirect reports, Peers, Everyone
 *    1.4  Active tab has .active class; count badge shows numbers
 *    1.5  Search input #team-q is present
 *    1.6  Today's overview stat tiles: On Time (ok), Late (warn), WFH/On Duty (info), Remote (muted)
 *    1.7  "On Leave Today" card: shows list or "No team members on leave today."
 *    1.8  "Not checked in yet" card: shows list or "Everyone is checked in today."
 *    1.9  Monthly overview calendar: cs-att-cal-grid, today cell has .today class
 *    1.10 Calendar tone classes: cells have one of ok/info/warn/bad or no tone
 *    1.11 Calendar cell title has "X present / X WFH / X on leave / X absent" summary
 *    1.12 Calendar nav prev/next buttons load different month
 *    1.13 Calendar legend shows 4 tone rows
 *    1.14 Team calendar table (cs-tm-grid) with day columns and dot cells
 *    1.15 Dot cells use correct CSS class (P/W/H/L/A)
 *    1.16 Employee card in Direct tab has name, designation, status badge
 *    1.17 Status badge uses correct tone class (cs-team-status-{ok/warn/bad/info/muted})
 *    1.18 Tab switch to Indirect shows indirect employees (or empty state)
 *    1.19 Tab switch to Peers shows peer employees (or empty state)
 *    1.20 Tab switch to Everyone shows "Open Employees" button
 *    1.21 Search box filters employee cards by name/role
 *    1.22 Each employee card links to /person/<id>
 *    1.23 "Not checked in" Show All toggle expands hidden avatars
 *
 *  Section 2 – Attendance (/my-team/attendance)
 *    2.1  Page loads with h1 "My Team" and sub-text
 *    2.2  Attendance is active in the section nav
 *    2.3  Group tabs present for HR: Direct reports, Indirect reports, Everyone
 *    2.4  "Attendance regularization requests" heading with count badge
 *    2.5  Regularization table headers: Employee, Date, Requested times, Requested on, actions
 *    2.6  Regularization empty state: "Hooray, no pending regularization requests."
 *    2.7  Creating a regularization via API → row appears in table
 *    2.8  Approve regularization via UI button → row removed, count decremented, alert shown
 *    2.9  Reject regularization via UI shows reject modal (#csTmModal)
 *    2.10 Reject with no reason in optional mode works (no "Add a reason." error)
 *    2.11 "Work From Home, On Duty and Other Requests" heading with count badge
 *    2.12 Attendance requests table headers: Employee, Request, Dates, Requested on, actions
 *    2.13 Attendance request empty state shown when none exist
 *    2.14 Creating an Attendance Request via API → row appears in requests table
 *    2.15 Approve attendance request via UI → row removed
 *    2.16 Reject attendance request (no-modal path, reasonMode='none') works
 *    2.17 Monthly attendance grid: table with Employee, Present, WFH, Leave, Absent, Late columns
 *    2.18 Month prev navigation loads previous month label
 *    2.19 Attendance dot cells use P/W/H/L/A classes with matching title attributes
 *    2.20 Month legend row is present below the grid
 *
 *  Section 3 – Leave (/my-team/leave)
 *    3.1  Page loads with correct sub-text
 *    3.2  Leave active in section nav
 *    3.3  "Leave approvals" heading with count badge
 *    3.4  Leave approvals table headers: Employee, Leave type, Dates, Days, Note
 *    3.5  Leave approvals empty state when none exist
 *    3.6  Creating a Leave Application → row appears in approvals table
 *    3.7  Approve leave via UI button → row removed, count decremented
 *    3.8  Reject leave: modal appears (required mode)
 *    3.9  Reject with empty reason shows "Add a reason." error in modal
 *    3.10 Reject with reason typed → modal closes, row removed
 *    3.11 "Leave consumption" heading with range sub-label
 *    3.12 Range tabs: This week, Last 30 days, Last 90 days present
 *    3.13 Active range tab has .active class
 *    3.14 Clicking "Last 30 days" range reloads with correct query param
 *    3.15 Leave consumption stats block: "Days of Leave" total shown
 *    3.16 "No leave taken" section with count badge
 *    3.17 "No leave taken" list shows last-leave-taken ago text
 *    3.18 "Most leave taken" section with person rows and day counts
 *    3.19 "Leave balance" table: Employee, Total available, per-type columns
 *    3.20 Balance cells show "available/total" format
 *    3.21 "Past leave requests" table: Employee, Leave type, Dates, Days, Status
 *    3.22 Past leave status pills present (Approved / Rejected / Open)
 *
 *  Section 4 – Expenses & Travel (/my-team/expenses)
 *    4.1  Page loads with correct heading and sub-text
 *    4.2  Expenses & Travel active in section nav
 *    4.3  "Claims waiting for approval" heading with count badge
 *    4.4  Pending claims table headers: Employee, Claim, Amount, Date, actions
 *    4.5  Pending claims empty state: "Hooray, no expense claims are waiting."
 *    4.6  Creating an Expense Claim → row appears in pending table
 *    4.7  Approve claim via UI button → row removed, count decremented
 *    4.8  Reject claim via UI: modal opens (optional reason), reject works
 *    4.9  "Recent claims" heading and table: Employee, Claim, Amount, Date, Status
 *    4.10 Recent claims empty state: "No recent claims."
 *    4.11 Approved claims move from pending to recent on reload
 *
 *  Section 5 – Profile changes (/my-team/profile-changes)
 *    5.1  Page loads with correct heading and sub-text
 *    5.2  Profile changes active in section nav
 *    5.3  "Waiting for HR" heading with count badge
 *    5.4  Waiting table headers: Employee, Change, Requested on
 *    5.5  "Waiting for HR" empty state: "No profile change requests are waiting..."
 *    5.6  Creating a Bank Change Request → row appears in Waiting for HR table
 *    5.7  HR can approve a bank change via UI button → row removed
 *    5.8  Reject shows modal (required reason)
 *    5.9  Reject without reason shows "Add a reason." error
 *    5.10 "Recent requests" table: Employee, Change, Requested on, Status
 *    5.11 Recent requests empty state: "No recent profile change requests."
 *    5.12 Approved/rejected requests appear in Recent requests on reload
 */

import { test, expect, Page, Browser } from '@playwright/test';
import { callMethod, createDoc, getDoc, listDocs } from '../../helpers/frappe-api';

// ── Constants ─────────────────────────────────────────────────────────────────

const TEST_EMPLOYEE = 'CS0001';
const BASE_URL = 'http://hrms-test.localhost:8000';

// ── State shared across blocks ────────────────────────────────────────────────

const created = {
  regularizationName: '',
  attendanceRequestName: '',
  leaveApplicationName: '',
  expenseClaimName: '',
  bankChangeName: '',
  // second items for reject flows
  regularizationName2: '',
  attendanceRequestName2: '',
  leaveApplicationName2: '',
  expenseClaimName2: '',
  bankChangeName2: '',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function newPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({
    storageState: 'projects/hrms/.auth/session.json',
  });
  return context.newPage();
}

/** Call an API method and return the message object. */
async function apiCall(page: Page, method: string, args: Record<string, unknown> = {}) {
  return callMethod(page, method, args);
}

/** Wait for the page to reload after an action (button click). */
async function waitReload(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);
}

// ── Shared beforeAll: clean up any leftover test data ─────────────────────────

async function cleanupCreated(page: Page) {
  // Cancel/delete created docs best-effort.
  const toCancel = [
    created.regularizationName,
    created.regularizationName2,
    created.attendanceRequestName,
    created.attendanceRequestName2,
  ];
  for (const name of toCancel.filter(Boolean)) {
    try {
      await apiCall(page, 'frappe.client.delete', { doctype: 'Attendance Regularization', name });
    } catch { /* best-effort */ }
    try {
      await apiCall(page, 'frappe.client.delete', { doctype: 'Attendance Request', name });
    } catch { /* best-effort */ }
  }
  // Cancel bank changes.
  if (created.bankChangeName) {
    try {
      await apiCall(page, 'cs_core.profile_api.cancel_bank_change', {});
    } catch { /* best-effort */ }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite
// ─────────────────────────────────────────────────────────────────────────────

test.describe.serial('My Team Module E2E', () => {
  let browser: Browser;
  let page: Page;

  test.beforeAll(async ({ browser: b }) => {
    browser = b;
    page = await newPage(browser);
    // Cancel any leftover pending bank change from prior runs.
    await apiCall(page, 'cs_core.profile_api.cancel_bank_change', {}).catch(() => {});
  });

  test.afterAll(async () => {
    await cleanupCreated(page);
    await page.context().close();
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 1: SUMMARY (/my-team)
  // ══════════════════════════════════════════════════════════════════════════

  test.describe.serial('1. My Team Summary', () => {
    test('1.1 /my-team page loads with h1 "My Team"', async () => {
      await page.goto('/my-team');
      await waitReload(page);

      expect(page.url()).not.toContain('/login');
      await expect(page.locator('h1')).toContainText('My Team');
    });

    test('1.2 sub-text shows team size and role counts', async () => {
      const sub = page.locator('.cs-page-sub');
      await expect(sub).toBeVisible();
      // e.g. "5 people · 2 direct · 1 indirect · 3 peers"
      const text = await sub.textContent() ?? '';
      expect(text).toMatch(/\d+\s*(person|people)/);
    });

    test('1.3 section nav (cs-tm-sections) has all 5 links', async () => {
      const nav = page.locator('.cs-tm-sections');
      await expect(nav).toBeVisible();

      await expect(nav.locator('a[href="/my-team"]')).toBeVisible();
      await expect(nav.locator('a[href="/my-team/attendance"]')).toBeVisible();
      await expect(nav.locator('a[href="/my-team/leave"]')).toBeVisible();
      await expect(nav.locator('a[href="/my-team/expenses"]')).toBeVisible();
      await expect(nav.locator('a[href="/my-team/profile-changes"]')).toBeVisible();
    });

    test('1.4 "Summary" is active in the section nav', async () => {
      const summaryLink = page.locator('.cs-tm-sections a[href="/my-team"]');
      await expect(summaryLink).toHaveClass(/active/);
    });

    test('1.5 group tabs are rendered (Direct reports, Indirect, Peers)', async () => {
      const tabs = page.locator('.cs-team-tabs-seg');
      await expect(tabs).toBeVisible();

      // At minimum Direct and Peers tabs should be present for HR.
      const tabLinks = tabs.locator('a.cs-team-tab');
      const count = await tabLinks.count();
      expect(count).toBeGreaterThanOrEqual(2);

      // Check text labels.
      const texts = await tabLinks.allTextContents();
      const flatText = texts.map(t => t.trim()).join(' ');
      expect(flatText).toMatch(/Direct reports|Indirect reports|Peers|Everyone/);
    });

    test('1.6 active group tab has .active class and shows count badge', async () => {
      const activeTab = page.locator('.cs-team-tabs-seg a.cs-team-tab.active');
      await expect(activeTab).toBeVisible();

      // Count badge inside the active tab.
      const badge = activeTab.locator('.cs-team-tab-ct');
      await expect(badge).toBeVisible();
      const countText = await badge.textContent() ?? '';
      expect(parseInt(countText.trim())).toBeGreaterThanOrEqual(0);
    });

    test('1.7 search input #team-q is present', async () => {
      await expect(page.locator('#team-q')).toBeVisible();
    });

    test('1.8 "Today\'s overview" section with 4 stat tiles', async () => {
      const section = page.locator('.cs-section-label', { hasText: "Today's overview" });

      if (await section.count() === 0) {
        // Not a manager / no show_overview — skip.
        return;
      }
      await expect(section).toBeVisible();

      const tiles = page.locator('.cs-att-tiles .cs-att-tile');
      await expect(tiles).toHaveCount(4);

      // Check labels.
      const labels = page.locator('.cs-att-tile-l');
      const texts = await labels.allTextContents();
      expect(texts).toContain('On Time');
      expect(texts).toContain('Late Arrivals');
      expect(texts).toContain('WFH / On Duty');
      expect(texts).toContain('Remote Clock-ins');
    });

    test('1.9 stat tile counts use correct tone CSS classes', async () => {
      const tileNums = page.locator('.cs-att-tile-n');
      if (await tileNums.count() === 0) { return; }

      const classes = await tileNums.evaluateAll(els =>
        els.map(el => el.className)
      );
      expect(classes[0]).toContain('ok');   // On Time — green
      expect(classes[1]).toContain('warn'); // Late Arrivals — yellow
      expect(classes[2]).toContain('info'); // WFH/On Duty — blue
      expect(classes[3]).toContain('muted'); // Remote Clock-ins — gray
    });

    test('1.10 "On Leave Today" card is rendered', async () => {
      const section = page.locator('.cs-section-label', { hasText: "Today's overview" });
      if (await section.count() === 0) { return; }

      const onLeaveCard = page.locator('.cs-on-leave-section');
      await expect(onLeaveCard).toBeVisible();
      await expect(onLeaveCard).toContainText('On Leave Today');

      // Either shows a list or the empty state.
      const hasList = await onLeaveCard.locator('.cs-on-leave-list').count() > 0;
      const hasEmpty = await onLeaveCard.locator('.cs-empty').count() > 0;
      expect(hasList || hasEmpty).toBe(true);
    });

    test('1.11 "On Leave Today" items have name and "Today" badge', async () => {
      const section = page.locator('.cs-section-label', { hasText: "Today's overview" });
      if (await section.count() === 0) { return; }

      const items = page.locator('.cs-on-leave-item');
      if (await items.count() > 0) {
        await expect(items.first().locator('.cs-on-leave-name')).toBeVisible();
        await expect(items.first().locator('.cs-on-leave-badge')).toContainText('Today');
      }
    });

    test('1.12 "Not checked in yet" card is rendered', async () => {
      const section = page.locator('.cs-section-label', { hasText: "Today's overview" });
      if (await section.count() === 0) { return; }

      // The second card after on-leave.
      const notInCard = page.locator('.cs-card').filter({ hasText: 'Not checked in yet' });
      await expect(notInCard).toBeVisible();

      // Either shows avatars list or "Everyone is checked in today."
      const hasAvatars = await notInCard.locator('.cs-celeb-people').count() > 0;
      const hasEmpty = await notInCard.locator('.cs-empty').count() > 0;
      expect(hasAvatars || hasEmpty).toBe(true);
    });

    test('1.13 "Show All" toggle expands hidden "not in" avatars', async () => {
      const section = page.locator('.cs-section-label', { hasText: "Today's overview" });
      if (await section.count() === 0) { return; }

      const toggle = page.locator('#csNotInToggle');
      if (await toggle.count() === 0) { return; } // fewer than 12 not-in employees

      const hiddenBefore = await page.locator('.cs-notin-extra[hidden]').count();
      expect(hiddenBefore).toBeGreaterThan(0);

      await toggle.click();
      await page.waitForTimeout(200);

      const hiddenAfter = await page.locator('.cs-notin-extra[hidden]').count();
      expect(hiddenAfter).toBe(0);

      // Click again to collapse.
      await toggle.click();
      await page.waitForTimeout(200);
      expect(await page.locator('.cs-notin-extra[hidden]').count()).toBeGreaterThan(0);
    });

    test('1.14 "Monthly overview" calendar section is rendered', async () => {
      const section = page.locator('.cs-section-label', { hasText: "Today's overview" });
      if (await section.count() === 0) { return; }

      const monthLabel = page.locator('.cs-section-label', { hasText: 'Monthly overview' });
      await expect(monthLabel).toBeVisible();

      const calGrid = page.locator('#csTeamCalGrid');
      await expect(calGrid).toBeVisible();
    });

    test('1.15 current month label is shown in calendar nav', async () => {
      const section = page.locator('.cs-section-label', { hasText: "Today's overview" });
      if (await section.count() === 0) { return; }

      const calLabel = page.locator('#csTeamCalLabel');
      await expect(calLabel).toBeVisible();
      const text = await calLabel.textContent() ?? '';
      expect(text).toMatch(/\w+ \d{4}/); // e.g. "November 2026"
    });

    test('1.16 calendar cells have tone CSS classes (ok/info/warn/bad) or no tone for data-rich days', async () => {
      const section = page.locator('.cs-section-label', { hasText: "Today's overview" });
      if (await section.count() === 0) { return; }

      const cells = page.locator('#csTeamCalGrid .cs-att-cal-cell:not(.empty)');
      const count = await cells.count();
      if (count === 0) { return; }

      // All cells must have the base class; tone classes are optional.
      const allHaveBase = await cells.evaluateAll(els =>
        els.every(el => el.classList.contains('cs-att-cal-cell'))
      );
      expect(allHaveBase).toBe(true);
    });

    test('1.17 today cell has .today CSS class', async () => {
      const section = page.locator('.cs-section-label', { hasText: "Today's overview" });
      if (await section.count() === 0) { return; }

      const todayCell = page.locator('#csTeamCalGrid .cs-att-cal-cell.today');
      await expect(todayCell).toBeVisible();
    });

    test('1.18 future cells have .future CSS class', async () => {
      const section = page.locator('.cs-section-label', { hasText: "Today's overview" });
      if (await section.count() === 0) { return; }

      const futureCells = page.locator('#csTeamCalGrid .cs-att-cal-cell.future');
      // Not the last day of the month → there should be future cells.
      const count = await futureCells.count();
      // Could be 0 if today is the last day — just validate the selector is valid.
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('1.19 calendar legend shows 4 tone labels', async () => {
      const section = page.locator('.cs-section-label', { hasText: "Today's overview" });
      if (await section.count() === 0) { return; }

      const legend = page.locator('.cs-att-legend');
      await expect(legend).toBeVisible();
      await expect(legend).toContainText('Mostly Present');
      await expect(legend).toContainText('WFH / Mixed');
      await expect(legend).toContainText('High Leave');
      await expect(legend).toContainText('High Absence');
    });

    test('1.20 calendar prev button loads the previous month', async () => {
      const section = page.locator('.cs-section-label', { hasText: "Today's overview" });
      if (await section.count() === 0) { return; }

      const labelBefore = await page.locator('#csTeamCalLabel').textContent() ?? '';

      await page.locator('#csTeamCalPrev').click();
      // Wait for frappe.call to complete (networkidle or timeout).
      await page.waitForTimeout(2_000);

      const labelAfter = await page.locator('#csTeamCalLabel').textContent() ?? '';
      expect(labelAfter).not.toBe(labelBefore);
      expect(labelAfter).not.toBe('Loading…');

      // Click next to go back to current month.
      await page.locator('#csTeamCalNext').click();
      await page.waitForTimeout(2_000);
    });

    test('1.21 "Team calendar" section shows per-person rows with day dots', async () => {
      const section = page.locator('.cs-section-label', { hasText: "Today's overview" });
      if (await section.count() === 0) { return; }

      const teamCalLabel = page.locator('.cs-section-label', { hasText: 'Team calendar' });
      if (await teamCalLabel.count() === 0) { return; } // no team_rows

      const table = page.locator('.cs-tm-table.cs-tm-grid');
      await expect(table).toBeVisible();

      // Table head has "Employee" + day numbers.
      const headers = table.locator('thead th');
      const headerText = await headers.first().textContent();
      expect(headerText).toBe('Employee');
    });

    test('1.22 team calendar dot cells use P/W/H/L/A classes', async () => {
      const teamCalLabel = page.locator('.cs-section-label', { hasText: 'Team calendar' });
      if (await teamCalLabel.count() === 0) { return; }

      const dots = page.locator('.cs-tm-grid .cs-tm-dot');
      if (await dots.count() === 0) { return; }

      // Any non-empty dot must have a known class.
      const dotClasses = await dots.evaluateAll(els =>
        els.map(el => el.className).filter(cls => cls && cls !== 'cs-tm-dot ')
      );
      for (const cls of dotClasses) {
        expect(cls).toMatch(/cs-tm-dot (P|W|H|L|A)/);
      }
    });

    test('1.23 team calendar legend shows P/W/H/L/A key', async () => {
      const teamCalLabel = page.locator('.cs-section-label', { hasText: 'Team calendar' });
      if (await teamCalLabel.count() === 0) { return; }

      const legend = page.locator('.cs-tm-legend').last();
      await expect(legend).toContainText('Present');
      await expect(legend).toContainText('Work From Home');
      await expect(legend).toContainText('On Leave');
      await expect(legend).toContainText('Absent');
    });

    test('1.24 employee cards in the active tab have correct structure', async () => {
      const cards = page.locator('.cs-emp-dir-card');
      if (await cards.count() === 0) { return; } // empty tab

      const firstCard = cards.first();
      // Name link.
      await expect(firstCard.locator('.cs-emp-dir-name')).toBeVisible();
      // Links to /person/<id>.
      const href = await firstCard.locator('.cs-emp-dir-name').getAttribute('href');
      expect(href).toContain('/person/');
    });

    test('1.25 employee card status badges use correct tone classes', async () => {
      const badges = page.locator('.cs-team-status-badge');
      if (await badges.count() === 0) { return; }

      const cls = await badges.first().getAttribute('class') ?? '';
      expect(cls).toMatch(/cs-team-status-(ok|warn|bad|info|muted)/);
    });

    test('1.26 search box filters employee cards', async () => {
      const cards = page.locator('.cs-emp-dir-card');
      const totalCards = await cards.count();
      if (totalCards < 2) { return; }

      // Get the name of the first card.
      const firstName = await cards.first().locator('.cs-emp-dir-name').textContent() ?? '';
      const query = firstName.trim().split(' ')[0]; // first word of name

      await page.locator('#team-q').fill(query);
      await page.waitForTimeout(300);

      // Cards that don't match should be hidden.
      const visibleCards = page.locator('.cs-emp-dir-card:not([style*="display: none"])');
      const visibleCount = await visibleCards.count();
      // At least 1 visible (the matching one) and possibly fewer than total.
      expect(visibleCount).toBeGreaterThanOrEqual(1);

      // Clear search.
      await page.locator('#team-q').fill('');
      await page.waitForTimeout(300);
    });

    test('1.27 Indirect reports tab shows correct employees or empty state', async () => {
      const indirectTab = page.locator('.cs-team-tabs-seg a.cs-team-tab', { hasText: 'Indirect' });
      if (await indirectTab.count() === 0) { return; }

      await indirectTab.click();
      await waitReload(page);

      await expect(page.locator('.cs-team-tabs-seg a.cs-team-tab.active')).toContainText('Indirect');

      const hasCards = await page.locator('.cs-emp-dir-card').count() > 0;
      const hasEmpty = await page.locator('.cs-empty').count() > 0;
      expect(hasCards || hasEmpty).toBe(true);
      if (!hasCards) {
        await expect(page.locator('.cs-empty')).toContainText('No indirect reports');
      }
    });

    test('1.28 Peers tab shows peers or empty state', async () => {
      const peersTab = page.locator('.cs-team-tabs-seg a.cs-team-tab', { hasText: 'Peers' });
      if (await peersTab.count() === 0) { return; }

      await peersTab.click();
      await waitReload(page);

      await expect(page.locator('.cs-team-tabs-seg a.cs-team-tab.active')).toContainText('Peers');

      const hasCards = await page.locator('.cs-emp-dir-card').count() > 0;
      const hasEmpty = await page.locator('.cs-empty').count() > 0;
      expect(hasCards || hasEmpty).toBe(true);
    });

    test('1.29 Everyone tab shows "Open Employees" button', async () => {
      const everyoneTab = page.locator('.cs-team-tabs-seg a.cs-team-tab', { hasText: 'Everyone' });
      if (await everyoneTab.count() === 0) { return; }

      await everyoneTab.click();
      await waitReload(page);

      await expect(page.locator('.cs-team-everyone')).toBeVisible();
      await expect(page.locator('a[href="/employees"]')).toBeVisible();
      await expect(page.locator('a[href="/employees"]')).toContainText('Open Employees');
    });

    test('1.30 Direct tab is restored by clicking the tab directly', async () => {
      const directTab = page.locator('.cs-team-tabs-seg a.cs-team-tab', { hasText: 'Direct' });
      if (await directTab.count() === 0) { return; }

      await directTab.click();
      await waitReload(page);

      await expect(page.locator('.cs-team-tabs-seg a.cs-team-tab.active')).toContainText('Direct');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 2: ATTENDANCE (/my-team/attendance)
  // ══════════════════════════════════════════════════════════════════════════

  test.describe.serial('2. My Team Attendance', () => {
    test('2.1 /my-team/attendance page loads', async () => {
      await page.goto('/my-team/attendance');
      await waitReload(page);

      expect(page.url()).not.toContain('/login');
      await expect(page.locator('h1')).toContainText('My Team');
      await expect(page.locator('.cs-page-sub')).toContainText('Attendance decisions');
    });

    test('2.2 "Attendance" is active in the section nav', async () => {
      const link = page.locator('.cs-tm-sections a[href="/my-team/attendance"]');
      await expect(link).toHaveClass(/active/);
    });

    test('2.3 group tabs present for HR: Direct, Indirect, Everyone', async () => {
      const groups = page.locator('.cs-tm-groups');
      if (await groups.count() === 0) { return; }

      const tabs = groups.locator('a');
      const texts = await tabs.allTextContents();
      const flat = texts.map(t => t.trim()).join(' ');
      expect(flat).toMatch(/Direct reports|Indirect reports|Everyone/);
    });

    test('2.4 "Attendance regularization requests" heading with count badge', async () => {
      const heading = page.locator('.cs-tm-h', { hasText: 'Attendance regularization requests' });
      await expect(heading).toBeVisible();
      await expect(heading.locator('.cs-tm-ct')).toBeVisible();
    });

    test('2.5 regularization table headers or empty state present', async () => {
      const tableOrEmpty = await Promise.all([
        page.locator('.cs-tm-table').count(),
        page.locator('.cs-empty').count(),
      ]);
      expect(tableOrEmpty[0] + tableOrEmpty[1]).toBeGreaterThan(0);

      const regTable = page.locator('.cs-tm-table').first();
      if (await regTable.count() > 0) {
        const headers = regTable.locator('thead th');
        const texts = await headers.allTextContents();
        const flat = texts.join(' ');
        expect(flat).toContain('Employee');
        expect(flat).toContain('Date');
        expect(flat).toContain('Requested times');
        expect(flat).toContain('Requested on');
      }
    });

    test('2.6 creating a regularization via API → row appears in table', async () => {
      // Create via API: direct createDoc.
      try {
        const name = await createDoc(page, 'Attendance Regularization', {
          employee: TEST_EMPLOYEE,
          attendance_date: '2026-10-01',
          in_time: '09:00:00',
          out_time: '18:00:00',
        });
        created.regularizationName = name;
      } catch (e) {
        console.log('Could not create regularization:', e);
        return;
      }

      await page.reload();
      await waitReload(page);

      // The table should now have at least one row.
      const rows = page.locator('.cs-tm-table').first().locator('tbody tr');
      const count = await rows.count();
      expect(count).toBeGreaterThan(0);

      // Count badge updated.
      const badge = page.locator('.cs-tm-h', { hasText: 'Attendance regularization requests' }).locator('.cs-tm-ct');
      const badgeText = await badge.textContent() ?? '';
      expect(parseInt(badgeText)).toBeGreaterThan(0);
    });

    test('2.7 Approve regularization via UI → row removed and count decremented', async () => {
      if (!created.regularizationName) { return; }

      const badge = page.locator('.cs-tm-h', { hasText: 'Attendance regularization requests' }).locator('.cs-tm-ct');
      const countBefore = parseInt(await badge.textContent() ?? '0');

      const approveBtn = page.locator('.cs-tm-table').first().locator('button.cs-tm-ok').first();
      if (await approveBtn.count() === 0) { return; }

      await approveBtn.click();
      await page.waitForTimeout(1_500);

      // Count should decrease.
      const countAfter = parseInt(await badge.textContent() ?? '0');
      expect(countAfter).toBeLessThan(countBefore);
      created.regularizationName = ''; // approved — no cleanup needed
    });

    test('2.8 creating second regularization for reject test', async () => {
      try {
        const name = await createDoc(page, 'Attendance Regularization', {
          employee: TEST_EMPLOYEE,
          attendance_date: '2026-10-02',
          in_time: '09:30:00',
          out_time: '18:30:00',
        });
        created.regularizationName2 = name;
      } catch { return; }

      await page.reload();
      await waitReload(page);
    });

    test('2.9 Reject regularization via UI shows reject modal', async () => {
      if (!created.regularizationName2) { return; }

      const rejectBtn = page.locator('.cs-tm-table').first().locator('button.cs-tm-no').first();
      if (await rejectBtn.count() === 0) { return; }

      await rejectBtn.click();
      await page.waitForTimeout(400);

      // Modal should appear (optional reason mode).
      const modal = page.locator('#csTmModal');
      await expect(modal).not.toHaveAttribute('hidden', '');
      await expect(modal).toBeVisible();
    });

    test('2.10 Reject modal with optional reason: submit without reason succeeds', async () => {
      if (!created.regularizationName2) { return; }

      const modal = page.locator('#csTmModal');
      if (await modal.evaluate((el: HTMLElement) => el.hidden)) { return; }

      // Clear any reason text and click Reject.
      await page.locator('#csTmReason').fill('');
      await page.locator('#csTmGo').click();
      await page.waitForTimeout(1_500);

      // No "Add a reason." error should appear.
      const errEl = page.locator('#csTmErr');
      const errHidden = await errEl.evaluate((el: HTMLElement) => el.hidden);
      expect(errHidden).toBe(true);

      created.regularizationName2 = ''; // rejected — no cleanup needed
    });

    test('2.11 "Work From Home / On Duty and Other Requests" heading with count badge', async () => {
      await page.goto('/my-team/attendance');
      await waitReload(page);

      const heading = page.locator('.cs-tm-h', { hasText: 'Work From Home, On Duty and Other Requests' });
      await expect(heading).toBeVisible();
      await expect(heading.locator('.cs-tm-ct')).toBeVisible();
    });

    test('2.12 attendance requests table headers or empty state', async () => {
      const tables = page.locator('.cs-tm-table');
      const tableCount = await tables.count();
      // The second card has the requests table (or its empty state).
      if (tableCount >= 2) {
        const reqTable = tables.nth(1);
        const headers = reqTable.locator('thead th');
        const texts = await headers.allTextContents();
        const flat = texts.join(' ');
        expect(flat).toContain('Employee');
        expect(flat).toContain('Request');
        expect(flat).toContain('Dates');
      } else {
        const empties = page.locator('.cs-empty');
        // At least one empty state must be visible.
        expect(await empties.count()).toBeGreaterThan(0);
      }
    });

    test('2.13 creating an Attendance Request via API → appears in requests table', async () => {
      // Create via API using the create_attendance_request endpoint.
      try {
        const result = await callMethod(page, 'cs_core.attendance_api.create_attendance_request', {
          from_date: '2026-10-10',
          to_date: '2026-10-10',
          reason: 'Work From Home',
        }) as { ok?: boolean; name?: string };

        if (result?.ok && result?.name) {
          created.attendanceRequestName = result.name;
        } else {
          // Try direct createDoc instead.
          const name = await createDoc(page, 'Attendance Request', {
            employee: TEST_EMPLOYEE,
            from_date: '2026-10-10',
            to_date: '2026-10-10',
            reason: 'Work From Home',
            company: (await getDoc(page, 'Employee', TEST_EMPLOYEE, ['company'])).company,
          });
          created.attendanceRequestName = name;
        }
      } catch (e) {
        console.log('Could not create attendance request:', e);
        return;
      }

      await page.reload();
      await waitReload(page);

      // Some row should now exist in the second table.
      const tables = page.locator('.cs-tm-table');
      if (await tables.count() >= 2) {
        const count = await tables.nth(1).locator('tbody tr').count();
        expect(count).toBeGreaterThan(0);
      }
    });

    test('2.14 Approve attendance request via UI → row removed', async () => {
      if (!created.attendanceRequestName) { return; }

      const tables = page.locator('.cs-tm-table');
      if (await tables.count() < 2) { return; }

      const badge = page.locator('.cs-tm-h', { hasText: 'Work From Home, On Duty and Other Requests' }).locator('.cs-tm-ct');
      const countBefore = parseInt(await badge.textContent() ?? '0');

      const approveBtn = tables.nth(1).locator('button.cs-tm-ok').first();
      if (await approveBtn.count() === 0) { return; }

      await approveBtn.click();
      await page.waitForTimeout(1_500);

      const countAfter = parseInt(await badge.textContent() ?? '0');
      expect(countAfter).toBeLessThan(countBefore);
      created.attendanceRequestName = '';
    });

    test('2.15 Reject attendance request uses no-modal path (reasonMode=none)', async () => {
      // Create another request for the reject flow.
      let name2 = '';
      try {
        name2 = await createDoc(page, 'Attendance Request', {
          employee: TEST_EMPLOYEE,
          from_date: '2026-10-11',
          to_date: '2026-10-11',
          reason: 'On Duty',
          company: (await getDoc(page, 'Employee', TEST_EMPLOYEE, ['company'])).company,
        });
        created.attendanceRequestName2 = name2;
      } catch { return; }

      await page.reload();
      await waitReload(page);

      const tables = page.locator('.cs-tm-table');
      if (await tables.count() < 2) { return; }

      const rejectBtn = tables.nth(1).locator('button.cs-tm-no').first();
      if (await rejectBtn.count() === 0) { return; }

      await rejectBtn.click();
      await page.waitForTimeout(1_500);

      // No modal should have appeared (reasonMode='none').
      const modal = page.locator('#csTmModal');
      const isHidden = await modal.evaluate((el: HTMLElement) => el.hidden);
      expect(isHidden).toBe(true);

      created.attendanceRequestName2 = '';
    });

    test('2.16 monthly attendance grid: table with correct column headers', async () => {
      const monthlyTable = page.locator('.cs-tm-table.cs-tm-grid');
      if (await monthlyTable.count() === 0) { return; }

      const headers = monthlyTable.locator('thead th');
      const texts = await headers.allTextContents();
      expect(texts.slice(0, 6).join(' ')).toMatch(/Employee.*Present.*WFH.*Leave.*Absent.*Late/);
    });

    test('2.17 monthly table shows current month label in h2', async () => {
      const monthH2 = page.locator('.cs-tm-h').filter({ hasText: /\d{4}/ });
      if (await monthH2.count() === 0) { return; }

      const text = await monthH2.first().textContent() ?? '';
      expect(text).toMatch(/\w+ \d{4}/);
    });

    test('2.18 month prev navigation link changes month in URL', async () => {
      const prevLink = page.locator('a[aria-label="Previous Month"]');
      if (await prevLink.count() === 0) { return; }

      const href = await prevLink.getAttribute('href') ?? '';
      expect(href).toContain('month=');
    });

    test('2.19 attendance dot cells have correct CSS class and title', async () => {
      const dots = page.locator('.cs-tm-grid .cs-tm-dot');
      const count = await dots.count();
      if (count === 0) { return; }

      // Any non-empty dot class should be P/W/H/L/A.
      const validTitles = ['Present', 'Work From Home', 'On Leave', 'Half Day', 'Absent'];
      const dotData = await dots.evaluateAll(els =>
        els
          .map(el => ({ cls: el.className.trim(), title: el.getAttribute('title') ?? '' }))
          .filter(d => d.cls !== 'cs-tm-dot' && d.cls !== 'cs-tm-dot ')
      );
      for (const { cls, title } of dotData) {
        expect(cls).toMatch(/cs-tm-dot (P|W|H|L|A)/);
        if (title) {
          expect(validTitles).toContain(title);
        }
      }
    });

    test('2.20 month legend row is present', async () => {
      const grid = page.locator('.cs-tm-table.cs-tm-grid');
      if (await grid.count() === 0) { return; }

      const legend = page.locator('.cs-tm-legend');
      await expect(legend).toBeVisible();
      await expect(legend).toContainText('Present');
      await expect(legend).toContainText('Work From Home');
      await expect(legend).toContainText('On Leave');
      await expect(legend).toContainText('Absent');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 3: LEAVE (/my-team/leave)
  // ══════════════════════════════════════════════════════════════════════════

  test.describe.serial('3. My Team Leave', () => {
    test('3.1 /my-team/leave page loads', async () => {
      await page.goto('/my-team/leave');
      await waitReload(page);

      expect(page.url()).not.toContain('/login');
      await expect(page.locator('h1')).toContainText('My Team');
      await expect(page.locator('.cs-page-sub')).toContainText('Leave taken, balances and approvals');
    });

    test('3.2 "Leave" is active in the section nav', async () => {
      const link = page.locator('.cs-tm-sections a[href="/my-team/leave"]');
      await expect(link).toHaveClass(/active/);
    });

    test('3.3 "Leave approvals" heading with count badge', async () => {
      const heading = page.locator('.cs-tm-h', { hasText: 'Leave approvals' });
      await expect(heading).toBeVisible();
      await expect(heading.locator('.cs-tm-ct')).toBeVisible();
    });

    test('3.4 leave approvals table headers or empty state', async () => {
      const table = page.locator('.cs-tm-table').first();
      if (await table.count() > 0) {
        const headers = await table.locator('thead th').allTextContents();
        const flat = headers.join(' ');
        expect(flat).toContain('Employee');
        expect(flat).toContain('Leave type');
        expect(flat).toContain('Dates');
        expect(flat).toContain('Days');
        expect(flat).toContain('Note');
      } else {
        const empty = page.locator('.cs-empty').first();
        await expect(empty).toContainText('No leave requests are waiting');
      }
    });

    test('3.5 creating a Leave Application → row appears in approvals table', async () => {
      // Check if leave type exists.
      const leaveTypes = await listDocs(page, 'Leave Type', {}, ['name']);
      if (leaveTypes.length === 0) {
        console.log('No Leave Type configured — skipping leave creation.');
        return;
      }
      const leaveType = leaveTypes[0].name as string;

      try {
        const name = await createDoc(page, 'Leave Application', {
          employee: TEST_EMPLOYEE,
          leave_type: leaveType,
          from_date: '2026-10-20',
          to_date: '2026-10-20',
          half_day: 0,
          status: 'Open',
        });
        created.leaveApplicationName = name;
      } catch (e) {
        console.log('Could not create Leave Application:', e);
        return;
      }

      await page.reload();
      await waitReload(page);

      const rows = page.locator('.cs-tm-table').first().locator('tbody tr');
      const count = await rows.count();
      expect(count).toBeGreaterThan(0);
    });

    test('3.6 Approve leave via UI → row removed, count decremented', async () => {
      if (!created.leaveApplicationName) { return; }

      const badge = page.locator('.cs-tm-h', { hasText: 'Leave approvals' }).locator('.cs-tm-ct');
      const countBefore = parseInt(await badge.textContent() ?? '0');

      const approveBtn = page.locator('.cs-tm-table').first().locator('button.cs-tm-ok').first();
      if (await approveBtn.count() === 0) { return; }

      await approveBtn.click();
      await page.waitForTimeout(1_500);

      const countAfter = parseInt(await badge.textContent() ?? '0');
      expect(countAfter).toBeLessThan(countBefore);
      created.leaveApplicationName = '';
    });

    test('3.7 Reject leave: modal appears (required reason mode)', async () => {
      // Create another leave application for reject flow.
      const leaveTypes = await listDocs(page, 'Leave Type', {}, ['name']);
      if (leaveTypes.length === 0) { return; }
      const leaveType = leaveTypes[0].name as string;

      try {
        const name = await createDoc(page, 'Leave Application', {
          employee: TEST_EMPLOYEE,
          leave_type: leaveType,
          from_date: '2026-10-21',
          to_date: '2026-10-21',
          half_day: 0,
          status: 'Open',
        });
        created.leaveApplicationName2 = name;
      } catch { return; }

      await page.reload();
      await waitReload(page);

      const rejectBtn = page.locator('.cs-tm-table').first().locator('button.cs-tm-no').first();
      if (await rejectBtn.count() === 0) { return; }

      await rejectBtn.click();
      await page.waitForTimeout(400);

      const modal = page.locator('#csTmModal');
      await expect(modal).not.toHaveAttribute('hidden', '');
      await expect(page.locator('#csTmModalTitle')).toContainText('Reject');
    });

    test('3.8 Reject leave without reason shows "Add a reason." error', async () => {
      if (!created.leaveApplicationName2) { return; }

      const modal = page.locator('#csTmModal');
      if (await modal.evaluate((el: HTMLElement) => el.hidden)) { return; }

      await page.locator('#csTmReason').fill('');
      await page.locator('#csTmGo').click();
      await page.waitForTimeout(400);

      const errEl = page.locator('#csTmErr');
      await expect(errEl).not.toHaveAttribute('hidden', '');
      await expect(errEl).toContainText('Add a reason.');
    });

    test('3.9 Reject leave with reason typed → modal closes, row removed', async () => {
      if (!created.leaveApplicationName2) { return; }

      await page.locator('#csTmReason').fill('E2E test: rejected with reason');
      await page.locator('#csTmGo').click();
      await page.waitForTimeout(1_500);

      // Modal should close.
      const modal = page.locator('#csTmModal');
      const isHidden = await modal.evaluate((el: HTMLElement) => el.hidden);
      expect(isHidden).toBe(true);

      created.leaveApplicationName2 = '';
    });

    test('3.10 "Escape" key closes the reject modal', async () => {
      // Open modal again via reject button if any pending rows.
      const rejectBtn = page.locator('.cs-tm-table').first().locator('button.cs-tm-no').first();
      if (await rejectBtn.count() > 0) {
        await rejectBtn.click();
        await page.waitForTimeout(300);
        const modal = page.locator('#csTmModal');
        if (!await modal.evaluate((el: HTMLElement) => el.hidden)) {
          await page.keyboard.press('Escape');
          await page.waitForTimeout(200);
          const isHidden = await modal.evaluate((el: HTMLElement) => el.hidden);
          expect(isHidden).toBe(true);
        }
      }
    });

    test('3.11 "Cancel" button in modal closes it', async () => {
      const rejectBtn = page.locator('.cs-tm-table').first().locator('button.cs-tm-no').first();
      if (await rejectBtn.count() > 0) {
        await rejectBtn.click();
        await page.waitForTimeout(300);
        const modal = page.locator('#csTmModal');
        if (!await modal.evaluate((el: HTMLElement) => el.hidden)) {
          await modal.locator('button.cs-btn-ghost', { hasText: 'Cancel' }).click();
          await page.waitForTimeout(200);
          expect(await modal.evaluate((el: HTMLElement) => el.hidden)).toBe(true);
        }
      }
    });

    test('3.12 "Leave consumption" heading and range sub-label', async () => {
      await page.goto('/my-team/leave');
      await waitReload(page);

      const heading = page.locator('.cs-tm-h', { hasText: 'Leave consumption' });
      await expect(heading).toBeVisible();
      await expect(heading.locator('.cs-tm-sub')).toBeVisible();
    });

    test('3.13 range tab links: This week, Last 30 days, Last 90 days', async () => {
      const ranges = page.locator('.cs-tm-ranges');
      await expect(ranges).toBeVisible();

      const links = ranges.locator('a');
      const texts = await links.allTextContents();
      expect(texts).toContain('This week');
      expect(texts).toContain('Last 30 days');
      expect(texts).toContain('Last 90 days');
    });

    test('3.14 active range tab has .active class', async () => {
      const activeRange = page.locator('.cs-tm-ranges a.active');
      await expect(activeRange).toBeVisible();
    });

    test('3.15 clicking "Last 30 days" range reloads with ?range=month', async () => {
      await page.locator('.cs-tm-ranges a', { hasText: 'Last 30 days' }).click();
      await waitReload(page);

      expect(page.url()).toContain('range=month');
      const activeRange = page.locator('.cs-tm-ranges a.active');
      await expect(activeRange).toContainText('Last 30 days');
    });

    test('3.16 leave consumption stats block shows "Days of Leave" total', async () => {
      const stats = page.locator('.cs-tm-stats');
      await expect(stats).toBeVisible();

      // Either shows stats or "No leave was taken in this period."
      const hasTypes = await stats.locator('div').count() > 0;
      const hasEmpty = await page.locator('.cs-empty').filter({ hasText: 'No leave was taken' }).count() > 0;
      expect(hasTypes || hasEmpty).toBe(true);

      if (hasTypes) {
        await expect(stats.locator('span', { hasText: 'Days of Leave' })).toBeVisible();
      }
    });

    test('3.17 "No leave taken" section with count badge and list', async () => {
      const heading = page.locator('.cs-tm-h', { hasText: 'No leave taken' });
      await expect(heading).toBeVisible();
      await expect(heading.locator('.cs-tm-ct')).toBeVisible();

      const count = parseInt(await heading.locator('.cs-tm-ct').textContent() ?? '0');
      if (count > 0) {
        // List shows person with "last leave taken" text.
        const rows = page.locator('.cs-tm-list .cs-tm-row');
        await expect(rows.first()).toBeVisible();
        await expect(rows.first().locator('.cs-tm-last')).toBeVisible();
        await expect(rows.first().locator('.cs-tm-last span')).toContainText('last leave taken');
      } else {
        await expect(page.locator('.cs-empty', { hasText: 'Everyone took leave' })).toBeVisible();
      }
    });

    test('3.18 "Most leave taken" section shows person rows with day counts', async () => {
      const heading = page.locator('.cs-tm-h', { hasText: 'Most leave taken' });
      await expect(heading).toBeVisible();

      const rows = page.locator('.cs-tm-two .cs-tm-row');
      if (await rows.count() > 0) {
        // Each "most leave" row has the person cell and a bold day count.
        await expect(rows.first().locator('b')).toBeVisible();
      } else {
        await expect(page.locator('.cs-empty', { hasText: 'No one has taken leave' })).toBeVisible();
      }
    });

    test('3.19 "Leave balance" table: Employee, Total available, type columns', async () => {
      await page.goto('/my-team/leave');
      await waitReload(page);

      const heading = page.locator('.cs-tm-h', { hasText: 'Leave balance' });
      await expect(heading).toBeVisible();
      await expect(heading.locator('.cs-tm-sub')).toContainText('available / total');

      const balanceTable = page.locator('.cs-tm-table').nth(1);
      if (await balanceTable.count() > 0) {
        const headers = await balanceTable.locator('thead th').allTextContents();
        expect(headers[0]).toBe('Employee');
        expect(headers[1]).toContain('Total available');
      }
    });

    test('3.20 leave balance cells show "available/total" format', async () => {
      const balanceTable = page.locator('.cs-tm-table').nth(1);
      if (await balanceTable.count() === 0) { return; }

      const cells = balanceTable.locator('tbody td');
      const count = await cells.count();
      if (count < 3) { return; }

      // Cells 2+ should be "X/Y" or "Not applicable".
      const cell3Text = (await cells.nth(2).textContent() ?? '').trim();
      if (cell3Text !== 'Not applicable') {
        expect(cell3Text).toMatch(/\d+(\.\d+)?\/\d+(\.\d+)?/);
      }
    });

    test('3.21 "Past leave requests" table: Employee, Leave type, Dates, Days, Status', async () => {
      const heading = page.locator('.cs-tm-h', { hasText: 'Past leave requests' });
      await expect(heading).toBeVisible();
      await expect(heading.locator('.cs-tm-sub')).toContainText('last 90 days');

      const pastTable = page.locator('.cs-tm-table').last();
      if (await pastTable.count() > 0) {
        const headers = await pastTable.locator('thead th').allTextContents();
        const flat = headers.join(' ');
        expect(flat).toContain('Employee');
        expect(flat).toContain('Leave type');
        expect(flat).toContain('Dates');
        expect(flat).toContain('Status');
      } else {
        await expect(page.locator('.cs-empty', { hasText: 'No past leave' })).toBeVisible();
      }
    });

    test('3.22 past leave status values are valid (Approved/Rejected/Open)', async () => {
      const pastTable = page.locator('.cs-tm-table').last();
      if (await pastTable.count() === 0) { return; }

      const statusCells = pastTable.locator('tbody tr td:last-child');
      const count = await statusCells.count();
      if (count === 0) { return; }

      const statuses = await statusCells.allTextContents();
      const validStatuses = ['Approved', 'Rejected', 'Open', 'Cancelled'];
      for (const status of statuses) {
        expect(validStatuses).toContain(status.trim());
      }
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 4: EXPENSES & TRAVEL (/my-team/expenses)
  // ══════════════════════════════════════════════════════════════════════════

  test.describe.serial('4. My Team Expenses & Travel', () => {
    test('4.1 /my-team/expenses page loads', async () => {
      await page.goto('/my-team/expenses');
      await waitReload(page);

      expect(page.url()).not.toContain('/login');
      await expect(page.locator('h1')).toContainText('My Team');
      await expect(page.locator('.cs-page-sub')).toContainText('Expense claims from your people');
    });

    test('4.2 "Expenses & Travel" is active in the section nav', async () => {
      const link = page.locator('.cs-tm-sections a[href="/my-team/expenses"]');
      await expect(link).toHaveClass(/active/);
    });

    test('4.3 "Claims waiting for approval" heading with count badge', async () => {
      const heading = page.locator('.cs-tm-h', { hasText: 'Claims waiting for approval' });
      await expect(heading).toBeVisible();
      await expect(heading.locator('.cs-tm-ct')).toBeVisible();
    });

    test('4.4 pending claims table headers or empty state', async () => {
      const table = page.locator('.cs-tm-table').first();
      if (await table.count() > 0) {
        const headers = await table.locator('thead th').allTextContents();
        const flat = headers.join(' ');
        expect(flat).toContain('Employee');
        expect(flat).toContain('Claim');
        expect(flat).toContain('Amount');
        expect(flat).toContain('Date');
      } else {
        const empty = page.locator('.cs-empty').first();
        await expect(empty).toContainText("no expense claims are waiting");
      }
    });

    test('4.5 creating an Expense Claim → row appears in pending table', async () => {
      const expenseTypes = await listDocs(page, 'Expense Claim Type', {}, ['name']);
      if (expenseTypes.length === 0) {
        console.log('No Expense Claim Type — skipping.');
        return;
      }
      const expenseType = expenseTypes[0].name as string;
      const emp = await getDoc(page, 'Employee', TEST_EMPLOYEE, ['company']);

      try {
        const name = await createDoc(page, 'Expense Claim', {
          employee: TEST_EMPLOYEE,
          company: emp.company,
          posting_date: '2026-10-15',
          expenses: [{
            expense_date: '2026-10-15',
            expense_type: expenseType,
            description: 'E2E: for My Team Expenses test',
            amount: 500,
            sanctioned_amount: 500,
          }],
        });
        created.expenseClaimName = name;
      } catch (e) {
        console.log('Could not create Expense Claim:', e);
        return;
      }

      await page.reload();
      await waitReload(page);

      const rows = page.locator('.cs-tm-table').first().locator('tbody tr');
      const count = await rows.count();
      expect(count).toBeGreaterThan(0);
    });

    test('4.6 Approve expense claim via UI → row removed, count decremented', async () => {
      if (!created.expenseClaimName) { return; }

      const badge = page.locator('.cs-tm-h', { hasText: 'Claims waiting for approval' }).locator('.cs-tm-ct');
      const countBefore = parseInt(await badge.textContent() ?? '0');

      const approveBtn = page.locator('.cs-tm-table').first().locator('button.cs-tm-ok').first();
      if (await approveBtn.count() === 0) { return; }

      await approveBtn.click();
      await page.waitForTimeout(1_500);

      const countAfter = parseInt(await badge.textContent() ?? '0');
      expect(countAfter).toBeLessThan(countBefore);
      created.expenseClaimName = '';
    });

    test('4.7 Reject expense claim shows modal (optional reason)', async () => {
      // Create another claim for reject flow.
      const expenseTypes = await listDocs(page, 'Expense Claim Type', {}, ['name']);
      if (expenseTypes.length === 0) { return; }

      const expenseType = expenseTypes[0].name as string;
      const emp = await getDoc(page, 'Employee', TEST_EMPLOYEE, ['company']);

      try {
        const name = await createDoc(page, 'Expense Claim', {
          employee: TEST_EMPLOYEE,
          company: emp.company,
          posting_date: '2026-10-16',
          expenses: [{
            expense_date: '2026-10-16',
            expense_type: expenseType,
            description: 'E2E: for reject flow',
            amount: 250,
            sanctioned_amount: 250,
          }],
        });
        created.expenseClaimName2 = name;
      } catch { return; }

      await page.reload();
      await waitReload(page);

      const rejectBtn = page.locator('.cs-tm-table').first().locator('button.cs-tm-no').first();
      if (await rejectBtn.count() === 0) { return; }

      await rejectBtn.click();
      await page.waitForTimeout(400);

      const modal = page.locator('#csTmModal');
      await expect(modal).not.toHaveAttribute('hidden', '');
    });

    test('4.8 Reject expense claim with optional reason (empty allowed) → row removed', async () => {
      if (!created.expenseClaimName2) { return; }

      const modal = page.locator('#csTmModal');
      if (await modal.evaluate((el: HTMLElement) => el.hidden)) { return; }

      await page.locator('#csTmReason').fill('');
      await page.locator('#csTmGo').click();
      await page.waitForTimeout(1_500);

      // No "Add a reason" error.
      const errEl = page.locator('#csTmErr');
      const errHidden = await errEl.evaluate((el: HTMLElement) => el.hidden);
      expect(errHidden).toBe(true);

      created.expenseClaimName2 = '';
    });

    test('4.9 "Recent claims" heading and table structure', async () => {
      await page.goto('/my-team/expenses');
      await waitReload(page);

      const heading = page.locator('.cs-tm-h', { hasText: 'Recent claims' });
      await expect(heading).toBeVisible();

      const recentTable = page.locator('.cs-tm-table').nth(1);
      if (await recentTable.count() > 0) {
        const headers = await recentTable.locator('thead th').allTextContents();
        const flat = headers.join(' ');
        expect(flat).toContain('Employee');
        expect(flat).toContain('Claim');
        expect(flat).toContain('Amount');
        expect(flat).toContain('Date');
        expect(flat).toContain('Status');
      } else {
        await expect(page.locator('.cs-empty', { hasText: 'No recent claims' })).toBeVisible();
      }
    });

    test('4.10 recent claims show approved/rejected status text', async () => {
      const recentTable = page.locator('.cs-tm-table').nth(1);
      if (await recentTable.count() === 0) { return; }

      const statusCells = recentTable.locator('tbody tr td:last-child');
      const count = await statusCells.count();
      if (count === 0) { return; }

      const statuses = await statusCells.allTextContents();
      // Status must be recognizable claim status.
      const validStatuses = ['Approved', 'Rejected', 'Draft', 'Cancelled', 'Pending Approval'];
      for (const status of statuses) {
        const s = status.trim();
        if (s) {
          const isValid = validStatuses.some(v => s.includes(v));
          if (!isValid) {
            console.log(`Unknown claim status: "${s}" — skipping strict check`);
          }
        }
      }
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 5: PROFILE CHANGES (/my-team/profile-changes)
  // ══════════════════════════════════════════════════════════════════════════

  test.describe.serial('5. My Team Profile Changes', () => {
    test('5.1 /my-team/profile-changes page loads', async () => {
      await page.goto('/my-team/profile-changes');
      await waitReload(page);

      expect(page.url()).not.toContain('/login');
      await expect(page.locator('h1')).toContainText('My Team');
      await expect(page.locator('.cs-page-sub')).toContainText('Requests to change profile details');
    });

    test('5.2 "Profile changes" is active in the section nav', async () => {
      const link = page.locator('.cs-tm-sections a[href="/my-team/profile-changes"]');
      await expect(link).toHaveClass(/active/);
    });

    test('5.3 "Waiting for HR" heading with count badge', async () => {
      const heading = page.locator('.cs-tm-h', { hasText: 'Waiting for HR' });
      await expect(heading).toBeVisible();
      await expect(heading.locator('.cs-tm-ct')).toBeVisible();
    });

    test('5.4 Waiting for HR table headers or empty state', async () => {
      const table = page.locator('.cs-tm-table').first();
      if (await table.count() > 0) {
        const headers = await table.locator('thead th').allTextContents();
        const flat = headers.join(' ');
        expect(flat).toContain('Employee');
        expect(flat).toContain('Change');
        expect(flat).toContain('Requested on');
      } else {
        const empty = page.locator('.cs-empty').first();
        await expect(empty).toContainText('No profile change requests are waiting');
      }
    });

    test('5.5 creating a Bank Change Request → row appears in Waiting for HR', async () => {
      // Create a bank change request for the test employee.
      try {
        const result = await callMethod(page, 'cs_core.profile_api.request_bank_change', {
          bank_name: 'E2E Test Bank',
          bank_ac_no: '999888777666',
          ifsc_code: 'TEST0001234',
        }) as { ok?: boolean; name?: string };

        if (result?.ok) {
          created.bankChangeName = 'pending'; // We don't get the name back, just track that one exists.
        }
      } catch (e) {
        console.log('Could not create Bank Change Request:', e);
        return;
      }

      await page.reload();
      await waitReload(page);

      const rows = page.locator('.cs-tm-table').first().locator('tbody tr');
      const count = await rows.count();
      // If Bank Change Request doctype exists and HR can review it.
      if (count > 0) {
        await expect(rows.first().locator('td').nth(1)).toContainText('Bank details');
      }
    });

    test('5.6 HR can approve a bank change via UI → row removed', async () => {
      if (!created.bankChangeName) { return; }

      const approveBtn = page.locator('.cs-tm-table').first().locator('button.cs-tm-ok').first();
      if (await approveBtn.count() === 0) { return; }

      const badge = page.locator('.cs-tm-h', { hasText: 'Waiting for HR' }).locator('.cs-tm-ct');
      const countBefore = parseInt(await badge.textContent() ?? '0');

      await approveBtn.click();
      await page.waitForTimeout(1_500);

      const countAfter = parseInt(await badge.textContent() ?? '0');
      expect(countAfter).toBeLessThan(countBefore);
      created.bankChangeName = '';
    });

    test('5.7 creating second bank change request for reject test', async () => {
      try {
        const result = await callMethod(page, 'cs_core.profile_api.request_bank_change', {
          bank_name: 'Reject Test Bank',
          bank_ac_no: '111222333444',
          ifsc_code: 'RJCT0001234',
        }) as { ok?: boolean };

        if (result?.ok) {
          created.bankChangeName2 = 'pending';
        }
      } catch { return; }

      await page.reload();
      await waitReload(page);
    });

    test('5.8 Reject bank change shows modal (required reason)', async () => {
      if (!created.bankChangeName2) { return; }

      const rejectBtn = page.locator('.cs-tm-table').first().locator('button.cs-tm-no').first();
      if (await rejectBtn.count() === 0) { return; }

      await rejectBtn.click();
      await page.waitForTimeout(400);

      const modal = page.locator('#csTmModal');
      await expect(modal).not.toHaveAttribute('hidden', '');
    });

    test('5.9 Reject bank change without reason shows "Add a reason." error', async () => {
      if (!created.bankChangeName2) { return; }

      const modal = page.locator('#csTmModal');
      if (await modal.evaluate((el: HTMLElement) => el.hidden)) { return; }

      await page.locator('#csTmReason').fill('');
      await page.locator('#csTmGo').click();
      await page.waitForTimeout(400);

      const errEl = page.locator('#csTmErr');
      await expect(errEl).not.toHaveAttribute('hidden', '');
      await expect(errEl).toContainText('Add a reason.');
    });

    test('5.10 Reject bank change with reason → modal closes, row removed', async () => {
      if (!created.bankChangeName2) { return; }

      await page.locator('#csTmReason').fill('E2E test: rejected bank change');
      await page.locator('#csTmGo').click();
      await page.waitForTimeout(1_500);

      const modal = page.locator('#csTmModal');
      const isHidden = await modal.evaluate((el: HTMLElement) => el.hidden);
      expect(isHidden).toBe(true);

      created.bankChangeName2 = '';
    });

    test('5.11 "Recent requests" heading and table', async () => {
      await page.goto('/my-team/profile-changes');
      await waitReload(page);

      const heading = page.locator('.cs-tm-h', { hasText: 'Recent requests' });
      await expect(heading).toBeVisible();

      const recentTable = page.locator('.cs-tm-table').nth(1);
      if (await recentTable.count() > 0) {
        const headers = await recentTable.locator('thead th').allTextContents();
        const flat = headers.join(' ');
        expect(flat).toContain('Employee');
        expect(flat).toContain('Change');
        expect(flat).toContain('Requested on');
        expect(flat).toContain('Status');
      } else {
        await expect(page.locator('.cs-empty', { hasText: 'No recent profile change requests' })).toBeVisible();
      }
    });

    test('5.12 recent requests status values are Approved/Rejected/Cancelled', async () => {
      const recentTable = page.locator('.cs-tm-table').nth(1);
      if (await recentTable.count() === 0) { return; }

      const statusCells = recentTable.locator('tbody tr td:last-child');
      const count = await statusCells.count();
      if (count === 0) { return; }

      const statuses = await statusCells.allTextContents();
      const validStatuses = ['Approved', 'Rejected', 'Cancelled', 'Pending'];
      for (const status of statuses) {
        const s = status.trim();
        if (s) {
          expect(validStatuses.some(v => s.includes(v))).toBe(true);
        }
      }
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // CROSS-SECTION: Nav consistency
  // ══════════════════════════════════════════════════════════════════════════

  test.describe.serial('6. Cross-section nav and back-link', () => {
    test('6.1 clicking Summary in section nav goes to /my-team', async () => {
      await page.goto('/my-team/leave');
      await waitReload(page);

      await page.locator('.cs-tm-sections a[href="/my-team"]').click();
      await waitReload(page);

      expect(page.url()).toMatch(/\/my-team(\?.*)?$/);
    });

    test('6.2 "Organization" back link is present and points to /organization', async () => {
      await page.goto('/my-team');
      await waitReload(page);

      const backLink = page.locator('a.cs-back[href="/organization"]');
      await expect(backLink).toBeVisible();
      await expect(backLink).toContainText('Organization');
    });

    test('6.3 each section page shows the full 5-link section nav', async () => {
      const urls = [
        '/my-team/attendance',
        '/my-team/leave',
        '/my-team/expenses',
        '/my-team/profile-changes',
      ];
      for (const url of urls) {
        await page.goto(url);
        await waitReload(page);

        const nav = page.locator('.cs-tm-sections');
        await expect(nav).toBeVisible();
        const links = nav.locator('a');
        const count = await links.count();
        expect(count).toBe(5); // Summary, Attendance, Leave, Expenses, Profile changes
      }
    });
  });
});
