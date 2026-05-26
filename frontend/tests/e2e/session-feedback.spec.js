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

    // Select 4 stars — MUI Rating hides the radio inputs; force-click the hidden input directly
    await page
      .getByTestId("session-feedback-rating")
      .locator('input[value="4"]')
      .click({ force: true });

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

  // Smoke test for the aggregate endpoint instead of driving the dashboard UI:
  // the drawer auto-open flow has too many async dependencies (auth context load,
  // class-events query, useEffect ordering, MUI drawer animation) to be a reliable
  // regression signal. What we actually want to catch is "did the API contract
  // break for teachers fetching feedback for a past class" — so hit it directly.
  test("teacher can fetch session feedback aggregate via API", async ({
    browser,
    baseURL,
  }) => {
    const seed = readSeedData();
    const { context, page } = await authenticatedPage(browser, baseURL, {
      email: seed.teacher.email,
      password: seed.teacher.password,
    });

    const result = await page.evaluate(async (classId) => {
      const token = window.sessionStorage.getItem("token");
      const res = await fetch(`/api/session-feedback/${classId}/aggregate/`, {
        headers: { Authorization: `Token ${token}` },
      });
      return { status: res.status, body: await res.json() };
    }, seed.past_classroom.id);

    expect(result.status).toBe(200);
    expect(result.body).toHaveProperty("total_responses");
    expect(result.body).toHaveProperty("average_rating");
    expect(result.body).toHaveProperty("rating_distribution");
    expect(result.body).toHaveProperty("comments");

    await context.close();
  });
});
