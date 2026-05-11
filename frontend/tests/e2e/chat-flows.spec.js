import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

function readSeedData() {
  const seedPath = process.env.PLAYWRIGHT_CHAT_SEED
    || path.resolve(process.cwd(), ".playwright/chat-seed.json");
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

test.describe("chat websocket flows", () => {
  test("floating direct chat sends and replays history", async ({ browser, baseURL }) => {
    const seed = readSeedData();
    const { context, page } = await authenticatedPage(browser, baseURL, {
      email: seed.teacher.email,
      password: seed.teacher.password,
    });
    const messageText = `Direct chat message ${Date.now()}`;

    await page.goto(`${baseURL}/students/${seed.student.id}`);
    await expect(page.getByTestId("student-drawer-chat-action")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("student-drawer-chat-action")).toHaveText(/Open Chat/, { timeout: 30000 });
    await page.getByTestId("student-drawer-chat-action").click();

    await expect(page.getByTestId("direct-chat-panel")).toBeVisible();
    await expect(page.getByTestId("direct-chat-send")).toBeEnabled({ timeout: 30000 });
    await page.getByTestId("direct-chat-message-input").fill(messageText);
    await page.getByTestId("direct-chat-send").click();

    await expect(
      page.getByTestId("direct-chat-message").filter({ hasText: messageText }).first()
    ).toBeVisible();

    await page.reload();
  await expect(page.getByTestId("student-drawer-chat-action")).toBeVisible({ timeout: 30000 });
  await expect(page.getByTestId("student-drawer-chat-action")).toHaveText(/Open Chat/, { timeout: 30000 });
  await page.getByTestId("student-drawer-chat-action").click();

    await expect(
      page.getByTestId("direct-chat-message").filter({ hasText: messageText }).first()
    ).toBeVisible();

    await context.close();
  });

  test("classroom group chat broadcasts across browsers and replays history", async ({ browser, baseURL }) => {
    const seed = readSeedData();
    const teacherClient = await authenticatedPage(browser, baseURL, {
      email: seed.teacher.email,
      password: seed.teacher.password,
    });
    const studentClient = await authenticatedPage(browser, baseURL, {
      email: seed.student.email,
      password: seed.student.password,
    });
    const messageText = `Classroom chat message ${Date.now()}`;
    const classroomUrl = `${baseURL}/interactive-classroom/${seed.classroom.access_token}`;

    await teacherClient.page.goto(classroomUrl);
    await studentClient.page.goto(classroomUrl);

    await expect(teacherClient.page.getByTestId("classroom-chat-message-input")).toBeVisible();
    await expect(studentClient.page.getByTestId("classroom-chat-message-input")).toBeVisible();
  await expect(teacherClient.page.getByTestId("classroom-chat-send")).toBeEnabled({ timeout: 30000 });
  await expect(studentClient.page.getByTestId("classroom-chat-send")).toBeEnabled({ timeout: 30000 });

    await teacherClient.page.getByTestId("classroom-chat-message-input").fill(messageText);
    await teacherClient.page.getByTestId("classroom-chat-send").click();

    await expect(
      teacherClient.page.getByTestId("classroom-chat-message").filter({ hasText: messageText }).first()
    ).toBeVisible();
    await expect(
      studentClient.page.getByTestId("classroom-chat-message").filter({ hasText: messageText }).first()
    ).toBeVisible();

    await studentClient.page.reload();
    await expect(studentClient.page.getByTestId("classroom-chat-message-input")).toBeVisible();
    await expect(
      studentClient.page.getByTestId("classroom-chat-message").filter({ hasText: messageText }).first()
    ).toBeVisible();

    await teacherClient.context.close();
    await studentClient.context.close();
  });
});