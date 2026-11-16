import { Page, expect } from '@playwright/test';
import { BasePage } from '../../../framework/pages/BasePage';

export class SettingsModulesPage extends BasePage {
  readonly url = '/settings?section=modules';

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.navigate(this.url);
    await this.page.waitForLoadState('networkidle');
    // The modules grid is rendered by JS; wait for at least one card to appear.
    await this.page.locator('.cs-mod-card').first().waitFor({ state: 'visible', timeout: 15_000 });
  }

  /** Returns the state tag text for a module card (e.g. "Live", "Ready to release"). */
  async moduleState(moduleLabel: string): Promise<string> {
    const card = this.page
      .locator('.cs-mod-card')
      .filter({ hasText: moduleLabel })
      .first();
    await card.waitFor({ state: 'visible', timeout: 5_000 });
    return (await card.locator('.cs-mod-tag').textContent() ?? '').trim();
  }

  /** All module labels shown on the grid. */
  async allModuleLabels(): Promise<string[]> {
    await this.page.locator('.cs-mod-card').first().waitFor({ state: 'visible', timeout: 15_000 });
    return this.page.locator('.cs-mod-card h2').allTextContents().then(
      (labels) => labels.map((l) => l.replace(/\s*(Not added|Installing|Setting up|Ready to release|Live|Off|Install failed)\s*$/i, '').trim())
    );
  }

  /** Clicks "Release to employees" for a module in state "ready". */
  async releaseModule(moduleLabel: string): Promise<void> {
    const card = this.page
      .locator('.cs-mod-card')
      .filter({ hasText: moduleLabel })
      .first();
    await card.locator('button', { hasText: 'Release to employees' }).click();
    // Confirm the browser dialog
    this.page.once('dialog', (d) => d.accept());
    // Wait for the card to show Live
    await expect(card.locator('.cs-mod-tag')).toHaveText('Live', { timeout: 15_000 });
  }

  /** Clicks "Turn off" for a live module. */
  async turnOffModule(moduleLabel: string): Promise<void> {
    const card = this.page
      .locator('.cs-mod-card')
      .filter({ hasText: moduleLabel })
      .first();
    this.page.once('dialog', (d) => d.accept());
    await card.locator('button', { hasText: 'Turn off' }).click();
    await expect(card.locator('.cs-mod-tag')).toHaveText('Off', { timeout: 15_000 });
  }

  /** Clicks "Turn on" for an off module. */
  async turnOnModule(moduleLabel: string): Promise<void> {
    const card = this.page
      .locator('.cs-mod-card')
      .filter({ hasText: moduleLabel })
      .first();
    this.page.once('dialog', (d) => d.accept());
    await card.locator('button', { hasText: 'Turn on' }).click();
  }

  async expectModuleLive(moduleLabel: string): Promise<void> {
    const card = this.page
      .locator('.cs-mod-card')
      .filter({ hasText: moduleLabel })
      .first();
    await expect(card.locator('.cs-mod-tag')).toHaveText('Live', { timeout: 15_000 });
  }

  async expectModuleState(moduleLabel: string, state: string): Promise<void> {
    const card = this.page
      .locator('.cs-mod-card')
      .filter({ hasText: moduleLabel })
      .first();
    await expect(card.locator('.cs-mod-tag')).toHaveText(state, { timeout: 15_000 });
  }
}
