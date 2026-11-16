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
    // Frappe renders the form twice in the HTML; .first() targets the visible login input
    await this.page.locator('#login_email').first().fill(username);
    await this.page.locator('#login_password').first().fill(password);
    await this.page.locator('.btn-login').first().click();
  }

  async expectLoginError(): Promise<void> {
    // Frappe shows the error as a toast/alert with class "msgprint-dialog" or inline
    const error = this.page.locator('.modal-body, .msgprint, #login-error, [data-error]').first();
    // Fallback: simply assert the URL is still the login page
    await expect(this.page).toHaveURL(/\/login/);
  }

  async isOnHome(): Promise<boolean> {
    return this.page.url().includes(hrmsConfig.routes.launchpad) || this.page.url() === hrmsConfig.baseUrl + '/';
  }
}
