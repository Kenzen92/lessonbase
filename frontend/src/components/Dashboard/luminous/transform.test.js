import { describe, it, expect } from "vitest";

import { toMetrics } from "./transform";

const MB = 1024 * 1024;

describe("toMetrics — storage detail on the Resources card", () => {
  const stats = { total_students: 3, total_classes: 2, pending_assignments: 1, total_resources: 5 };

  it("omits the detail line when no storage envelope is given", () => {
    const resources = toMetrics(stats).find((m) => m.id === "resources");
    expect(resources.value).toBe(5);
    expect(resources.detail).toBeUndefined();
  });

  it("adds a usage detail line from the storage envelope", () => {
    const resources = toMetrics(stats, { used_bytes: 50 * MB, limit_bytes: 150 * MB }).find(
      (m) => m.id === "resources"
    );
    expect(resources.detail).toBe("50 MB of 150 MB used");
    expect(resources.detailWarning).toBe(false);
  });

  it("flags the detail line from 90% usage", () => {
    const resources = toMetrics(stats, { used_bytes: 140 * MB, limit_bytes: 150 * MB }).find(
      (m) => m.id === "resources"
    );
    expect(resources.detailWarning).toBe(true);
  });

  it("gives every metric a navigation path", () => {
    toMetrics(stats).forEach((m) => expect(m.path).toMatch(/^\//));
  });
});
