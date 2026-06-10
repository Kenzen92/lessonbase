import { Box, Typography } from "@mui/material";

import { lumi, lumiType } from "./tokens";
import { LumiIcon } from "./shared";
import { humanFileSize } from "../../utils/format";

// Usage thresholds: amber warning from 90%, error styling once full.
const WARN_RATIO = 0.9;

/**
 * Account storage usage as a labelled progress bar. Shows an inline warning
 * once usage crosses 90% of the allowance and switches to error styling when
 * the account is full (uploads blocked server-side at that point).
 *   <StorageMeter usedBytes={n} limitBytes={n} />
 */
export default function StorageMeter({ usedBytes, limitBytes, sx }) {
  if (typeof usedBytes !== "number" || !limitBytes) return null;

  const ratio = Math.min(usedBytes / limitBytes, 1);
  const full = usedBytes >= limitBytes;
  const warning = !full && ratio >= WARN_RATIO;
  const barColor = full
    ? lumi.color.error
    : warning
    ? lumi.color.amber
    : lumi.color.primaryContainer;

  return (
    <Box data-testid="storage-meter" sx={{ minWidth: 220, ...sx }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 2,
          mb: 0.75,
        }}
      >
        <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant }}>
          STORAGE
        </Typography>
        <Typography
          data-testid="storage-meter-usage"
          sx={{ ...lumiType.labelMd, color: lumi.color.onSurface }}
        >
          {humanFileSize(usedBytes)} of {humanFileSize(limitBytes)}
        </Typography>
      </Box>

      <Box
        role="progressbar"
        aria-label="Storage used"
        aria-valuenow={Math.round(ratio * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        sx={{
          height: 8,
          borderRadius: lumi.radius.pill,
          backgroundColor: lumi.color.surfaceContainerHighest,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            width: `${ratio * 100}%`,
            height: "100%",
            borderRadius: lumi.radius.pill,
            backgroundColor: barColor,
            transition: "width 300ms ease, background-color 300ms ease",
          }}
        />
      </Box>

      {(warning || full) && (
        <Box
          data-testid="storage-meter-warning"
          sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.75 }}
        >
          <LumiIcon
            name="warning"
            sx={{ fontSize: 14, color: full ? lumi.color.error : lumi.color.amberText }}
          />
          <Typography
            sx={{
              ...lumiType.labelMd,
              color: full ? lumi.color.error : lumi.color.amberText,
            }}
          >
            {full
              ? "Storage full — delete resources to upload again."
              : "Storage almost full — delete unused resources to free space."}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
