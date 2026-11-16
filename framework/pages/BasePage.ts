import { Page, expect } from '@playwright/test';

/**
 * BasePage holds only functionality that is genuinely useful across all page objects.
 * It does NOT wrap every Playwright API — use `this.page` directly for standard interactions.
 */
export class BasePage {
  constructor(protected readonly page: Page) {}

  async navigate(url: string): Promise<void> {
    await this.page.goto(url);
    await this.waitForPageReady();
  }

  async waitForPageReady(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  async getPageTitle(): Promise<string> {
    return this.page.title();
  }

  async expectPageTitle(expected: string): Promise<void> {
    await expect(this.page).toHaveTitle(expected);
  }

  async expectUrl(urlOrPattern: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(urlOrPattern);
  }
}
