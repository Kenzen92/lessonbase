import { test, expect } from "@playwright/test";

/**
 * E2E: persistent login across a browser close/reopen.
 *
 * Every backend call is mocked at the network layer (page.route), so these
 * tests assert the frontend's persistence behaviour deterministically and do
 * not depend on the live backend the other specs seed.
 *
 * How "closing and reopening the browser" is simulated:
 *   Playwright's `context.storageState()` captures cookies + localStorage but
 *   NOT sessionStorage (sessionStorage is, by definition, scoped to a browsing
 *   session). Opening a brand new browser context seeded with that saved state
 *   therefore faithfully reproduces what a user sees after fully quitting and
 *   relaunching their browser: localStorage survives, sessionStorage does not.
 */

const TOKEN = "test-token-abc123";
const USER = {
  id: 1,
  email: "teacher@example.com",
  first_name: "Tina",
  last_name: "Teacher",
  user_type: "teacher",
};

/** Register API mocks on a context so the app can log in and load without a backend. */
async function mockBackend(context) {
  // NOTE: Playwright tries the most-recently-registered matching route first,
  // so the broad catch-all is registered before the specific routes below it.

  // Catch-all for any other backend call the dashboard makes, so nothing hangs.
  // Under the Playwright config the app talks to the API at the "/api" prefix
  // (proxied to the backend), so we intercept everything under it.
  await context.route("**/api/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    })
  );

  await context.route("**/auth/login/", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ token: TOKEN, user_type: USER.user_type, user: USER }),
    })
  );

  // Used by auth_context on startup to validate a persisted token.
  await context.route("**/auth/user/", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(USER),
    })
  );
}

/** Drive the login form with the given "remember me" choice. */
async function logIn(page, { remember }) {
  await page.goto("/login");
  // Use an anchored name so we don't also match the Google "Sign in with
  // Google" button once the form is revealed (strict-mode violation in CI).
  await page.getByRole("button", { name: /^Sign In$/ }).click();

  await page.getByLabel("Email").fill(USER.email);
  await page.getByLabel("Password").fill("hunter2");

  const checkbox = page.getByRole("checkbox", { name: "Remember me" });
  if (remember) {
    await expect(checkbox).toBeChecked(); // persistent login is the default
  } else {
    await checkbox.uncheck();
  }

  // Scope the submit to the form so it can't resolve to the Google button.
  await page.locator("form").getByRole("button", { name: /^Sign In$/ }).click();
  await page.waitForURL("**/dashboard");
}

test.describe("persistent login", () => {
  test("stays logged in after the browser is closed and reopened", async ({ browser }) => {
    const context = await browser.newContext();
    await mockBackend(context);
    const page = await context.newPage();

    await logIn(page, { remember: true });

    // The token must live in localStorage (survives restart), not sessionStorage.
    const stored = await page.evaluate(() => ({
      local: window.localStorage.getItem("token"),
      session: window.sessionStorage.getItem("token"),
    }));
    expect(stored.local).toBe(TOKEN);
    expect(stored.session).toBeNull();

    // Capture persisted state (cookies + localStorage), then close the "browser".
    const storageState = await context.storageState();
    await context.close();

    // Reopen a fresh browser context seeded only with persisted state.
    const reopened = await browser.newContext({ storageState });
    await mockBackend(reopened);
    const newPage = await reopened.newPage();

    await newPage.goto("/dashboard");

    // Still authenticated: not bounced to /login, token still present.
    await expect(newPage).toHaveURL(/\/dashboard/);
    const persistedToken = await newPage.evaluate(() =>
      window.localStorage.getItem("token")
    );
    expect(persistedToken).toBe(TOKEN);

    await reopened.close();
  });

  test("does NOT persist when 'Remember me' is unchecked", async ({ browser }) => {
    const context = await browser.newContext();
    await mockBackend(context);
    const page = await context.newPage();

    await logIn(page, { remember: false });

    // Token should be session-scoped only.
    const stored = await page.evaluate(() => ({
      local: window.localStorage.getItem("token"),
      session: window.sessionStorage.getItem("token"),
    }));
    expect(stored.session).toBe(TOKEN);
    expect(stored.local).toBeNull();

    // sessionStorage is not part of storageState, so the reopened browser is logged out.
    const storageState = await context.storageState();
    await context.close();

    const reopened = await browser.newContext({ storageState });
    await mockBackend(reopened);
    const newPage = await reopened.newPage();

    await newPage.goto("/dashboard");

    // Unauthenticated: redirected back to /login.
    await expect(newPage).toHaveURL(/\/login/);

    await reopened.close();
  });
});
