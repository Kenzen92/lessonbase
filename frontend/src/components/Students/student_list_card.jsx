import { Avatar, Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { resolveMediaUrl } from "../../utils/media";
import { LumiIcon, lumi, lumiType } from "../luminous";

/**
 * Compact person row used inside detail drawers: avatar + name, the whole
 * row navigating to the student's detail page (or `onClick` when given).
 * Pass `onClick={null}` for a read-only row (no navigation, no chevron) —
 * e.g. a student viewing their classmates. `subtitle` adds a muted second
 * line; `trailing` replaces the default chevron with custom content.
 */
const StudentListCard = ({ student, subtitle, onClick, trailing }) => {
  const navigate = useNavigate();
  const interactive = onClick !== null;
  const handleClick = onClick || (() => navigate(`/students/${student.id}`));

  return (
    <Box
      {...(interactive
        ? {
            role: "button",
            tabIndex: 0,
            onClick: handleClick,
            onKeyDown: (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick();
              }
            },
          }
        : {})}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        p: 1,
        borderRadius: lumi.radius.md,
        ...(interactive
          ? { cursor: "pointer", "&:hover": { backgroundColor: lumi.color.surfaceContainerHigh } }
          : {}),
      }}
    >
      <Avatar
        alt={student.first_name}
        src={resolveMediaUrl(student.profile_picture) || undefined}
        sx={{ width: 36, height: 36, bgcolor: lumi.color.surfaceVariant, color: lumi.color.onSurface }}
      >
        {student.first_name ? student.first_name[0].toUpperCase() : "?"}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography noWrap sx={{ ...lumiType.bodyMd, fontWeight: 600, color: lumi.color.onSurface }}>
          {student.first_name} {student.last_name}
        </Typography>
        {subtitle && (
          <Typography noWrap sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {trailing ??
        (interactive ? (
          <LumiIcon name="chevron_right" sx={{ fontSize: 18, color: lumi.color.onSurfaceVariant }} />
        ) : null)}
    </Box>
  );
};

export default StudentListCard;
