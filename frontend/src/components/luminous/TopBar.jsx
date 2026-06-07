import { Box, Typography, IconButton, Avatar } from "@mui/material";

import { lumi, lumiType } from "./tokens";
import { LumiIcon } from "./shared";
import SearchInput from "./SearchInput";

/**
 * The canonical Luminous top bar: search + notifications + profile. Rendered
 * on desktop only — `SideNav` already provides the mobile top bar, so this is
 * hidden < md to avoid duplication.
 *
 * Per the rollout spec this normalises the inconsistent per-screenshot chrome
 * (no date pill, no help icon): it is always search + notifications + profile.
 */
export default function TopBar({
  searchPlaceholder = "Search…",
  searchValue = "",
  onSearchChange,
  onSearchSubmit,
  user = {},
}) {
  const { userName, avatarUrl, role } = user;
  return (
    <Box
      component="header"
      sx={{
        display: { xs: "none", md: "flex" },
        alignItems: "center",
        gap: 3,
        mb: 4,
      }}
    >
      <Box sx={{ flex: 1, maxWidth: 520 }}>
        <SearchInput
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={onSearchChange}
          onSubmit={onSearchSubmit}
        />
      </Box>

      <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 2 }}>
        <IconButton
          aria-label="Notifications"
          sx={{
            width: 40,
            height: 40,
            borderRadius: lumi.radius.md,
            color: lumi.color.onSurfaceVariant,
            "&:hover": { color: lumi.color.primary },
          }}
        >
          <LumiIcon name="notifications" sx={{ fontSize: 22 }} />
        </IconButton>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {userName && (
            <Box sx={{ textAlign: "right", display: { xs: "none", lg: "block" } }}>
              <Typography sx={{ ...lumiType.bodyMd, fontWeight: 700, color: lumi.color.onSurface, lineHeight: 1.2 }}>
                {userName}
              </Typography>
              {role && (
                <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant }}>
                  {role}
                </Typography>
              )}
            </Box>
          )}
          <Avatar
            src={avatarUrl || undefined}
            alt={userName || "Profile"}
            sx={{ width: 40, height: 40, border: `2px solid rgba(156,202,255,0.3)` }}
          >
            {userName ? userName[0].toUpperCase() : null}
          </Avatar>
        </Box>
      </Box>
    </Box>
  );
}
