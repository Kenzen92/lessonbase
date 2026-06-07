import { useState } from "react";
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";

import { lumi, lumiType } from "./tokens";
import { LumiIcon } from "./shared";

/**
 * A "⋮" overflow menu for card/row actions. `items` is an array of
 * { label, icon?, onClick, danger? }; falsy entries are ignored so callers can
 * conditionally include actions. Stops click propagation so it works inside a
 * clickable card.
 */
export default function KebabMenu({ items = [], ariaLabel = "More actions" }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const actions = items.filter(Boolean);
  if (!actions.length) return null;

  const close = (e) => {
    e?.stopPropagation();
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        aria-label={ariaLabel}
        onClick={(e) => {
          e.stopPropagation();
          setAnchorEl(e.currentTarget);
        }}
        sx={{ color: lumi.color.onSurfaceVariant, "&:hover": { color: lumi.color.onSurface } }}
      >
        <LumiIcon name="more_vert" sx={{ fontSize: 20 }} />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: lumi.color.surfaceContainerHigh,
              border: `1px solid ${lumi.color.outlineVariant}`,
              borderRadius: lumi.radius.md,
              color: lumi.color.onSurface,
            },
          },
        }}
      >
        {actions.map((item) => (
          <MenuItem
            key={item.label}
            onClick={(e) => {
              e.stopPropagation();
              close();
              item.onClick?.();
            }}
            sx={{
              ...lumiType.bodyMd,
              color: item.danger ? lumi.color.error : lumi.color.onSurface,
              "&:hover": { backgroundColor: lumi.color.surfaceVariant },
            }}
          >
            {item.icon && (
              <ListItemIcon sx={{ color: "inherit", minWidth: 32 }}>
                <LumiIcon name={item.icon} sx={{ fontSize: 18 }} />
              </ListItemIcon>
            )}
            <ListItemText primaryTypographyProps={{ sx: lumiType.bodyMd }}>{item.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
