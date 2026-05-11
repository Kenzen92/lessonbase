import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const frontendDir = path.resolve(process.cwd());
const outputDir = path.join(frontendDir, ".playwright");
const seedFilePath = path.join(outputDir, "chat-seed.json");
const dockerDir = path.resolve(frontendDir, "../deploy/docker");
const backendBaseUrl = process.env.E2E_API_BASE_URL || "http://127.0.0.1:8010";

async function waitForBackend() {
  const deadline = Date.now() + 60_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${backendBaseUrl}/health/`);
      if (response.ok) {
        return;
      }
    } catch {
      // Keep retrying until timeout.
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Backend did not become healthy at ${backendBaseUrl} within 60 seconds.`);
}

export default async function globalSetup() {
  await waitForBackend();

  const stdout = execFileSync(
    "docker",
    [
      "compose",
      "-f",
      "docker-compose.test.yml",
      "exec",
      "-T",
      "backend",
      "bash",
      "-lc",
      "cd /app/lessonbase && /app/.venv/bin/python manage.py seed_chat_e2e",
    ],
    {
      cwd: dockerDir,
      encoding: "utf8",
    }
  ).trim();

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(seedFilePath, stdout);
  process.env.PLAYWRIGHT_CHAT_SEED = seedFilePath;
}