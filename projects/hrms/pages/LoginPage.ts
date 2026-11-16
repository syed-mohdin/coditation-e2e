import { Page, expect } from '@playwright/test';
import { BasePage } from '../../../framework/pages/BasePage';
import { hrmsConfig } from '../config';

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.navigate(hrmsConfig.routes.login);
  }

  async login(username: string, password: string): Promise<void> {
    await this.page.getByLabel('Username').fill(username);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: /sign in|log in/i }).click();
  }

  async expectLoginError(message?: string): Promise<void> {
    const errorLocator = this.page.getByRole('alert');
    await expect(errorLocator).toBeVisible();
    if (message) {
      await expect(errorLocator).toContainText(message);
    }
  }

  async isOnDashboard(): Promise<boolean> {
    return this.page.url().includes(hrmsConfig.routes.dashboard);
  }
}
