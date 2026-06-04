import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { darkTheme } from "../../styles/theme";
import { FieldText, FieldSelect, FieldNumber, FieldDate, FieldTime } from "./index";

const wrap = (ui) =>
  render(
    <ThemeProvider theme={darkTheme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>{ui}</LocalizationProvider>
    </ThemeProvider>
  );

let consoleErrors;
let consoleWarns;

beforeEach(() => {
  consoleErrors = [];
  consoleWarns = [];
  vi.spyOn(console, "error").mockImplementation((...args) =>
    consoleErrors.push(args.join(" "))
  );
  vi.spyOn(console, "warn").mockImplementation((...args) =>
    consoleWarns.push(args.join(" "))
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

// No field should re-introduce the removed MUI X `renderInput` prop, which both
// logs a console warning and leaks a `renderinput` attribute to the DOM (B4).
const assertNoRenderInputWarning = () => {
  const all = [...consoleErrors, ...consoleWarns].join("\n");
  expect(all).not.toMatch(/renderInput/i);
};

describe("Field kit", () => {
  it("FieldText renders its label and inline error text", () => {
    wrap(<FieldText label="Title" error helperText="Title is required" />);
    expect(screen.getByLabelText(/Title/)).toBeInTheDocument();
    expect(screen.getByText("Title is required")).toBeInTheDocument();
  });

  it("FieldNumber renders a numeric input with min/max bounds", () => {
    wrap(<FieldNumber label="Max score" min={1} max={100} value={100} onChange={() => {}} />);
    const input = screen.getByLabelText(/Max score/);
    expect(input).toHaveAttribute("type", "number");
    expect(input).toHaveAttribute("min", "1");
    expect(input).toHaveAttribute("max", "100");
  });

  it("FieldSelect renders the provided options", () => {
    wrap(
      <FieldSelect
        label="Subject"
        value=""
        onChange={() => {}}
        options={[
          { value: 1, label: "Maths" },
          { value: 2, label: "English" },
        ]}
      />
    );
    expect(screen.getByLabelText(/Subject/)).toBeInTheDocument();
  });

  it("FieldDate renders via slotProps with no renderInput warning", () => {
    wrap(
      <FieldDate
        label="Date"
        value={dayjs("2026-06-04")}
        onChange={() => {}}
        error
        helperText="Invalid date"
      />
    );
    expect(screen.getAllByLabelText(/Date/).length).toBeGreaterThan(0);
    expect(screen.getByText("Invalid date")).toBeInTheDocument();
    assertNoRenderInputWarning();
  });

  it("FieldTime renders via slotProps with no renderInput warning", () => {
    wrap(<FieldTime label="Time" value={dayjs("2026-06-04T09:00")} onChange={() => {}} />);
    expect(screen.getAllByLabelText(/Time/).length).toBeGreaterThan(0);
    assertNoRenderInputWarning();
  });
});
