import { Box, Typography, Button, IconButton, Avatar } from "@mui/material";

import { lumi, lumiType, tint } from "./tokens";
import { LumiIcon } from "./shared";
import { navItemsFor } from "./nav";
import useRole from "../../hooks/useRole";

const SIDEBAR_WIDTH = 256;

// A single sidebar nav link. `active` drives the M3 secondary-container pill.
function NavLink({ item, active, onClick }) {
  return (
    <Box
      component="a"
      href={item.path}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick(item);
        }
      }}
      aria-current={active ? "page" : undefined}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 1.5,
        py: 1.25,
        borderRadius: lumi.radius.md,
        textDecoration: "none",
        ...lumiType.labelMd,
        color: active ? lumi.color.onSecondaryContainer : lumi.color.onSurfaceVariant,
        backgroundColor: active ? lumi.color.secondaryContainer : "transparent",
        transition: "background-color .15s ease, color .15s ease",
        "&:hover": {
          backgroundColor: active ? lumi.color.secondaryContainer : lumi.color.surfaceVariant,
          color: lumi.color.onSurface,
        },
      }}
    >
      <LumiIcon name={item.icon} sx={{ fontSize: 20 }} />
      {item.label}
    </Box>
  );
}

/**
 * Desktop sidebar (fixed) + mobile top bar. Pass an `activeId` and an
 * `onNavigate(item)` handler to wire it to a router. The nav items are
 * role-scoped (students see Teachers where teachers see Students), and the
 * "Create New" CTA only renders when a page supplies `onCreateNew` — student
 * views simply omit the handler.
 */
export default function SideNav({ activeId = "dashboard", onNavigate, onCreateNew, onLogout, onProfile, avatarUrl }) {
  const { userType } = useRole();
  const items = navItemsFor(userType);

  return (
    <>
      {/* Mobile top bar */}
      <Box
        component="nav"
        sx={{
          display: { xs: "flex", md: "none" },
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: 64,
          zIndex: 50,
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          backgroundColor: lumi.color.surfaceContainer,
          borderBottom: `1px solid ${lumi.color.outlineVariant}`,
        }}
      >
        <Typography sx={{ ...lumiType.headlineMd, color: lumi.color.primary }}>
          Lessonbase
        </Typography>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {onCreateNew && (
            <IconButton
              aria-label="Create New"
              onClick={onCreateNew}
              sx={{
                color: lumi.color.onSurface,
                backgroundColor: lumi.color.primaryContainer,
                "&:hover": { backgroundColor: lumi.color.primaryContainer, filter: "brightness(0.9)" },
              }}
            >
              <LumiIcon name="add" sx={{ fontSize: 22 }} />
            </IconButton>
          )}
          <IconButton aria-label="Notifications" sx={{ color: lumi.color.onSurfaceVariant }}>
            <LumiIcon name="notifications" sx={{ fontSize: 22 }} />
          </IconButton>
          <IconButton aria-label="Open profile" onClick={onProfile} sx={{ p: 0 }}>
            <Avatar src={avatarUrl || undefined} sx={{ width: 32, height: 32 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Desktop sidebar */}
      <Box
        component="aside"
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          position: "fixed",
          left: 0,
          top: 0,
          height: "100vh",
          width: SIDEBAR_WIDTH,
          zIndex: 40,
          py: 3,
          px: 2,
          gap: 2,
          backgroundColor: lumi.color.surfaceContainerLow,
          borderRight: `1px solid ${lumi.color.outlineVariant}`,
        }}
      >
        {/* Brand */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1, mb: 2 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: lumi.radius.md,
              backgroundColor: lumi.color.primaryContainer,
              color: lumi.color.onPrimaryContainer,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: lumi.font.headline,
              fontWeight: 700,
            }}
          >
            L
          </Box>
          <Box>
            <Typography sx={{ ...lumiType.headlineMd, color: lumi.color.primary }}>
              Lessonbase
            </Typography>
            <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant }}>
              EdTech Platform
            </Typography>
          </Box>
        </Box>

        {/* Create New CTA — only for pages (and roles) that can create */}
        {onCreateNew && (
          <Button
            onClick={onCreateNew}
            startIcon={<LumiIcon name="add" sx={{ fontSize: 18 }} />}
            sx={{
              height: 48,
              borderRadius: lumi.radius.md,
              backgroundColor: lumi.color.primaryContainer,
              color: lumi.color.onSurface,
              ...lumiType.buttonText,
              boxShadow: `0 4px 12px ${tint(lumi.color.primaryContainer, 0.2)}`,
              "&:hover": { backgroundColor: lumi.color.primaryContainer, filter: "brightness(0.9)" },
            }}
          >
            Create New
          </Button>
        )}

        {/* Main nav */}
        <Box component="nav" sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
          {items.map((item) => (
            <NavLink key={item.id} item={item} active={item.id === activeId} onClick={onNavigate} />
          ))}
        </Box>

        {/* Footer nav */}
        <Box
          sx={{
            pt: 2,
            borderTop: `1px solid ${lumi.color.outlineVariant}`,
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
          }}
        >
          <NavLink
            item={{ id: "settings", label: "Settings", icon: "settings", path: "/settings" }}
            active={activeId === "settings"}
            onClick={onNavigate}
          />
          <Box
            component="a"
            href="/login"
            onClick={(e) => {
              if (onLogout) {
                e.preventDefault();
                onLogout();
              }
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 1.5,
              py: 1.25,
              borderRadius: lumi.radius.md,
              textDecoration: "none",
              ...lumiType.labelMd,
              color: lumi.color.error,
              transition: "background-color .15s ease, color .15s ease",
              "&:hover": {
                backgroundColor: lumi.color.errorContainer,
                color: lumi.color.onErrorContainer,
              },
            }}
          >
            <LumiIcon name="logout" sx={{ fontSize: 20 }} />
            Logout
          </Box>
        </Box>
      </Box>
    </>
  );
}

export { SIDEBAR_WIDTH };
