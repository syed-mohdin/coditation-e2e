# Contributing

## Branch naming

```
feat/<short-description>      new feature or test
fix/<short-description>       bug fix
chore/<short-description>     maintenance, dependency updates
```

## Running tests locally

```bash
cp .env.example .env     # fill in real values
npm install
npx playwright install chromium
npm run test:hrms
```

## Code quality before pushing

```bash
npm run quality   # typecheck + lint + format
```

## Adding a new project

See the **Adding a new project** section in [README.md](README.md).

Keep the new project fully self-contained under `projects/<name>/`.
Do not add application-specific logic to `framework/`.

## Writing page objects

- Extend `BasePage` from `framework/pages/BasePage.ts`.
- Represent meaningful user actions, not Playwright API wrappers.
- Keep each page class focused on a single page or component.
- Name methods after what the user does: `login()`, `openEmployee()`, not `clickButton()`.

```ts
export class LoginPage extends BasePage {
  async login(username: string, password: string): Promise<void> {
    await this.page.getByLabel('Username').fill(username);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: /sign in/i }).click();
  }
}
```

## Writing tests

- Follow Arrange → Act → Assert.
- Tests must be independent — no shared state between tests.
- Do not use `page.waitForTimeout()` unless you have a documented reason.
- Use `test.describe()` to group related tests.
- Name tests as `should <expected outcome> when <condition>`.

## Selector conventions

Prefer in this order:

1. `getByRole()`
2. `getByLabel()`
3. `getByText()` / `getByPlaceholder()`
4. `data-testid`

Avoid positional or generated-class selectors.

## PR expectations

- Tests must pass on CI before merging.
- `npm run quality` must pass locally before opening a PR.
- Include a short description of what changed and why.
- Keep PRs focused — one logical change per PR.
