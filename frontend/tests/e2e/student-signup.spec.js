import { expect, test } from "@playwright/test";

function uniqueEmail(prefix) {
  return `${prefix}.${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
}

async function signupWithEmailPassword(page, baseURL, { userType, email, password, firstName, lastName, signupPath = "/signup" }) {
  await page.goto(`${baseURL}${signupPath}`);
  await expect(page).toHaveURL(new RegExp(`${signupPath.replace("/", "\\/")}$`));

  const userTypeToggle = page.getByRole("button", { name: new RegExp(userType, "i") });
  if (await userTypeToggle.isVisible()) {
    await userTypeToggle.click();
  }
  await page.getByRole("textbox", { name: /First Name/i }).fill(firstName);
  await page.getByRole("textbox", { name: /Last Name/i }).fill(lastName);
  await page.getByRole("textbox", { name: /^Email/i }).fill(email);
  await page.getByLabel(/^Password/i).fill(password);
  await page.getByLabel(/Confirm Password/i).fill(password);

  const registerResponsePromise = page.waitForResponse((response) =>
    response.url().includes("/api/auth/register/") && response.request().method() === "POST"
  );
  await page.getByRole("button", { name: /^Sign Up$/ }).click();

  const registerResponse = await registerResponsePromise;
  expect(registerResponse.ok()).toBeTruthy();
}

async function attemptLogin(page, baseURL, { email, password }) {
  await page.goto(`${baseURL}/login`);
  const signInLauncher = page.getByRole("button", { name: /^Sign In$/ }).first();
  if (await signInLauncher.isVisible()) {
    await signInLauncher.click();
  }
  await page.getByRole("textbox", { name: /^Email/i }).fill(email);
  await page.getByLabel(/^Password/i).fill(password);
  await page.locator("form").getByRole("button", { name: /^Sign In$/ }).click();
}

test.describe("student signup flow", () => {
  test("registers a student and blocks login until email verification", async ({ page, baseURL }) => {
    const credentials = {
      email: uniqueEmail("student"),
      password: "L3ssonBase!Student#2026",
      firstName: "Sam",
      lastName: "Student",
    };

    await page.route("**/api/auth/register/", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Registration successful. Please check your email to verify your account.",
          email: credentials.email,
          user_type: "student",
        }),
      });
    });

    await page.route("**/api/auth/login/", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          non_field_errors: ["Please verify your email before logging in."],
        }),
      });
    });

    await signupWithEmailPassword(page, baseURL, {
      userType: "student",
      signupPath: "/signup/student",
      ...credentials,
    });

    await page.waitForURL(/\/login/);

    await attemptLogin(page, baseURL, credentials);
    await expect(page.getByText(/verify your email before logging in/i)).toBeVisible();
  });
});
