import { test as base, APIRequestContext, BrowserContext, Page } from '@playwright/test';

export interface BaseFixtures {
  /** Pre-authenticated page. The project fixture must implement the login logic. */
  authenticatedPage: Page;
  /** Shared API request context, inherits baseURL from project config. */
  apiContext: APIRequestContext;
}

/**
 * Base test object extended by project-level fixtures.
 *
 * Usage in a project:
 *
 *   import { test as base } from '@framework/fixtures/base';
 *
 *   const test = base.extend<YourProjectFixtures>({
 *     authenticatedPage: async ({ browser }, use) => {
 *       const context = await browser.newContext({ storageState: '...' });
 *       const page = await context.newPage();
 *       await use(page);
 *       await context.close();
 *     },
 *   });
 *
 *   export { test };
 */
export const test = base.extend<BaseFixtures>({
  // Projects override this with their own authentication logic.
  authenticatedPage: async ({ page }: { page: Page; context: BrowserContext }, use) => {
    // Default: unauthenticated page — projects should override this.
    await use(page);
  },

  apiContext: async ({ playwright }, use) => {
    const context = await playwright.request.newContext();
    await use(context);
    await context.dispose();
  },
});

export { expect } from '@playwright/test';
