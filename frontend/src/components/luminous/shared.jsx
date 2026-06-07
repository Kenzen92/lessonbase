// Shared bits for the Luminous design system: icon registry + accent resolver +
// the SubjectChip pill. App-wide — every Luminous page reads from here.
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
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DownloadIcon from "@mui/icons-material/Download";
import GridViewIcon from "@mui/icons-material/GridView";
import ViewListIcon from "@mui/icons-material/ViewList";
import FilterListIcon from "@mui/icons-material/FilterList";
import PersonIcon from "@mui/icons-material/Person";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import InboxIcon from "@mui/icons-material/Inbox";
import EventIcon from "@mui/icons-material/Event";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import LinkIcon from "@mui/icons-material/Link";
import RestoreIcon from "@mui/icons-material/Restore";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

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
  search: SearchIcon,
  expand_more: ExpandMoreIcon,
  more_vert: MoreVertIcon,
  edit: EditIcon,
  delete: DeleteOutlineIcon,
  download: DownloadIcon,
  grid_view: GridViewIcon,
  list_view: ViewListIcon,
  filter: FilterListIcon,
  person: PersonIcon,
  chat: ChatBubbleOutlineIcon,
  inbox: InboxIcon,
  event: EventIcon,
  file: InsertDriveFileIcon,
  link: LinkIcon,
  restore: RestoreIcon,
  close: CloseIcon,
  arrow_back: ArrowBackIcon,
  check_circle: CheckCircleOutlineIcon,
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

// ── Contrast helpers ────────────────────────────────────────────────────────
const hexToRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = (v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0");
const rgbToHex = ([r, g, b]) => `#${toHex(r)}${toHex(g)}${toHex(b)}`;
const channelLum = (c) => {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
const relLuminance = ([r, g, b]) =>
  0.2126 * channelLum(r) + 0.7152 * channelLum(g) + 0.0722 * channelLum(b);
const mixWhite = ([r, g, b], t) => [r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t];

// Lift a hue toward white until it reads on the dark Luminous surface, keeping
// its identity. Already-light colours (and named accents) pass through.
export const brightenForDark = (hex, target = 0.5) => {
  if (typeof hex !== "string" || !/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  const rgb = hexToRgb(hex);
  if (relLuminance(rgb) >= target) return hex;
  for (let t = 0.1; t <= 1; t += 0.1) {
    const mixed = mixWhite(rgb, t);
    if (relLuminance(mixed) >= target) return rgbToHex(mixed);
  }
  return rgbToHex(mixWhite(rgb, 1));
};

// Pill-shaped subject tag: a tint of the accent colour with high-contrast text
// of the same hue. A real tag `color` (hex) overrides the named accent so live
// subject tags keep their own hue, brightened just enough to stay legible on
// the dark surface.
export const SubjectChip = ({ label, accent, color }) => {
  const named = accentColor(accent);
  const base = color || named.solid;
  const text = brightenForDark(color || named.text);
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
        backgroundColor: tint(base, 0.22),
        color: text,
        border: `1px solid ${tint(text, 0.35)}`,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
};

export { tint };
