import { Box, Typography, Avatar, Button } from "@mui/material";

import { lumi, lumiType, tint, LumiIcon } from "../luminous";

/**
 * Luminous directory row shared by the Students (teacher view) and Teachers
 * (student view) pages: avatar + name/subtitle on the left, an optional
 * chip column in the middle, then an optional status node and the Chat /
 * Details actions. Row click opens details.
 */
export default function PersonRow({
  avatarUrl,
  name,
  subtitle,
  middle,
  status,
  onChat,
  onDetails,
  chatTestId,
}) {
  return (
    <Box
      onClick={onDetails}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: 2.5,
        py: 2,
        cursor: "pointer",
        borderRadius: lumi.radius.card,
        backgroundColor: lumi.color.surfaceContainer,
        border: `1px solid ${lumi.color.hairline}`,
        transition: "background-color .15s ease, border-color .15s ease",
        "&:hover": { backgroundColor: lumi.color.surfaceContainerHigh, borderColor: tint(lumi.color.primary, 0.4) },
      }}
    >
      {/* Identity */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 2, minWidth: 0 }}>
        <Avatar
          src={avatarUrl || undefined}
          alt={name}
          sx={{ width: 44, height: 44, bgcolor: lumi.color.surfaceVariant, color: lumi.color.onSurface }}
        >
          {name ? name[0].toUpperCase() : "?"}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ ...lumiType.bodyMd, fontWeight: 700, color: lumi.color.onSurface }} noWrap>
            {name}
          </Typography>
          <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.onSurfaceVariant }} noWrap>
            {subtitle}
          </Typography>
        </Box>
      </Box>

      {/* Middle chip column (class groups / subjects) */}
      <Box sx={{ display: { xs: "none", md: "flex" }, gap: 0.75, flexWrap: "wrap", justifyContent: "flex-end", flex: 2 }}>
        {middle}
      </Box>

      {/* Status + actions */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1.5 }}>
        {status}

        <Button
          data-testid={chatTestId}
          startIcon={<LumiIcon name="chat" sx={{ fontSize: 16 }} />}
          onClick={(e) => {
            e.stopPropagation();
            onChat?.();
          }}
          sx={{
            ...lumiType.buttonText,
            px: 1.5,
            height: 36,
            borderRadius: lumi.radius.md,
            backgroundColor: lumi.color.primaryContainer,
            color: lumi.color.onSurface,
            "&:hover": { backgroundColor: lumi.color.primaryContainer, filter: "brightness(0.9)" },
          }}
        >
          Chat
        </Button>

        <Button
          onClick={(e) => {
            e.stopPropagation();
            onDetails?.();
          }}
          endIcon={<LumiIcon name="chevron_right" sx={{ fontSize: 18 }} />}
          sx={{
            ...lumiType.buttonText,
            color: lumi.color.primary,
            minWidth: 0,
            px: 1,
            "&:hover": { backgroundColor: tint(lumi.color.primary, 0.08) },
          }}
        >
          Details
        </Button>
      </Box>
    </Box>
  );
}
