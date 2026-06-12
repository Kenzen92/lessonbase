import { describe, it, expect } from "vitest";

import { toMetrics, toUpcomingClasses } from "./transform";

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

describe("toUpcomingClasses — tag chips", () => {
  const event = (overrides = {}) => ({
    id: 1,
    name: "Algebra Basics",
    start_time: "2026-06-10T14:00:00Z",
    duration: 45,
    students: [],
    resources: [],
    ...overrides,
  });

  it("maps every tag onto the card, in order, with id/label/color", () => {
    const tags = [
      { id: 7, name: "Maths", kind: "subject", color: "#ff0000" },
      { id: 8, name: "Exam Prep", kind: "topic", color: "#00ff00" },
      { id: 9, name: "Year 10", kind: "topic", color: null },
    ];
    const [card] = toUpcomingClasses([event({ tags })]);
    expect(card.tags).toEqual([
      { id: 7, label: "Maths", color: "#ff0000" },
      { id: 8, label: "Exam Prep", color: "#00ff00" },
      { id: 9, label: "Year 10", color: null },
    ]);
  });

  it("returns an empty tag list (with the event name as subject) when untagged", () => {
    const [card] = toUpcomingClasses([event()]);
    expect(card.tags).toEqual([]);
    expect(card.subject).toBe("Algebra Basics");
  });
});

describe("toUpcomingClasses — start affordance fields", () => {
  const event = (overrides = {}) => ({
    id: 1,
    name: "Algebra Basics",
    start_time: "2026-06-10T14:00:00Z",
    duration: 45,
    students: [],
    resources: [],
    ...overrides,
  });

  it("exposes start/end timestamps and the access token", () => {
    const [card] = toUpcomingClasses([event({ access_token: "tok-123" })]);
    const startMs = new Date("2026-06-10T14:00:00Z").getTime();
    expect(card.startMs).toBe(startMs);
    expect(card.endMs).toBe(startMs + 45 * 60000);
    expect(card.accessToken).toBe("tok-123");
  });

  it("defaults the access token to null and tolerates a missing duration", () => {
    const [card] = toUpcomingClasses([event({ duration: undefined })]);
    expect(card.accessToken).toBeNull();
    expect(card.endMs).toBe(card.startMs);
  });
});
