import { useState } from "react";
import { Box, Button, LinearProgress, Typography } from "@mui/material";

import { lumi, lumiType, tint } from "./tokens";
import { LumiIcon } from "./shared";
import LumiModal from "./LumiModal";

/**
 * Drawer kit — the building blocks every detail drawer composes inside a
 * LumiDrawer body. One source for the section card, stat row, progress bar,
 * info rows, collapsible lists and destructive actions, so the four detail
 * drawers share a single visual + interaction language.
 */

// The tonal "section card" that frames each block of drawer content.
export const drawerSectionSx = {
  backgroundColor: lumi.color.surfaceContainer,
  border: `1px solid ${lumi.color.hairline}`,
  borderRadius: lumi.radius.card,
  p: 2.5,
  mb: 2,
};

/** Section card with an icon + title header and an optional trailing action. */
export function DrawerSection({ icon, iconColor, title, action, children, sx }) {
  return (
    <Box sx={{ ...drawerSectionSx, ...sx }}>
      {title && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography
            component="h3"
            sx={{
              ...lumiType.headlineMd,
              fontSize: "16px",
              color: lumi.color.onBackground,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            {icon && <LumiIcon name={icon} sx={{ fontSize: 20, color: iconColor || lumi.color.primary }} />}
            {title}
          </Typography>
          {action}
        </Box>
      )}
      {children}
    </Box>
  );
}

/**
 * Equal-width row of stat tiles: icon over value over label, tinted by accent.
 * items = [{ icon, value, label, accent }] — accent is a lumi colour.
 */
export function DrawerStats({ items = [], sx }) {
  if (!items.length) return null;
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: `repeat(${items.length}, 1fr)`,
        gap: 2,
        mb: 2,
        ...sx,
      }}
    >
      {items.map(({ icon, value, label, accent = lumi.color.primary }) => (
        <Box
          key={label}
          sx={{
            textAlign: "center",
            p: 2,
            borderRadius: lumi.radius.card,
            backgroundColor: tint(accent, 0.1),
            border: `1px solid ${tint(accent, 0.3)}`,
          }}
        >
          <LumiIcon name={icon} sx={{ fontSize: 22, color: accent }} />
          <Typography sx={{ ...lumiType.headlineMd, fontSize: "22px", color: accent, my: 0.5 }}>
            {value}
          </Typography>
          <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant }}>{label}</Typography>
        </Box>
      ))}
    </Box>
  );
}

/** Labelled progress bar with a percentage readout. */
export function DrawerProgress({ label, value = 0, accent = lumi.color.tertiary, sx }) {
  const pct = Math.round(value);
  return (
    <Box sx={{ mb: 2, ...sx }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant }}>{label}</Typography>
        <Typography sx={{ ...lumiType.labelMd, color: accent, fontWeight: 700 }}>{pct}%</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={Math.max(0, Math.min(100, pct))}
        sx={{
          height: 8,
          borderRadius: lumi.radius.pill,
          backgroundColor: lumi.color.surfaceVariant,
          "& .MuiLinearProgress-bar": { backgroundColor: accent, borderRadius: lumi.radius.pill },
        }}
      />
    </Box>
  );
}

/** Mono label over a bold value — the standard key/value presentation. */
export function DrawerInfoRow({ label, children, sx }) {
  return (
    <Box sx={sx}>
      <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant, display: "block", mb: 0.25 }}>
        {label}
      </Typography>
      <Typography component="div" sx={{ ...lumiType.bodyMd, color: lumi.color.onSurface, fontWeight: 600 }}>
        {children}
      </Typography>
    </Box>
  );
}

/** Muted italic placeholder for empty drawer sections. */
export function DrawerEmptyText({ children }) {
  return (
    <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.onSurfaceVariant, fontStyle: "italic" }}>
      {children}
    </Typography>
  );
}

const INITIAL_VISIBLE = 4;
const SCROLL_MAX_HEIGHT = 340;

/**
 * Collapsible list section: header with icon, title and count pill; the body
 * shows the first few items, then a "Show all N" toggle reveals the rest
 * inside a capped, discretely-scrolling area so long lists never blow out the
 * drawer's vertical rhythm.
 */
