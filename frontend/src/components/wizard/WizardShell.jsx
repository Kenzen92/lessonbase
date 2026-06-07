import React, { useEffect, useRef } from "react";
import {
  Modal,
  Box,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useWizard } from "./useWizard";
import StepIndicator from "./StepIndicator";
import { lumi, lumiType, tint } from "../luminous";

/**
 * The single modal scaffold for every wizard. Replaces FormModal, the inline
 * schedule-class Box, and the inline class-group Box.
 *
 * Layout is a flex column capped at the viewport height: the header and step
 * indicator are fixed, the body is the only scroll container, and the footer is
 * sticky so Back / Next / Cancel / Submit are always reachable regardless of
 * body height (fixes the unreachable-submit bug). Submitting disables the
 * primary action and shows a spinner so a second click can't double-submit.
 *
 * Props:
 *   open, onClose       — modal visibility
 *   title               — header text; also labels the dialog for screen readers
 *   steps               — [{ label, content }] (content is the node for that step)
 *   onNext(stepIndex)   — optional; return false (or a rejected/false promise) to
 *                         block advancing (e.g. failed per-step validation)
 *   onSubmit()          — called when the final step's primary action fires
 *   submitting          — disables Next/Submit and shows a spinner
 *   nextLabel/submitLabel — override the primary button copy
 */
const WizardShell = ({
  open,
  onClose,
  title,
  steps = [],
  onNext,
  onSubmit,
  submitting = false,
  nextLabel = "Next",
  submitLabel = "Submit",
}) => {
  const { step, next, back, goTo, reset, isFirst, isLast } = useWizard(
    steps.length
  );
  const bodyRef = useRef(null);

  // Start each fresh open from step one.
  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  // Move focus to the first field whenever the step changes (accessibility).
  useEffect(() => {
    if (!open) return;
    const first = bodyRef.current?.querySelector(
      "input:not([type=hidden]), textarea, select"
    );
    first?.focus?.();
  }, [step, open]);

  const handleNext = async () => {
    if (submitting) return;
    const ok = onNext ? await onNext(step) : true;
    if (ok) next();
  };

  const handlePrimary = async () => {
    if (submitting) return;
    if (isLast) {
      await onSubmit?.();
    } else {
      await handleNext();
    }
  };

  const current = steps[step];

  return (
    <Modal
      open={open}
      onClose={submitting ? undefined : onClose}
      aria-labelledby="wizard-shell-title"
      slotProps={{
        backdrop: {
          sx: { backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.8)" },
        },
      }}
    >
      <Box
        data-testid="wizard-shell"
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          width: { xs: "100vw", sm: "min(640px, 95vw)" },
          maxHeight: { xs: "100dvh", sm: "90vh" },
          height: { xs: "100dvh", sm: "auto" },
          color: lumi.color.onSurface,
          fontFamily: lumi.font.body,
          backgroundColor: lumi.color.surfaceContainer,
          backgroundImage: "none",
          border: { xs: "none", sm: `1px solid ${lumi.color.outlineVariant}` },
          borderRadius: { xs: 0, sm: lumi.radius.card },
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
          outline: "none",
        }}
      >
        {/* Header (fixed) */}
        <Box
          sx={{
            px: { xs: 2, sm: 4 },
            pt: { xs: 2, sm: 4 },
            pb: 2,
            flex: "0 0 auto",
          }}
        >
          <Typography
            id="wizard-shell-title"
            component="h2"
            sx={{ ...lumiType.headlineMd, color: lumi.color.onBackground, mb: 2 }}
          >
            {title}
          </Typography>
          {steps.length > 1 && (
            <StepIndicator steps={steps} current={step} onStepClick={goTo} />
          )}
        </Box>

        {/* Body (the only scroll container). No top padding here: padding on the
            scroll container itself pins `position: sticky` children below it,
            leaving a band where content bleeds above sticky headers. The top
            spacing lives on the inner wrapper instead, so it scrolls away cleanly
            and sticky headers (e.g. the student picker's search bar) pin flush. */}
        <Box
          ref={bodyRef}
          sx={{
            px: { xs: 2, sm: 4 },
            flex: "1 1 auto",
            overflowY: "auto",
            minHeight: 0,
          }}
        >
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            {/* Top padding so the first field's floating label isn't clipped at
                rest, applied as scrolling content rather than container padding. */}
            <Box sx={{ pt: 1 }}>{current?.content}</Box>
          </LocalizationProvider>
        </Box>

        {/* Footer (sticky) */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            px: { xs: 2, sm: 4 },
            py: 2,
            flex: "0 0 auto",
            borderTop: `1px solid ${lumi.color.outlineVariant}`,
          }}
        >
          <Button onClick={onClose} disabled={submitting} sx={{ ...lumiType.buttonText, color: lumi.color.onSurfaceVariant }}>
            Cancel
          </Button>

          <Box sx={{ flex: 1 }} />

          {!isFirst && (
            <Button
              onClick={back}
              disabled={submitting}
              sx={{
                ...lumiType.buttonText,
                borderRadius: lumi.radius.md,
                color: lumi.color.onSurface,
                border: `1px solid ${lumi.color.outlineVariant}`,
                "&:hover": { borderColor: lumi.color.outline, backgroundColor: lumi.color.surfaceVariant },
              }}
            >
              Back
            </Button>
          )}
          <Button
            onClick={handlePrimary}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{
              ...lumiType.buttonText,
              px: 2.5,
              borderRadius: lumi.radius.md,
              backgroundColor: lumi.color.primaryContainer,
              color: lumi.color.onSurface,
              boxShadow: `0 4px 12px ${tint(lumi.color.primaryContainer, 0.2)}`,
              "&:hover": { backgroundColor: lumi.color.primaryContainer, filter: "brightness(0.9)" },
              "&.Mui-disabled": { backgroundColor: lumi.color.surfaceVariant, color: lumi.color.onSurfaceVariant },
            }}
          >
            {isLast ? submitLabel : nextLabel}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default WizardShell;
