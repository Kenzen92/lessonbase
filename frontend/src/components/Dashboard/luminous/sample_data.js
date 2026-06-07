// Sample data matching the Stitch reference screens. The dashboard is fully
// prop-driven — these defaults let it render standalone and document the shape
// a real data source (context / react-query) should provide.

export const sampleUser = {
  name: "Lessonbase",
  greetingName: null, // e.g. "Alex" — falls back to the platform name
  avatarUrl: null,
};

export const sampleMetrics = [
  { id: "students", label: "Total Students", value: 20, icon: "group", accent: "primary" },
  { id: "classes", label: "Active Classes", value: 12, icon: "school", accent: "tertiary" },
  { id: "pending", label: "Pending Assignments", value: 6, icon: "pending", accent: "amber" },
  { id: "resources", label: "Resources", value: 45, icon: "folder", accent: "violet" },
];

export const sampleUpcomingClasses = [
  {
    id: 1,
    date: "07/06/2026",
    subject: "Geography",
    subjectAccent: "amber",
    title: "Class Event Geography 1",
    startTime: "14:00",
    durationMins: 45,
    studentCount: 6,
    assignmentCount: 0,
  },
  {
    id: 2,
    date: "08/06/2026",
    subject: "Physics",
    subjectAccent: "tertiary",
    title: "Class Event Physics 2",
    startTime: "12:00",
    durationMins: 60,
    studentCount: 4,
    assignmentCount: 0,
  },
];

export const sampleRecentAssignments = [
  {
    id: 1,
    title: "Quantum Mechanics Essay",
    subject: "Physics",
    subjectAccent: "violet",
    dueDate: "Oct 24, 2023",
    statusLabel: "To Mark",
    statusAccent: "amber",
  },
  {
    id: 2,
    title: "Calculus Midterm Prep",
    subject: "Mathematics",
    subjectAccent: "primary",
    dueDate: "Oct 26, 2023",
    statusLabel: "Set",
    statusAccent: "primary",
  },
  {
    id: 3,
    title: "Modern Art History Review",
    subject: "Art",
    subjectAccent: "tertiary",
    dueDate: "Oct 20, 2023",
    statusLabel: "Complete",
    statusAccent: "tertiary",
  },
];

export const sampleWeeklyMarking = {
  progress: 75,
  remaining: 6,
};

export const navItems = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", path: "/dashboard" },
  { id: "students", label: "Students", icon: "group", path: "/students" },
  { id: "classes", label: "Classes", icon: "school", path: "/class-groups" },
  { id: "assignments", label: "Assignments", icon: "assignment", path: "/assignments" },
  { id: "resources", label: "Resources", icon: "folder_open", path: "/resources" },
];
