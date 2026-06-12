// Canonical primary navigation for the Luminous shell. Used by `SideNav` and
// any page that needs to reason about the active nav item. Paths match the
// routes registered in `App.jsx`.
export const navItems = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", path: "/dashboard" },
  { id: "students", label: "Students", icon: "group", path: "/students" },
  { id: "classes", label: "Classes", icon: "school", path: "/class-groups" },
  { id: "assignments", label: "Assignments", icon: "assignment", path: "/assignments" },
  { id: "resources", label: "Resources", icon: "folder_open", path: "/resources" },
];

// Resolve the active nav id from a router pathname. Centralised so every page
// (and the shell) agree on which item lights up.
export const activeNavFromPath = (pathname = "") => {
  if (pathname.startsWith("/students")) return "students";
  if (pathname.startsWith("/class-groups")) return "classes";
  if (pathname.startsWith("/assignments")) return "assignments";
  if (pathname.startsWith("/resources")) return "resources";
  if (pathname.startsWith("/settings")) return "settings";
  // Profile is reached via the avatar, not the sidebar — nothing lights up.
  if (pathname.startsWith("/profile")) return "profile";
  return "dashboard";
};
