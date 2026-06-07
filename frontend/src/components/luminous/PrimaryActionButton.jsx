import { Button } from "@mui/material";

import { lumi, lumiType, tint } from "./tokens";
import { LumiIcon } from "./shared";

/**
 * The Luminous primary CTA — solid Electric Blue, 40px (default) or 48px
 * (`size="large"`), with an optional leading icon. Used for page-level actions
 * like "Add New Student" / "Create class group" / "Add Resource".
 */
export default function PrimaryActionButton({
  label,
  icon,
  onClick,
  size = "medium",
  sx,
  ...rest
}) {
  return (
    <Button
      onClick={onClick}
      startIcon={icon ? <LumiIcon name={icon} sx={{ fontSize: 18 }} /> : null}
      sx={{
        height: size === "large" ? 48 : 40,
        px: 2.5,
        borderRadius: lumi.radius.md,
        backgroundColor: lumi.color.primaryContainer,
        color: lumi.color.onSurface,
        whiteSpace: "nowrap",
        ...lumiType.buttonText,
        boxShadow: `0 4px 12px ${tint(lumi.color.primaryContainer, 0.2)}`,
        "&:hover": { backgroundColor: lumi.color.primaryContainer, filter: "brightness(0.9)" },
        ...sx,
      }}
      {...rest}
    >
      {label}
    </Button>
  );
}
