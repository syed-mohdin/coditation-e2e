import { expect } from '@playwright/test';
import { test } from '../fixtures';
import { MyTeamPage } from '../pages/MyTeamPage';

test.describe('HRMS My Team', () => {
  test('should display the My Team page after login', async ({ authenticatedPage }) => {
    // Arrange
    const myTeamPage = new MyTeamPage(authenticatedPage);

    // Act
    await myTeamPage.goto();

    // Assert
    await myTeamPage.expectPageVisible();
  });

  test('should list employees on the My Team page', async ({ authenticatedPage }) => {
    // Arrange
    const myTeamPage = new MyTeamPage(authenticatedPage);
    await myTeamPage.goto();

    // Act
    const names = await myTeamPage.getEmployeeNames();

    // Assert — the page should not be empty
    expect(names.length).toBeGreaterThan(0);
  });
});
