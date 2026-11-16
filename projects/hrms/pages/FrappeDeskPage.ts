/**
 * Page object for interacting with Frappe desk form pages.
 *
 * Handles the common patterns in Frappe v15 forms:
 *  - Text / Data / Number fields  (input)
 *  - Link fields                  (input + awesomplete dropdown)
 *  - Select fields                (native <select>)
 *  - Check fields                 (input[type="checkbox"])
 *  - Date fields                  (input + Tab-to-confirm)
 *  - Text editor fields           (Quill .ql-editor)
 *  - Child table rows             (.grid-add-row + inline edit)
 *  - Form save                    (button[data-label="Save"])
 *  - Form submit                  (button[data-label="Submit"] or Actions > Submit)
 *  - Submit confirmation modal    (.modal .btn-primary)
 */
import { Page } from '@playwright/test';

export class FrappeDeskPage {
  constructor(private readonly page: Page) {}

  async goto(url: string): Promise<void> {
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(600);
  }

  // ── Plain text / data / numeric input ───────────────────────────────────────

  async fillField(fieldname: string, value: string): Promise<void> {
    const input = this.page.locator(`[data-fieldname="${fieldname}"] input`).first();
    await input.click();
    await input.fill(value);
  }

  // ── Link field (awesomplete autocomplete) ───────────────────────────────────

  async setLinkField(fieldname: string, value: string): Promise<void> {
    const input = this.page.locator(`[data-fieldname="${fieldname}"] input`).first();
    await input.click();
    await input.fill('');
    await input.fill(value);
    // Wait for the awesomplete suggestion list to appear.
    const list = this.page.locator('.awesomplete li');
    try {
      await list.first().waitFor({ state: 'visible', timeout: 4_000 });
      // Click the entry that matches the value.
      const match = list.filter({ hasText: value }).first();
      if (await match.isVisible()) {
        await match.click();
      } else {
        await list.first().click();
      }
    } catch {
      // No dropdown — the value may already be exact; press Tab to confirm.
      await this.page.keyboard.press('Tab');
      await this.page.waitForTimeout(400);
    }
  }

  // ── Select field (native <select>) ─────────────────────────────────────────

  async setSelectField(fieldname: string, value: string): Promise<void> {
    await this.page.selectOption(`[data-fieldname="${fieldname}"] select`, { label: value });
  }

  // ── Checkbox ────────────────────────────────────────────────────────────────

  async checkField(fieldname: string): Promise<void> {
    const cb = this.page.locator(`[data-fieldname="${fieldname}"] input[type="checkbox"]`);
    if (!(await cb.isChecked())) await cb.check();
  }

  async uncheckField(fieldname: string): Promise<void> {
    const cb = this.page.locator(`[data-fieldname="${fieldname}"] input[type="checkbox"]`);
    if (await cb.isChecked()) await cb.uncheck();
  }

  // ── Date field (YYYY-MM-DD) ─────────────────────────────────────────────────

  async fillDateField(fieldname: string, date: string): Promise<void> {
    const input = this.page.locator(`[data-fieldname="${fieldname}"] input`).first();
    await input.click();
    await input.fill(date);
    await this.page.keyboard.press('Tab');
    await this.page.waitForTimeout(200);
  }

  // ── Quill text editor ───────────────────────────────────────────────────────

  async fillTextEditor(fieldname: string, text: string): Promise<void> {
    const editor = this.page.locator(`[data-fieldname="${fieldname}"] .ql-editor`);
    await editor.click();
    await editor.fill(text);
  }

  // ── Tab navigation ──────────────────────────────────────────────────────────

  async clickTab(tabText: string): Promise<void> {
    await this.page.locator(`.nav-tabs .nav-link:has-text("${tabText}")`).click();
    await this.page.waitForTimeout(400);
  }

  // ── Child table helpers ─────────────────────────────────────────────────────

  /** Click "Add Row" on a child table. The new row opens in inline edit mode. */
  async addTableRow(tablefieldname: string): Promise<void> {
    await this.page
      .locator(`[data-fieldname="${tablefieldname}"] .grid-add-row`)
      .click();
    await this.page.waitForTimeout(500);
  }

  /** Fill a link field in the currently open (last) child table row. */
  async setTableRowLink(
    tablefieldname: string,
    childFieldname: string,
    value: string
  ): Promise<void> {
    const input = this.page
      .locator(
        `[data-fieldname="${tablefieldname}"] .grid-row-open [data-fieldname="${childFieldname}"] input`
      )
      .first();
    await input.click();
    await input.fill('');
    await input.fill(value);
    const list = this.page.locator('.awesomplete li');
    try {
      await list.first().waitFor({ state: 'visible', timeout: 4_000 });
      const match = list.filter({ hasText: value }).first();
      if (await match.isVisible()) {
        await match.click();
      } else {
        await list.first().click();
      }
    } catch {
      await this.page.keyboard.press('Tab');
      await this.page.waitForTimeout(400);
    }
  }

  /** Fill a plain input inside the currently open child table row. */
  async fillTableRowField(
    tablefieldname: string,
    childFieldname: string,
    value: string
  ): Promise<void> {
    const input = this.page
      .locator(
        `[data-fieldname="${tablefieldname}"] .grid-row-open [data-fieldname="${childFieldname}"] input`
      )
      .first();
    await input.click();
    await input.fill(value);
  }

  /** Uncheck a checkbox inside the currently open child table row. */
  async uncheckTableRowField(
    tablefieldname: string,
    childFieldname: string
  ): Promise<void> {
    const cb = this.page
      .locator(
        `[data-fieldname="${tablefieldname}"] .grid-row-open [data-fieldname="${childFieldname}"] input[type="checkbox"]`
      )
      .first();
    if (await cb.isChecked().catch(() => false)) await cb.uncheck();
  }

  // ── Save / Submit ───────────────────────────────────────────────────────────

  /** Click the Save button and wait for the form to settle. */
  async save(): Promise<void> {
    await this.page.locator('button[data-label="Save"]').click();
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(600);
  }

  /** Submit a draft document and confirm any modal that appears. */
  async submitDoc(): Promise<void> {
    // Frappe shows "Submit" directly after save on submittable docs.
    const directBtn = this.page.locator('button[data-label="Submit"]');
    if (await directBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await directBtn.click();
    } else {
      // Fall back to Actions > Submit dropdown item.
      await this.page
        .locator('.page-head button:has-text("Actions")')
        .first()
        .click();
      await this.page.locator('.dropdown-item:has-text("Submit")').click();
    }
    // Frappe shows a confirmation modal — accept it.
    const yes = this.page
      .locator('.modal-dialog button:has-text("Yes"), .modal .btn-primary')
      .first();
    try {
      await yes.waitFor({ state: 'visible', timeout: 3_000 });
      await yes.click();
    } catch { /* no modal */ }
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(600);
  }

  /** Returns the document name shown in the current URL. */
  async currentDocName(): Promise<string> {
    return decodeURIComponent(this.page.url().split('/').at(-1) ?? '');
  }
}
