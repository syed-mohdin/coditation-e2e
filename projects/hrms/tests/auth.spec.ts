import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { hrmsConfig } from '../config';

test.describe('HRMS Authentication', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Act
    await loginPage.login(hrmsConfig.credentials.username, hrmsConfig.credentials.password);

    // Assert
    await expect(page).toHaveURL(new RegExp(hrmsConfig.routes.dashboard));
  });

  test('should show an error with invalid credentials', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Act
    await loginPage.login('wrong@example.com', 'wrongpassword');

    // Assert
    await loginPage.expectLoginError();
  });
});
