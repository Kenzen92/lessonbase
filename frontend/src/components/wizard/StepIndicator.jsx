import React from "react";
import { Box, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";

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
                sx={(theme) => ({
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 600,
                  transition: theme.transitions.create([
                    "background-color",
                    "color",
                  ]),
                  backgroundColor:
                    isCompleted || isCurrent
                      ? theme.palette.primary.main
                      : theme.palette.surface.input,
                  color:
                    isCompleted || isCurrent
                      ? theme.palette.primary.contrastText
                      : theme.palette.text.secondary,
                  border:
                    isCompleted || isCurrent
                      ? "none"
                      : `1px solid ${theme.palette.surface.border}`,
                })}
              >
                {isCompleted ? (
                  <CheckIcon fontSize="small" />
                ) : (
                  index + 1
                )}
              </Box>
              <Typography
                variant="caption"
                sx={(theme) => ({
                  fontSize: 12,
                  textAlign: "center",
                  color: isCurrent
                    ? theme.palette.text.primary
                    : theme.palette.text.secondary,
                  fontWeight: isCurrent ? 600 : 400,
                })}
              >
                {step.label}
              </Typography>
            </Box>

            {index < steps.length - 1 && (
              <Box
                aria-hidden="true"
                sx={(theme) => ({
                  flex: 1,
                  height: 2,
                  mt: "15px", // vertically centre on the 32px circle
                  mx: 0.5,
                  borderRadius: 1,
                  backgroundColor:
                    index < current
                      ? theme.palette.primary.main
                      : theme.palette.surface.border,
                })}
              />
            )}
          </React.Fragment>
        );
      })}
    </Box>
  );
};

export default StepIndicator;
