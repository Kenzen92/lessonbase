import { describe, it, expect } from "vitest";

import {
  toMetrics,
  toStudentMetrics,
  toUpcomingClasses,
  toRecentAssignments,
  toWeeklyProgress,
  studentStatusLabels,
} from "./transform";

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

describe("toStudentMetrics — student dashboard cards", () => {
  const stats = {
    upcoming_classes: 2,
    total_class_groups: 3,
    pending_assignments: 4,
    total_documents: 5,
  };

  it("maps the student statistics payload onto the four cards", () => {
    const metrics = toStudentMetrics(stats);
    expect(metrics.map((m) => [m.id, m.value])).toEqual([
      ["upcoming", 2],
      ["classes", 3],
      ["pending", 4],
      ["resources", 5],
    ]);
  });

  it("defaults missing keys to 0 and gives every metric a path", () => {
    toStudentMetrics({}).forEach((m) => {
      expect(m.value).toBe(0);
      expect(m.path).toMatch(/^\//);
    });
  });
});

describe("toWeeklyProgress — student rail card", () => {
  it("counts Set as to-do and To Mark/Complete as done", () => {
    const assignments = {
      Set: [{ id: 1 }, { id: 2 }],
      "To Mark": [{ id: 3 }],
      Complete: [{ id: 4 }],
      Upcoming: [{ id: 5 }],
    };
    expect(toWeeklyProgress(assignments)).toEqual({ remaining: 2, progress: 50 });
  });

  it("reports zero progress with no assignments", () => {
    expect(toWeeklyProgress({})).toEqual({ remaining: 0, progress: 0 });
  });
});

describe("toRecentAssignments — student status labels", () => {
  const assignments = {
    "To Mark": [{ id: 1, title: "Essay", due_date: "2026-06-01" }],
    Set: [{ id: 2, title: "Quiz", due_date: "2026-06-02" }],
  };

  it("keeps raw category labels by default (teacher view)", () => {
    const labels = toRecentAssignments(assignments).map((r) => r.statusLabel);
    expect(labels).toContain("To Mark");
    expect(labels).toContain("Set");
  });

  it("re-words categories through the student label map", () => {
    const labels = toRecentAssignments(assignments, 5, studentStatusLabels).map(
      (r) => r.statusLabel
    );
    expect(labels).toContain("Submitted");
    expect(labels).toContain("To Do");
  });
});
