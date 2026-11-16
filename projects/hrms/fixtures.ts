import { test as base, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { hrmsConfig } from './config';
import { hasStorageState, saveStorageState } from '../../framework/helpers/auth';

interface HrmsFixtures {
  /** Page with a valid HRMS session already established. */
  authenticatedPage: import('@playwright/test').Page;
}

export const test = base.extend<HrmsFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    const authConfig = hrmsConfig.auth;

    if (hasStorageState(authConfig)) {
      // Reuse the saved session — no login form needed.
      const context = await browser.newContext({ storageState: authConfig.storageStatePath });
      const page = await context.newPage();
      await use(page);
      await context.close();
    } else {
      // Perform a fresh login and save the session for subsequent tests.
      const context = await browser.newContext();
      const page = await context.newPage();

      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(hrmsConfig.credentials.username, hrmsConfig.credentials.password);

      // Wait for post-login redirect — Frappe lands on the launchpad (/).
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });

      await saveStorageState(context, authConfig);

      await use(page);
      await context.close();
    }
  },
});

export { expect };
