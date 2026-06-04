import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { darkTheme } from "../../styles/theme";

// Mock the tag autocomplete fetch.
vi.mock("../../utils/agent", () => ({
  fetchTags: vi.fn(async () => [
    { id: 1, name: "Mathematics", color: "#1a237e", kind: "subject" },
    { id: 2, name: "Revision", color: "#2196F3", kind: "general" },
  ]),
}));

import TagField from "./TagField";

const renderField = (props = {}) => {
  const onChange = vi.fn();
  render(
    <ThemeProvider theme={darkTheme}>
      <TagField label="Tags" value={[]} onChange={onChange} {...props} />
    </ThemeProvider>
  );
  return { onChange };
};

beforeEach(() => vi.clearAllMocks());

describe("TagField", () => {
  it("renders existing value as chips", () => {
    renderField({ value: [{ name: "Macbeth", color: "#311b92" }] });
    expect(screen.getByText("Macbeth")).toBeInTheDocument();
  });

  it("creates a tag on free typing (Enter)", async () => {
    const user = userEvent.setup();
    const { onChange } = renderField();

    const input = screen.getByLabelText("Tags");
    await user.type(input, "Homework{enter}");

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const lastArg = onChange.mock.calls.at(-1)[0];
    expect(lastArg).toEqual([{ name: "Homework" }]);
  });

  it("autocompletes existing tags from the server", async () => {
    const user = userEvent.setup();
    renderField();
    await user.click(screen.getByLabelText("Tags"));
    await waitFor(() =>
      expect(screen.getByText("Mathematics")).toBeInTheDocument()
    );
  });
});
