import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

function readSeedData() {
  const seedPath =
    process.env.PLAYWRIGHT_CHAT_SEED ||
    path.resolve(process.cwd(), ".playwright/chat-seed.json");
  return JSON.parse(fs.readFileSync(seedPath, "utf8"));
}

async function authenticatedPage(browser, baseURL, credentials) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${baseURL}/login`);
  await page.getByRole("button", { name: /^Sign In$/ }).click();
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);
  await page.locator("form").getByRole("button", { name: /^Sign In$/ }).click();
  await page.waitForURL(/\/dashboard/);
  return { context, page };
}

test.describe("session feedback flow", () => {
  test("student sees feedback modal when exiting classroom", async ({
    browser,
    baseURL,
  }) => {
    const seed = readSeedData();
    const { context, page } = await authenticatedPage(browser, baseURL, {
      email: seed.student.email,
      password: seed.student.password,
    });

    await page.goto(
      `${baseURL}/interactive-classroom/${seed.classroom.access_token}`
    );

    await expect(page.getByTestId("exit-classroom-btn")).toBeVisible({
      timeout: 30000,
    });
    await page.getByTestId("exit-classroom-btn").click();

    await expect(page.getByTestId("session-feedback-modal")).toBeVisible();
    await expect(page.getByTestId("session-feedback-rating")).toBeVisible();
    await expect(page.getByTestId("session-feedback-comment")).toBeVisible();
    await expect(page.getByTestId("session-feedback-submit")).toBeVisible();
    await expect(page.getByTestId("session-feedback-skip")).toBeVisible();

    await context.close();
  });

  test("student can submit feedback and is redirected to dashboard", async ({
    browser,
    baseURL,
  }) => {
    const seed = readSeedData();
    const { context, page } = await authenticatedPage(browser, baseURL, {
      email: seed.student.email,
      password: seed.student.password,
    });

    await page.goto(
      `${baseURL}/interactive-classroom/${seed.classroom.access_token}`
    );
    await expect(page.getByTestId("exit-classroom-btn")).toBeVisible({
      timeout: 30000,
    });
    await page.getByTestId("exit-classroom-btn").click();

    await expect(page.getByTestId("session-feedback-modal")).toBeVisible();

    // Select 4 stars — MUI Rating renders radio inputs; target the 4th star
    await page
      .getByTestId("session-feedback-rating")
      .locator('input[value="4"]')
      .check({ force: true });

    await page
      .getByTestId("session-feedback-comment")
      .fill("Really enjoyed this class!");

    await page.getByTestId("session-feedback-submit").click();

    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    await context.close();
  });

  test("student can skip the feedback form", async ({ browser, baseURL }) => {
    const seed = readSeedData();
    const { context, page } = await authenticatedPage(browser, baseURL, {
      email: seed.student.email,
      password: seed.student.password,
    });

    await page.goto(
      `${baseURL}/interactive-classroom/${seed.classroom.access_token}`
    );
    await expect(page.getByTestId("exit-classroom-btn")).toBeVisible({
      timeout: 30000,
    });
    await page.getByTestId("exit-classroom-btn").click();

    await expect(page.getByTestId("session-feedback-modal")).toBeVisible();
    await page.getByTestId("session-feedback-skip").click();

    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    await context.close();
  });

  test("teacher exits classroom without seeing the feedback modal", async ({
    browser,
    baseURL,
  }) => {
    const seed = readSeedData();
    const { context, page } = await authenticatedPage(browser, baseURL, {
      email: seed.teacher.email,
      password: seed.teacher.password,
    });

    await page.goto(
      `${baseURL}/interactive-classroom/${seed.classroom.access_token}`
    );
    await expect(page.getByTestId("exit-classroom-btn")).toBeVisible({
      timeout: 30000,
    });
    await page.getByTestId("exit-classroom-btn").click();

    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await expect(
      page.getByTestId("session-feedback-modal")
    ).not.toBeVisible();

    await context.close();
  });

  test("teacher dashboard shows session feedback section for past classes", async ({
    browser,
    baseURL,
  }) => {
    const seed = readSeedData();
    const { context, page } = await authenticatedPage(browser, baseURL, {
      email: seed.teacher.email,
      password: seed.teacher.password,
    });

    // Open the past classroom's detail drawer directly via URL
    await page.goto(`${baseURL}/dashboard/${seed.classroom.class_event_id}`);

    // Wait for the drawer to open
    await expect(
      page.getByText("Session Feedback", { exact: true })
    ).toBeVisible({ timeout: 15000 });

    await context.close();
  });
});
