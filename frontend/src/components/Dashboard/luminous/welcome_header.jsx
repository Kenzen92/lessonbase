import { Box, Typography, IconButton, Avatar } from "@mui/material";
import { motion } from "framer-motion";

import { lumi, lumiType } from "./tokens";
import { LumiIcon } from "./shared";

/**
 * The hero "Welcome back" banner. `brandName` is highlighted in primary; the
 * greeting falls back to the platform name when no user name is supplied.
 */
export default function WelcomeHeader({ brandName = "Lessonbase", avatarUrl, userName, onProfile }) {
  return (
    <Box
      component={motion.header}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      sx={{
        position: "relative",
        mb: 4,
        borderRadius: lumi.radius.card,
        overflow: "hidden",
        minHeight: 200,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        p: { xs: 4, md: 5 },
        background: "linear-gradient(to bottom right, #0b1326, #1a243a)",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { md: "center" },
          justifyContent: "space-between",
          gap: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 4 }}>
          {/* Brand mark */}
          <Box
            sx={{
              width: { xs: 64, md: 80 },
              height: { xs: 64, md: 80 },
              flexShrink: 0,
              borderRadius: lumi.radius.lg,
              backgroundColor: "rgba(23,31,51,0.5)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: lumi.font.headline,
              fontWeight: 700,
              fontSize: 36,
              color: lumi.color.primary,
              boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            }}
          >
            L
          </Box>

          <Box>
            <Typography component="h1" sx={{ ...lumiType.headlineLg, color: lumi.color.onBackground }}>
              Welcome back to{" "}
              <Box component="span" sx={{ color: lumi.color.primary }}>
                {brandName}
              </Box>
            </Typography>
            <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.onSurfaceVariant, mt: 1 }}>
              Here&apos;s what&apos;s happening in your classes today.
            </Typography>
          </Box>
        </Box>

        {/* Notifications + profile */}
        <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 2 }}>
          <IconButton
            aria-label="Notifications"
            sx={{
              width: 40,
              height: 40,
              borderRadius: lumi.radius.md,
              border: "1px solid rgba(137,145,157,0.3)",
              backgroundColor: "rgba(6,14,32,0.5)",
              color: lumi.color.onSurfaceVariant,
              "&:hover": { color: lumi.color.primary, borderColor: lumi.color.primary },
            }}
          >
            <LumiIcon name="notifications" sx={{ fontSize: 22 }} />
          </IconButton>
          <IconButton aria-label="Open profile" onClick={onProfile} disabled={!onProfile} sx={{ p: 0 }}>
            <Avatar
              src={avatarUrl || undefined}
              alt={userName || "Profile"}
              sx={{ width: 40, height: 40, border: `2px solid rgba(156,202,255,0.3)` }}
            >
              {userName ? userName[0].toUpperCase() : null}
            </Avatar>
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
