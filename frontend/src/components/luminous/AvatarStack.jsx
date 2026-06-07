import { Box, Avatar, Tooltip } from "@mui/material";

import { lumi, lumiType } from "./tokens";
import { resolveMediaUrl } from "../../utils/media";

const initials = (p) =>
  `${p.first_name?.[0] || ""}${p.last_name?.[0] || ""}`.toUpperCase() || "?";

/**
 * Overlapping stack of member avatars with a "+N" overflow bubble, per the
 * Classes card design. `people` is an array of { id, first_name, last_name,
 * profile_picture }; `max` caps how many avatars show before the overflow.
 */
export default function AvatarStack({ people = [], max = 4, size = 32 }) {
  const shown = people.slice(0, max);
  const overflow = people.length - shown.length;

  const ring = {
    width: size,
    height: size,
    fontSize: size * 0.4,
    border: `2px solid ${lumi.color.surfaceContainer}`,
    marginLeft: "-8px",
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", pl: "8px" }}>
      {shown.map((p) => (
        <Tooltip key={p.id} title={`${p.first_name || ""} ${p.last_name || ""}`.trim()}>
          <Avatar
            src={resolveMediaUrl(p.profile_picture) || undefined}
            alt={p.first_name}
            sx={{ ...ring, bgcolor: lumi.color.surfaceVariant, color: lumi.color.onSurface }}
          >
            {initials(p)}
          </Avatar>
        </Tooltip>
      ))}
      {overflow > 0 && (
        <Box
          sx={{
            ...ring,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: lumi.color.surfaceContainerHigh,
            color: lumi.color.onSurfaceVariant,
            ...lumiType.labelMd,
          }}
        >
          +{overflow}
        </Box>
      )}
    </Box>
  );
}
