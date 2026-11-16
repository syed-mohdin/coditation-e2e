# coditation-e2e

Reusable End-to-End UI testing framework for Coditation projects, built with [Playwright](https://playwright.dev) and TypeScript.

## What is this?

A single repository that provides:

- A **generic framework** (`framework/`) shared across all projects — authentication helpers, base page class, reusable fixtures, API utilities.
- **Project-specific code** (`projects/`) for each application — page objects, tests, and test data that may know about HRMS selectors, Collins selectors, etc.

The separation means the generic framework has zero knowledge of any application. Adding a new project never requires touching the framework.

```
coditation-e2e
├── framework/          ← shared, application-agnostic
│   ├── helpers/
│   ├── fixtures/
│   └── pages/
└── projects/
    ├── hrms/           ← HRMS-specific code
    └── <future>/       ← new projects go here
```

---

## Installation

```bash
npm install
npx playwright install chromium   # or --with-deps for the full OS dependencies
```

---

## Environment setup

Copy the example file and fill in real values:

```bash
cp .env.example .env
```

```env
HRMS_BASE_URL=https://hrms.example.com
HRMS_USERNAME=your-username
HRMS_PASSWORD=your-password
```

**Never commit `.env`.** It is in `.gitignore`.

For local development, `.env` is loaded automatically.
On staging or CI, inject variables through the runner (GitHub Actions secrets, etc.).

---

## Running tests

```bash
# All tests
npm test

# HRMS only (Chromium)
npm run test:hrms

# Interactive UI mode
npm run test:ui

# Headed (browser visible)
npm run test:headed

# Step-through debugger
npm run test:debug

# Open HTML report from last run
npm run test:report
```

---

## Selector strategy

Prefer Playwright's semantic locators in this order:

1. `getByRole()` — accessibility role + name
2. `getByLabel()` — form label text
3. `getByText()` / `getByPlaceholder()` — visible text
4. `data-testid` attribute — when semantic locators are not stable

Avoid generated class names (`div.sc-aBcDeF`) and positional selectors (`div:nth-child(4)`).

---

## Authentication and session reuse

HRMS tests that need an authenticated user import `test` from `projects/hrms/fixtures.ts`.
The `authenticatedPage` fixture handles login automatically.

**First run:** logs in with credentials from `.env`, saves the session to `projects/hrms/.auth/session.json`.
**Subsequent runs:** loads the saved session — no login form shown.

```ts
import { test, expect } from '../fixtures';

test('my test', async ({ authenticatedPage }) => {
  // already logged in
});
```

To force a fresh login, delete `projects/hrms/.auth/session.json`.

---

## Debugging

```bash
# Step through with Playwright Inspector
npm run test:debug

# Run headed so you can watch
npm run test:headed

# Open trace viewer for a specific result
npx playwright show-trace test-results/<trace.zip>

# Open HTML report
npm run test:report
```

The HTML report shows which test failed, the error message, a screenshot, and a link to the trace.

---

## CI (GitHub Actions)

The workflow at `.github/workflows/e2e.yml`:

1. Installs Node 22 and npm dependencies.
2. Installs Chromium via `npx playwright install --with-deps chromium`.
3. Runs all tests with 2 retries.
4. Uploads the HTML report and `test-results/` as artifacts on failure.

Add these secrets to your GitHub repository:

| Secret           | Value                        |
| ---------------- | ---------------------------- |
| `HRMS_BASE_URL`  | HRMS application URL         |
| `HRMS_USERNAME`  | Test user login              |
| `HRMS_PASSWORD`  | Test user password           |

---

## Adding a new project

1. **Create the project directory:**
   ```
   projects/<project-name>/
   ├── pages/
   ├── tests/
   ├── test-data/
   ├── .auth/           ← git-ignored, holds session.json
   ├── config.ts
   └── fixtures.ts
   ```

2. **Write `config.ts`** — base URL, credentials from env, auth paths, routes.

3. **Write `fixtures.ts`** — extend `@playwright/test` and implement `authenticatedPage` with the project's login flow.

4. **Add page objects** in `pages/`, extending `BasePage` from `framework/pages/BasePage.ts`.

5. **Write tests** in `tests/*.spec.ts`.

6. **Register with Playwright** in `playwright.config.ts`:
   ```ts
   {
     name: 'collins-chromium',
     testDir: './projects/collins/tests',
     use: { ...devices['Desktop Chrome'], baseURL: process.env.COLLINS_BASE_URL },
   },
   ```

7. **Add an npm script** in `package.json`:
   ```json
   "test:collins": "playwright test --project=collins-chromium"
   ```

8. **Add env vars** to `.env.example` and to GitHub secrets.

---

## Writing a new test

```ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { hrmsConfig } from '../config';

test.describe('Feature Name', () => {
  test('should do something expected', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Act
    await loginPage.login(hrmsConfig.credentials.username, hrmsConfig.credentials.password);

    // Assert
    await expect(page).toHaveURL(/dashboard/);
  });
});
```

---

## Code quality

```bash
npm run typecheck     # TypeScript
npm run lint          # ESLint
npm run format:check  # Prettier
npm run quality       # all three
```
