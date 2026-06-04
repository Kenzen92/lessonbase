import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { darkTheme } from "../../styles/theme";
import WizardShell from "./WizardShell";

const steps = [
  { label: "Details", content: <input aria-label="title-field" /> },
  { label: "Students", content: <div>Pick students</div> },
  { label: "Files", content: <div>Drop files</div> },
];

const renderShell = (props = {}) =>
  render(
    <ThemeProvider theme={darkTheme}>
      <WizardShell open title="Create New Assignment" steps={steps} {...props} />
    </ThemeProvider>
  );

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("WizardShell", () => {
  it("renders the title and a Step X of N indicator", () => {
    renderShell();
    expect(screen.getByText("Create New Assignment")).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: /Step 1 of 3: Details/ })
    ).toBeInTheDocument();
  });

  it("shows Cancel + Next on the first step and no Back", () => {
    renderShell();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
  });

  it("advances when Next is clicked and Back returns to the prior step", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Pick students")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByLabelText("title-field")).toBeInTheDocument();
  });

  it("blocks advancing when onNext resolves false (failed validation)", async () => {
    const user = userEvent.setup();
    const onNext = vi.fn().mockResolvedValue(false);
    renderShell({ onNext });

    await user.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(onNext).toHaveBeenCalledWith(0));
    // Still on step 1.
    expect(
      screen.getByRole("list", { name: /Step 1 of 3/ })
    ).toBeInTheDocument();
  });

  it("calls onSubmit on the final step", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderShell({ onSubmit });

    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("disables the primary action while submitting (no double submit)", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const { rerender } = renderShell({ onSubmit, submitting: false });

    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    rerender(
      <ThemeProvider theme={darkTheme}>
        <WizardShell
          open
          title="Create New Assignment"
          steps={steps}
          onSubmit={onSubmit}
          submitting
        />
      </ThemeProvider>
    );

    expect(screen.getByRole("button", { name: /Submit/ })).toBeDisabled();
  });
});
