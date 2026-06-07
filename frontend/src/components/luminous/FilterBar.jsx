import { Box, Typography } from "@mui/material";

import { lumi, lumiType, tint } from "./tokens";
import { LumiIcon } from "./shared";

function FilterChip({ chip, active, onClick }) {
  const color = chip.color || lumi.color.primary;
  return (
    <Box
      component="button"
      onClick={onClick}
      aria-pressed={active}
      sx={{
        cursor: "pointer",
        px: 1.5,
        py: 0.5,
        borderRadius: lumi.radius.pill,
        ...lumiType.labelMd,
        whiteSpace: "nowrap",
        transition: "background-color .15s ease, border-color .15s ease, color .15s ease",
        border: `1px solid ${active ? tint(color, 0.6) : lumi.color.outlineVariant}`,
        backgroundColor: active ? tint(color, 0.18) : "transparent",
        color: active ? color : lumi.color.onSurfaceVariant,
        "&:hover": { borderColor: tint(color, 0.6), color },
      }}
    >
      {chip.label}
    </Box>
  );
}

/**
 * A horizontal filter chip row with a leading "Filter" label, plus a Clear
 * affordance once anything is selected. Generic over `chips`
 * ([{ id, label, color? }]); selection is controlled via `selected` (ids) +
 * `onToggle(id)` / `onClear`. Renders nothing when there are no chips.
 */
export default function FilterBar({ chips = [], selected = [], onToggle, onClear, label = "Filter" }) {
  if (!chips.length) return null;
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: lumi.color.onSurfaceVariant, mr: 0.5 }}>
        <LumiIcon name="filter" sx={{ fontSize: 18 }} />
        <Typography sx={{ ...lumiType.labelMd }}>{label}</Typography>
      </Box>
      {chips.map((chip) => (
        <FilterChip
          key={chip.id}
          chip={chip}
          active={selected.includes(chip.id)}
          onClick={() => onToggle && onToggle(chip.id)}
        />
      ))}
      {selected.length > 0 && (
        <FilterChip chip={{ id: "__clear", label: "Clear" }} active={false} onClick={onClear} />
      )}
    </Box>
  );
}
