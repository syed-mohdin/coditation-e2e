import { Page } from '@playwright/test';

/**
 * Waits for navigation to settle after an action that triggers a page load.
 * Prefer Playwright's built-in auto-waiting over arbitrary timeouts.
 */
export async function waitForNavigation(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
}

/**
 * Builds a full URL from a base and a relative path, handling trailing slashes.
 */
export function buildUrl(baseUrl: string, relativePath: string): string {
  const base = baseUrl.replace(/\/$/, '');
  const rel = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${base}${rel}`;
}
