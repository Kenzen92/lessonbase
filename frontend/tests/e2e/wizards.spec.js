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
  return { context, page };
}

// Collect only the console messages this redesign is meant to eliminate.
function trackRegressionWarnings(page) {
  const warnings = [];
  page.on("console", (msg) => {
    if (msg.type() !== "warning" && msg.type() !== "error") return;
    const text = msg.text();
    if (/MUI Grid|renderInput|has been removed|MUI X/i.test(text)) {
      warnings.push(text);
    }
  });
  return warnings;
}

const VIEWPORTS = [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1440", width: 1440, height: 900 },
];

// Each wizard: the board to open it from, the action-button label, and the
// WizardShell header it should render.
const WIZARDS = [
  {
    key: "assignment",
    boardPath: "/assignments",
    openLabel: "Create Assignment",
    title: "Create new assignment",
  },
  {
    key: "class-group",
    boardPath: "/class-groups",
    openLabel: "Create class group",
    title: "Create class group",
  },
  {
    key: "class-event",
    boardPath: "/dashboard",
    openLabel: "Schedule a class",
    title: "Schedule a class",
  },
];

test.describe("wizard shell responsiveness", () => {
  for (const wizard of WIZARDS) {
    for (const vp of VIEWPORTS) {
      test(`${wizard.key} wizard is usable at ${vp.name}`, async ({
        browser,
        baseURL,
      }) => {
        const { context, page } = await loginAsTeacher(browser, baseURL);
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const warnings = trackRegressionWarnings(page);

        await page.goto(`${baseURL}${wizard.boardPath}`);
        await page.getByRole("button", { name: wizard.openLabel }).click();

        // Header renders.
        await expect(
          page.getByRole("heading", { name: wizard.title })
        ).toBeVisible();

        // The sticky footer's primary action is reachable without scrolling at
        // every breakpoint (the unreachable-submit regression, B2).
        const next = page.getByRole("button", { name: "Next" });
        await expect(next).toBeVisible();
        await expect(next).toBeInViewport();

        // The wizard itself must not exceed the viewport width at any
        // breakpoint (AC-SP7 / AC-X3) — measured on the shell, not the board
        // behind it.
        const shell = page.getByTestId("wizard-shell");
        const box = await shell.boundingBox();
        expect(box.width).toBeLessThanOrEqual(vp.width + 1);

        // The body is the only scroll region — there is no nested vertical
        // scrollbar inside the wizard footer/header (AC-WS3).
        await expect(next).toBeInViewport();

        // Console free of MUI Grid / MUI X renderInput removed-prop warnings (AC-X2).
        expect(warnings).toEqual([]);

        await context.close();
      });
    }
  }
});

test.describe("wizard create flow", () => {
  test("an assignment can be created with only a title", async ({
    browser,
    baseURL,
  }) => {
    const { context, page } = await loginAsTeacher(browser, baseURL);
    await page.goto(`${baseURL}/assignments`);
    await page.getByRole("button", { name: "Create Assignment" }).click();

    await expect(
      page.getByRole("heading", { name: "Create new assignment" })
    ).toBeVisible();

    const title = `E2E Assignment ${Date.now()}`;
    await page.getByLabel(/Title/).fill(title);

    // Step 1 (details) -> 2 (students) -> 3 (files), then submit.
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Create assignment" }).click();

    // Modal closes and the new card appears on the board without a manual reload.
    await expect(
      page.getByRole("heading", { name: "Create new assignment" })
    ).toBeHidden();
    await expect(page.getByText(title)).toBeVisible({ timeout: 15000 });

    await context.close();
  });
});

test.describe("wizard edit flow", () => {
  test("a class group can be created then edited without error", async ({
    browser,
    baseURL,
  }) => {
    const { context, page } = await loginAsTeacher(browser, baseURL);
    const errors = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });

    await page.goto(`${baseURL}/class-groups`);
    await page.getByRole("button", { name: "Create class group" }).click();

    const name = `E2E Group ${Date.now()}`;
    await page.getByLabel("Class name").fill(name);
    await page.getByRole("button", { name: "Next" }).click(); // -> students
    await page.getByRole("button", { name: "Create group" }).click();

    // New card appears on the board.
    const card = page
      .locator("div")
      .filter({ has: page.getByRole("heading", { name, level: 6 }) })
      .filter({ has: page.getByRole("button", { name: "Details" }) })
      .last();
    await expect(card).toBeVisible({ timeout: 15000 });

    // Open details -> edit -> save. This is the path that used to 500.
    await card.getByRole("button", { name: "Details" }).click();
    await page.getByRole("button", { name: "Edit Class" }).click();
    await expect(
      page.getByRole("heading", { name: "Edit class group" })
    ).toBeVisible();
    await page.getByLabel("Description").fill("Edited by e2e");
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(
      page.getByRole("heading", { name: "Edit class group" })
    ).toBeHidden({ timeout: 15000 });
    // No GenericRelatedObjectManager / server error reached the console.
    expect(errors.join("\n")).not.toMatch(/iterable|500|GenericRelated/i);

    await context.close();
  });

  test("the edit-assignment button opens the wizard prefilled", async ({
    browser,
    baseURL,
  }) => {
    const { context, page } = await loginAsTeacher(browser, baseURL);

    // Seed a known assignment via the wizard.
    await page.goto(`${baseURL}/assignments`);
    await page.getByRole("button", { name: "Create Assignment" }).click();
    const title = `E2E Edit ${Date.now()}`;
    await page.getByLabel(/Title/).fill(title);
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Create assignment" }).click();
    await expect(page.getByText(title)).toBeVisible({ timeout: 15000 });

    // Open its details and edit.
    const card = page
      .locator("div")
      .filter({ has: page.getByRole("heading", { name: title, level: 6 }) })
      .filter({ has: page.getByRole("button", { name: "Details" }) })
      .last();
    await card.getByRole("button", { name: "Details" }).click();
    await page.getByRole("button", { name: "Edit Assignment" }).click();

    await expect(
      page.getByRole("heading", { name: "Edit assignment" })
    ).toBeVisible();
    // Prefilled with the existing title.
    await expect(page.getByLabel(/Title/)).toHaveValue(title);

    await context.close();
  });
});
