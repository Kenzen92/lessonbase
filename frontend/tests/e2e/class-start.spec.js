import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

function readSeedData() {
  const seedPath =
    process.env.PLAYWRIGHT_CHAT_SEED ||
    path.resolve(process.cwd(), ".playwright/chat-seed.json");
  return JSON.parse(fs.readFileSync(seedPath, "utf8"));
}

async function loginAsTeacher(browser, baseURL) {
  const seed = readSeedData();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${baseURL}/login`);
  await page.getByRole("button", { name: /^Sign In$/ }).click();
  await page.getByLabel("Email").fill(seed.teacher.email);
  await page.getByLabel("Password").fill(seed.teacher.password);
  await page.locator("form").getByRole("button", { name: /^Sign In$/ }).click();
  await page.waitForURL(/\/dashboard/);
  return { context, page, seed };
}

// The dashboard class card for a seeded event, located by its title.
function classCard(page, name) {
  return page.locator("article").filter({ hasText: name });
}

test.describe("starting a class from the dashboard", () => {
  test("a class starting within the next hour can be started", async ({
    browser,
    baseURL,
  }) => {
    const { context, page, seed } = await loginAsTeacher(browser, baseURL);

    const card = classCard(page, seed.imminent_classroom.name);
    await expect(card).toBeVisible({ timeout: 15000 });

    const start = card.getByRole("button", { name: "Start" });
    await expect(start).toBeVisible();
    await expect(start).toBeEnabled();

    await start.click();
    await page.waitForURL(
      new RegExp(`/interactive-classroom/${seed.imminent_classroom.access_token}$`)
    );

    await context.close();
  });

  test("a class more than an hour away is not startable", async ({
    browser,
    baseURL,
  }) => {
    const { context, page, seed } = await loginAsTeacher(browser, baseURL);

    const card = classCard(page, seed.distant_classroom.name);
    await expect(card).toBeVisible({ timeout: 15000 });

    // The Start affordance is present but disabled outside the 60-minute window.
    const start = card.getByRole("button", { name: "Start" });
    await expect(start).toBeVisible();
    await expect(start).toBeDisabled();

    // Clicking must not navigate into the classroom.
    await start.click({ force: true });
    await expect(page).toHaveURL(/\/dashboard/);

    await context.close();
  });
});
