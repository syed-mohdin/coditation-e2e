import { BrowserContext, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthConfig {
  /** Absolute path where the storage state JSON will be written/read. */
  storageStatePath: string;
}

/**
 * Returns true when a saved storage-state file exists and can be reused.
 * Does NOT validate whether the session is still active — the test must do that.
 */
export function hasStorageState(config: AuthConfig): boolean {
  return fs.existsSync(config.storageStatePath);
}

/**
 * Saves the current browser context's storage state (cookies + localStorage)
 * to disk so subsequent tests can skip the login flow.
 */
export async function saveStorageState(context: BrowserContext, config: AuthConfig): Promise<void> {
  const dir = path.dirname(config.storageStatePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  await context.storageState({ path: config.storageStatePath });
}

/**
 * Clears all cookies and storage from the context, effectively logging out
 * without navigating to a logout URL.
 */
export async function clearSession(context: BrowserContext): Promise<void> {
  await context.clearCookies();
}

/**
 * Removes a saved storage-state file so the next test run performs a fresh login.
 */
export function invalidateStorageState(config: AuthConfig): void {
  if (fs.existsSync(config.storageStatePath)) {
    fs.unlinkSync(config.storageStatePath);
  }
}

/**
 * Generic helper: waits for a page element that signals a successful login,
 * then saves the storage state.
 *
 * The caller is responsible for the actual login form interaction — this keeps
 * the helper application-agnostic.
 */
export async function saveSessionAfterLogin(
  page: Page,
  context: BrowserContext,
  config: AuthConfig,
  successIndicator: () => Promise<void>
): Promise<void> {
  await successIndicator();
  await saveStorageState(context, config);
}
