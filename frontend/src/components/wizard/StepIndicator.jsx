import React from "react";
import { Box, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { lumi, lumiType } from "../luminous";

/**
 * Numbered + labelled step indicator with a connecting line. Current and
 * completed steps use the primary fill; upcoming steps are muted. Completed
 * steps are clickable (to jump back); the current and future steps are not.
 *
 * `steps` is an array of { label }. `current` is the zero-based active index.
 */
const StepIndicator = ({ steps, current, onStepClick }) => {
  return (
    <Box
      role="list"
      aria-label={`Step ${current + 1} of ${steps.length}: ${steps[current]?.label || ""}`}
      sx={{ display: "flex", alignItems: "flex-start", width: "100%", mb: 3 }}
    >
      {steps.map((step, index) => {
        const isCompleted = index < current;
        const isCurrent = index === current;
        const isClickable = isCompleted && typeof onStepClick === "function";

        return (
          <React.Fragment key={step.label || index}>
            <Box
              role="listitem"
              aria-current={isCurrent ? "step" : undefined}
              onClick={isClickable ? () => onStepClick(index) : undefined}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.75,
                cursor: isClickable ? "pointer" : "default",
                flex: "0 0 auto",
                minWidth: 64,
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: lumi.font.body,
                  transition: "background-color .2s ease, color .2s ease",
                  backgroundColor:
                    isCompleted || isCurrent ? lumi.color.primaryContainer : lumi.color.surfaceContainerHigh,
                  color: isCompleted || isCurrent ? lumi.color.onSurface : lumi.color.onSurfaceVariant,
                  border: isCompleted || isCurrent ? "none" : `1px solid ${lumi.color.outlineVariant}`,
                }}
              >
                {isCompleted ? <CheckIcon fontSize="small" /> : index + 1}
              </Box>
              <Typography
                sx={{
                  ...lumiType.labelMd,
                  fontFamily: lumi.font.body,
                  textAlign: "center",
                  color: isCurrent ? lumi.color.onSurface : lumi.color.onSurfaceVariant,
                  fontWeight: isCurrent ? 600 : 400,
                }}
              >
                {step.label}
              </Typography>
            </Box>

            {index < steps.length - 1 && (
              <Box
                aria-hidden="true"
                sx={{
                  flex: 1,
                  height: 2,
                  mt: "15px", // vertically centre on the 32px circle
                  mx: 0.5,
                  borderRadius: 1,
                  backgroundColor: index < current ? lumi.color.primaryContainer : lumi.color.outlineVariant,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </Box>
  );
};

export default StepIndicator;