export function DrawerList({
  icon,
  title,
  accent = lumi.color.primary,
  items = [],
  renderItem,
  emptyMessage = "Nothing here yet",
  defaultExpanded = true,
  initialVisible = INITIAL_VISIBLE,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showAll, setShowAll] = useState(false);

  const overflowing = items.length > initialVisible;
  const visible = showAll ? items : items.slice(0, initialVisible);

  return (
    <Box sx={{ ...drawerSectionSx, p: 0, overflow: "hidden" }}>
      <Box
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          "&:hover": { backgroundColor: lumi.color.surfaceContainerHigh },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {icon && <LumiIcon name={icon} sx={{ fontSize: 20, color: accent }} />}
          <Typography
            component="h3"
            sx={{ ...lumiType.headlineMd, fontSize: "16px", color: lumi.color.onBackground }}
          >
            {title}
          </Typography>
          <Box
            component="span"
            sx={{
              ...lumiType.labelMd,
              px: 1,
              py: 0.25,
              borderRadius: lumi.radius.pill,
              backgroundColor: tint(accent, 0.18),
              color: accent,
            }}
          >
            {items.length}
          </Box>
        </Box>
        <LumiIcon
          name="expand_more"
          sx={{
            fontSize: 22,
            color: lumi.color.onSurfaceVariant,
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform .3s",
          }}
        />
      </Box>

      {expanded && (
        <Box sx={{ px: 2, pb: 2 }}>
          {items.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 1 }}>
              <DrawerEmptyText>{emptyMessage}</DrawerEmptyText>
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  ...(showAll && overflowing
                    ? {
                        maxHeight: SCROLL_MAX_HEIGHT,
                        overflowY: "auto",
                        pr: 0.5,
                        scrollbarWidth: "thin",
                        scrollbarColor: `${lumi.color.surfaceVariant} transparent`,
                        "&::-webkit-scrollbar": { width: 6 },
                        "&::-webkit-scrollbar-thumb": {
                          backgroundColor: lumi.color.surfaceVariant,
                          borderRadius: lumi.radius.pill,
                        },
                      }
                    : {}),
                }}
              >
                {visible.map(renderItem)}
              </Box>
              {overflowing && (
                <Button
                  fullWidth
                  onClick={() => setShowAll((v) => !v)}
                  sx={{
                    mt: 1.5,
                    ...lumiType.buttonText,
                    color: lumi.color.primary,
                    borderRadius: lumi.radius.md,
                    "&:hover": { backgroundColor: tint(lumi.color.primary, 0.08) },
                  }}
                >
                  {showAll ? "Show less" : `Show all ${items.length}`}
                </Button>
              )}
            </>
          )}
        </Box>
      )}
    </Box>
  );
}

/** Outlined destructive action — the standard footer companion to PrimaryActionButton. */
export function DangerButton({ label, onClick, sx, ...rest }) {
  return (
    <Button
      onClick={onClick}
      sx={{
        ...lumiType.buttonText,
        borderRadius: lumi.radius.md,
        color: lumi.color.error,
        border: `1px solid ${tint(lumi.color.error, 0.4)}`,
        "&:hover": { backgroundColor: tint(lumi.color.error, 0.1) },
        ...sx,
      }}
      {...rest}
    >
      {label}
    </Button>
  );
}

/** Confirmation modal for destructive actions, shared by every drawer. */
export function ConfirmDeleteModal({ open, onClose, onConfirm, title, confirmLabel = "Delete", cancelLabel = "Cancel", children }) {
  return (
    <LumiModal
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="xs"
      actions={
        <>
          <Button onClick={onClose} sx={{ color: lumi.color.onSurfaceVariant }}>
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            sx={{
              ...lumiType.buttonText,
              borderRadius: lumi.radius.md,
              px: 2,
              color: lumi.color.onErrorContainer,
              backgroundColor: lumi.color.errorContainer,
              "&:hover": { backgroundColor: lumi.color.errorContainer, filter: "brightness(1.1)" },
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.onSurfaceVariant }}>{children}</Typography>
    </LumiModal>
  );
}
