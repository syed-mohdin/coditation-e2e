import { Page, expect } from '@playwright/test';
import { BasePage } from '../../../framework/pages/BasePage';
import { hrmsConfig } from '../config';

export class MyTeamPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.navigate(hrmsConfig.routes.myTeam);
  }

  async expectPageVisible(): Promise<void> {
    // Look for the My Team heading — adjust selector to match the real app.
    await expect(this.page.getByRole('heading', { name: /my team/i })).toBeVisible();
  }

  async openEmployee(name: string): Promise<void> {
    await this.page.getByRole('link', { name }).click();
    await this.waitForPageReady();
  }

  async getEmployeeNames(): Promise<string[]> {
    const cells = this.page.getByRole('cell', { name: /\w+/ });
    return cells.allTextContents();
  }
}
