import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../../../framework/pages/BasePage';

/** A single readiness check row on the /setup page. */
export interface SetupCheck {
  label: string;
  blocking: boolean;
  ok: boolean;
}

/** A module section on the /setup page. */
export interface SetupModuleSection {
  label: string;
  ready: boolean;
  checks: SetupCheck[];
}

export class SetupPage extends BasePage {
  readonly url = '/setup';

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.navigate(this.url);
    await this.page.waitForLoadState('networkidle');
  }

  // ── Module overview (top card: "Modules") ──────────────────────────────────

  /** Returns the state text shown for a module in the overview card (e.g. "Live", "Setting up"). */
  async moduleOverviewState(moduleLabel: string): Promise<string> {
    const item = this.page
      .locator('#setupModules .cs-setup-item')
      .filter({ hasText: moduleLabel })
      .first();
    await item.waitFor({ state: 'visible', timeout: 5_000 });
    const detail = item.locator('.cs-setup-detail');
    return (await detail.textContent() ?? '').trim().split('·')[0].trim();
  }

  /** All module labels in the overview card. */
  async moduleOverviewLabels(): Promise<string[]> {
    await this.page.locator('#setupModules').waitFor({ state: 'visible' });
    return this.page.locator('#setupModules .cs-setup-label').allTextContents();
  }

  // ── Per-module check sections (bottom cards) ───────────────────────────────

  /** Finds a module section card by its heading label. Returns the section locator. */
  private moduleSection(label: string): Locator {
    return this.page
      .locator('section.cs-setup-mod')
      .filter({ has: this.page.locator('.cs-card-title', { hasText: label }) })
      .first();
  }

  /** Returns true when the module section shows a "Ready" pill (green = fully ready, slate = ready with optional items pending). */
  async isSectionReady(sectionLabel: string): Promise<boolean> {
    const section = this.moduleSection(sectionLabel);
    await section.waitFor({ state: 'visible', timeout: 5_000 });
    const hasGreen = await section.locator('.cs-pill-green').isVisible();
    const hasSlate = await section.locator('.cs-pill-slate').isVisible();
    return hasGreen || hasSlate;
  }

  /** Returns true when the section shows the "Not ready" amber pill. */
  async isSectionNotReady(sectionLabel: string): Promise<boolean> {
    const section = this.moduleSection(sectionLabel);
    await section.waitFor({ state: 'visible', timeout: 5_000 });
    return section.locator('.cs-pill-amber').isVisible();
  }

  /** Returns all check labels within a section. */
  async sectionCheckLabels(sectionLabel: string): Promise<string[]> {
    const section = this.moduleSection(sectionLabel);
    await section.waitFor({ state: 'visible', timeout: 5_000 });
    return section.locator('.cs-setup-label').allTextContents();
  }

  /** Returns whether a named check inside a section is ticked (ok). */
  async isCheckOk(sectionLabel: string, checkLabel: string): Promise<boolean> {
    const section = this.moduleSection(sectionLabel);
    const row = section
      .locator('.cs-setup-item')
      .filter({ hasText: checkLabel })
      .first();
    await row.waitFor({ state: 'visible', timeout: 5_000 });
    return row.locator('.cs-setup-mark').textContent().then((t) => (t ?? '').trim() === '✓');
  }

  /** Returns whether a named check is marked as optional (non-blocking). */
  async isCheckOptional(sectionLabel: string, checkLabel: string): Promise<boolean> {
    const section = this.moduleSection(sectionLabel);
    const row = section
      .locator('.cs-setup-item')
      .filter({ hasText: checkLabel })
      .first();
    return row.locator('.cs-setup-optional').isVisible();
  }

  /** Returns the "Fix in Desk" / "Open" link href for a failing check. */
  async checkFixUrl(sectionLabel: string, checkLabel: string): Promise<string> {
    const section = this.moduleSection(sectionLabel);
    const row = section
      .locator('.cs-setup-item')
      .filter({ hasText: checkLabel })
      .first();
    const link = row.locator('.cs-setup-fix');
    return (await link.getAttribute('href')) ?? '';
  }

  // ── Convenience assertions ─────────────────────────────────────────────────

  async expectSectionReady(label: string): Promise<void> {
    const section = this.moduleSection(label);
    const green = section.locator('.cs-pill-green');
    const slate = section.locator('.cs-pill-slate');
    await expect(green.or(slate)).toBeVisible({ timeout: 10_000 });
  }

  async expectSectionNotReady(label: string): Promise<void> {
    const section = this.moduleSection(label);
    await expect(section.locator('.cs-pill-amber')).toBeVisible({ timeout: 10_000 });
  }

  async expectCheckOk(sectionLabel: string, checkLabel: string): Promise<void> {
    const section = this.moduleSection(sectionLabel);
    const row = section
      .locator('.cs-setup-item')
      .filter({ hasText: checkLabel })
      .first();
    await expect(row.locator('.cs-setup-mark')).toHaveText('✓', { timeout: 10_000 });
  }

  async expectCheckMissing(sectionLabel: string, checkLabel: string): Promise<void> {
    const section = this.moduleSection(sectionLabel);
    const row = section
      .locator('.cs-setup-item')
      .filter({ hasText: checkLabel })
      .first();
    await expect(row.locator('.cs-setup-mark')).not.toHaveText('✓', { timeout: 10_000 });
  }

  /** Reloads /setup and waits for it to settle. */
  async reload(): Promise<void> {
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');
  }
}
