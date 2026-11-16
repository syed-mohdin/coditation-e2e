import { Locator } from '@playwright/test';

/**
 * Clears an input and types a new value.
 * Use this only where chaining .clear().fill() is genuinely clearer at the call site.
 */
export async function clearAndFill(locator: Locator, value: string): Promise<void> {
  await locator.clear();
  await locator.fill(value);
}

/**
 * Selects an option in a <select> element by its visible label.
 */
export async function selectByLabel(locator: Locator, label: string): Promise<void> {
  await locator.selectOption({ label });
}
