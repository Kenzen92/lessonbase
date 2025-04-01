// buttons.jsx
import React from "react";
import { Button, styled } from "@mui/material";

// Basic Styled Button
export const StyledButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(1),
  padding: theme.spacing(1.5, 3),
  borderRadius: "8px",
  textTransform: "none",
  fontWeight: 600,
}));

// Primary Button Variant
export const PrimaryButton = styled(StyledButton)(({ theme }) => ({
  maxWidth: 250,
  maxHeight: 50,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
  },
}));

// Secondary Button Variant
export const SecondaryButton = styled(StyledButton)(({ theme }) => ({
  backgroundColor: theme.palette.secondary.main,
  color: theme.palette.common.white,
  "&:hover": {
    backgroundColor: theme.palette.secondary.dark,
  },
}));

// Outlined Button Variant
export const OutlinedButton = styled(StyledButton)(({ theme }) => ({
  border: `2px solid ${theme.palette.primary.main}`,
  color: theme.palette.primary.main,
  backgroundColor: "transparent",
  "&:hover": {
    borderColor: theme.palette.primary.dark,
    color: theme.palette.primary.dark,
    backgroundColor: "rgba(0, 0, 0, 0.04)",
  },
}));

// Text Button Variant
export const TextButton = styled(StyledButton)(({ theme }) => ({
  color: theme.palette.primary.main,
  backgroundColor: "transparent",
  padding: theme.spacing(1, 2),
  "&:hover": {
    backgroundColor: "rgba(0, 0, 0, 0.04)",
  },
}));

// Danger Button Variant
export const DangerButton = styled(StyledButton)(({ theme }) => ({
  backgroundColor: theme.palette.error.main,
  color: theme.palette.common.white,
  "&:hover": {
    backgroundColor: theme.palette.error.dark,
  },
}));

// Success Button Variant
export const SuccessButton = styled(StyledButton)(({ theme }) => ({
  backgroundColor: theme.palette.success.main,
  color: theme.palette.common.white,
  "&:hover": {
    backgroundColor: theme.palette.success.dark,
  },
}));

// Warning Button Variant
export const WarningButton = styled(StyledButton)(({ theme }) => ({
  backgroundColor: theme.palette.warning.main,
  color: theme.palette.common.black,
  "&:hover": {
    backgroundColor: theme.palette.warning.dark,
  },
}));

// Large Primary Button Variant
export const LargePrimaryButton = styled(PrimaryButton)(({ theme }) => ({
  padding: theme.spacing(2, 4),
  fontSize: "1.1rem",
}));

// Small Primary Button Variant
export const SmallPrimaryButton = styled(PrimaryButton)(({ theme }) => ({
  padding: theme.spacing(0.75, 2),
  fontSize: "0.9rem",
}));

// Round Button Variant
export const RoundButton = styled(PrimaryButton)(({ theme }) => ({
  borderRadius: "50%",
  minWidth: "48px",
  width: "48px",
  height: "48px",
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));
