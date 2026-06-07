// Shared bits for the Luminous dashboard: icon registry + accent resolver.
import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupIcon from "@mui/icons-material/Group";
import SchoolIcon from "@mui/icons-material/School";
import AssignmentIcon from "@mui/icons-material/Assignment";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import FolderIcon from "@mui/icons-material/Folder";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AddIcon from "@mui/icons-material/Add";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import { lumi, tint } from "./tokens";

// Map the design's Material Symbol names to MUI icon components.
const ICONS = {
  dashboard: DashboardIcon,
  group: GroupIcon,
  school: SchoolIcon,
  assignment: AssignmentIcon,
  folder_open: FolderOpenIcon,
  folder: FolderIcon,
  pending: PendingActionsIcon,
  settings: SettingsIcon,
  logout: LogoutIcon,
  notifications: NotificationsIcon,
  add: AddIcon,
  chevron_right: ChevronRightIcon,
};

export const LumiIcon = ({ name, ...props }) => {
  const Cmp = ICONS[name] || DashboardIcon;
  return <Cmp {...props} />;
};

// Resolve an accent key (used by metrics, chips, statuses) to a solid colour
// plus its translucent surface tint.
export const accentColor = (accent) => {
  switch (accent) {
    case "tertiary":
      return { solid: lumi.color.tertiary, text: lumi.color.tertiary, strong: lumi.color.tertiaryFixed };
    case "amber":
      return { solid: lumi.color.amber, text: lumi.color.amberText, strong: lumi.color.amberText };
    case "violet":
      return { solid: lumi.color.violet, text: lumi.color.violetText, strong: lumi.color.violetText };
    case "error":
      return { solid: lumi.color.error, text: lumi.color.error, strong: lumi.color.onErrorContainer };
    case "primary":
    default:
      return { solid: lumi.color.primary, text: lumi.color.primary, strong: lumi.color.primaryFixed };
  }
};

// Map a server assignment status / category to an accent key.
export const statusAccent = (status = "") => {
  const s = status.toLowerCase();
  if (s.includes("complete") || s.includes("marked")) return "tertiary";
  if (s.includes("mark")) return "amber"; // "To Mark"
  if (s.includes("late") || s.includes("overdue")) return "error";
  return "primary"; // "Set" and anything else
};

// Pill-shaped subject tag: 15% tint of the accent colour with solid text of
// the same hue, per the design system's Chips & Tags spec. A real tag `color`
// (hex) overrides the named accent so live subject tags keep their own hue.
export const SubjectChip = ({ label, accent, color }) => {
  const named = accentColor(accent);
  const solid = color || named.solid;
  const text = color || named.text;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 12px",
        borderRadius: lumi.radius.pill,
        fontSize: 12,
        fontWeight: 600,
        fontFamily: lumi.font.body,
        backgroundColor: tint(solid, 0.15),
        color: text,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
};

export { tint };
