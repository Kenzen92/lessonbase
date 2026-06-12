// Maps live context data (statistics / class events / assignments) into the
// presentational shapes the Luminous dashboard components expect. Kept pure and
// separate from the screen so it's easy to unit-test and reason about.
import { primaryTag, tagList } from "../../../utils/tags";
import { humanFileSize } from "../../../utils/format";
import { statusAccent } from "./shared";

const timeFmt = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const dueFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const midnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Human-friendly divider label for a class date: "Today" / "Tomorrow", the
 * weekday name for anything else inside the next 7 days, and the full date
 * beyond that (where a bare weekday would be ambiguous). Past dates fall through
 * to the full date.
 */
function dividerLabel(start, today) {
  const diffDays = Math.round((midnight(start) - today) / MS_PER_DAY);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays > 1 && diffDays < 7) {
    return start.toLocaleDateString("en-GB", { weekday: "long" });
  }
  return start.toLocaleDateString("en-GB");
}

/**
 * Dashboard metric cards from the statistics payload (missing keys → 0).
 * When the storage envelope ({ used_bytes, limit_bytes }) is available, the
 * Resources card grows a usage detail line, flagged once usage reaches 90%.
 */
export function toMetrics(stats = {}, storage = null) {
  const n = (key) => Number(stats?.[key] ?? 0);

  let storageDetail = {};
  if (storage && typeof storage.used_bytes === "number" && storage.limit_bytes) {
    storageDetail = {
      detail: `${humanFileSize(storage.used_bytes)} of ${humanFileSize(storage.limit_bytes)} used`,
      detailWarning: storage.used_bytes / storage.limit_bytes >= 0.9,
    };
  }

  return [
    { id: "students", label: "Total Students", value: n("total_students"), icon: "group", accent: "primary", path: "/students" },
    {
      id: "classes",
      label: "Active Classes",
      value: Number(stats?.total_classes ?? stats?.total_class_groups ?? 0),
      icon: "school",
      accent: "tertiary",
      path: "/class-groups",
    },
    { id: "pending", label: "Pending Assignments", value: n("pending_assignments"), icon: "pending", accent: "amber", path: "/assignments" },
    {
      id: "resources",
      label: "Resources",
      value: Number(stats?.total_resources ?? stats?.total_documents ?? 0),
      icon: "folder",
      accent: "violet",
      path: "/resources",
      ...storageDetail,
    },
  ];
}

/**
 * Class events → presentational cards. Filtering to the range and ordering are
 * now done server-side, so this just maps the rows and attaches a stable
 * `dateKey` (for grouping) plus a friendly `date` divider label. Events are
 * expected to arrive already scoped and ordered.
 */
export function toUpcomingClasses(events = []) {
  const today = midnight(new Date());

  return (events || []).map((e) => {
    const start = new Date(e.start_time);
    const tag = primaryTag(e);
    return {
      id: e.id,
      dateKey: midnight(start).toISOString(),
      date: dividerLabel(start, today),
      // Raw timestamps + access token so the card can decide whether the class
      // is startable (within the next hour / in progress) and link into the
      // interactive classroom.
      startMs: start.getTime(),
      endMs: start.getTime() + (Number(e.duration) || 0) * 60000,
      accessToken: e.access_token || null,
      subject: tag?.name || e.name || "Class",
      subjectColor: tag?.color || null,
      subjectAccent: "primary",
      // Every tag, in server order, for cards that show the full chip row.
      tags: tagList(e).map((t) => ({ id: t.id ?? t.name, label: t.name, color: t.color || null })),
      title: e.name || "Untitled Class",
      startTime: timeFmt.format(start),
      durationMins: e.duration,
      studentCount: e.students?.length ?? 0,
      assignmentCount: e.resources?.length ?? 0,
      raw: e, // kept so the Details handler can open the drawer with the full event
    };
  });
}

/**
 * The categorised assignments object ({ "Set": [...], "To Mark": [...], ... })
 * flattened into the most recent `limit` rows, newest due-date first. The
 * category key doubles as the status label.
 */
export function toRecentAssignments(assignmentsByCategory = {}, limit = 5) {
  const rows = [];
  Object.entries(assignmentsByCategory || {}).forEach(([category, items]) => {
    (items || []).forEach((a) => {
      const tag = primaryTag(a);
      rows.push({
        id: a.id,
        title: a.title || "Untitled",
        subject: tag?.name || "—",
        subjectColor: tag?.color || null,
        subjectAccent: "primary",
        dueDate: a.due_date ? dueFmt.format(new Date(a.due_date)) : "—",
        dueSort: a.due_date ? new Date(a.due_date).getTime() : 0,
        statusLabel: category,
        statusAccent: statusAccent(category),
      });
    });
  });
  rows.sort((a, b) => b.dueSort - a.dueSort);
  return rows.slice(0, limit);
}

/** Weekly marking progress: marked vs. still-to-mark. */
export function toWeeklyMarking(assignmentsByCategory = {}) {
  const sumWhere = (pred) =>
    Object.entries(assignmentsByCategory || {})
      .filter(([cat]) => pred(cat.toLowerCase()))
      .reduce((sum, [, items]) => sum + (items?.length || 0), 0);

  const toMark = sumWhere((c) => c.includes("to mark"));
  const complete = sumWhere((c) => c.includes("complete") || c.includes("marked"));
  const total = toMark + complete;
  return {
    remaining: toMark,
    progress: total > 0 ? Math.round((complete / total) * 100) : 0,
  };
}
