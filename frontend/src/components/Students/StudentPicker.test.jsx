import { describe, it, expect } from "vitest";
import { useState } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { darkTheme } from "../../styles/theme";
import StudentPicker from "./StudentPicker";

const groups = [
  { id: 1, name: "Set A" },
  { id: 2, name: "Set B" },
];

const students = [
  { id: 10, first_name: "Alice", last_name: "Smith", username: "alice", email: "alice@x.com", class_groups: [groups[0]] },
  { id: 20, first_name: "Bob", last_name: "Jones", username: "bob", email: "bob@x.com", class_groups: [groups[1]] },
  { id: 30, first_name: "Carol", last_name: "Lee", username: "carol", email: "carol@x.com", class_groups: [groups[0]] },
];

function Harness({ initial = [] }) {
  const [selected, setSelected] = useState(initial);
  return (
    <ThemeProvider theme={darkTheme}>
      <div data-testid="selected">{selected.join(",")}</div>
      <StudentPicker
        students={students}
        classGroups={groups}
        selectedStudents={selected}
        setSelectedStudents={setSelected}
      />
    </ThemeProvider>
  );
}

const selectedIds = () => screen.getByTestId("selected").textContent;
// Scope name lookups to the row list so selected-rail chips (which repeat the
// name) don't create ambiguous matches.
const list = () => screen.getByRole("list");
const rowText = (name) => within(list()).queryByText(name);

describe("StudentPicker", () => {
  it("filters the list by search across name/username/email (AC-SP2)", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(rowText("Alice Smith")).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Search/), "bob");

    await waitFor(() => {
      expect(rowText("Alice Smith")).not.toBeInTheDocument();
    });
    expect(rowText("Bob Jones")).toBeInTheDocument();

    await user.clear(screen.getByLabelText(/Search/));
    await waitFor(() => {
      expect(rowText("Alice Smith")).toBeInTheDocument();
    });
  });

  it("group filter chip narrows the list without changing selection (AC-SP3)", async () => {
    const user = userEvent.setup();
    render(<Harness initial={[20]} />); // Bob preselected

    await user.click(screen.getByRole("button", { name: "Set A" }));

    // Only Set A members shown; Bob (Set B) hidden from the list.
    expect(rowText("Alice Smith")).toBeInTheDocument();
    expect(rowText("Bob Jones")).not.toBeInTheDocument();
    // Selection is untouched by filtering.
    expect(selectedIds()).toBe("20");
  });

  it("Select all shown adds only filtered rows and preserves outside selections (AC-SP4)", async () => {
    const user = userEvent.setup();
    render(<Harness initial={[20]} />); // Bob (Set B) preselected

    await user.click(screen.getByRole("button", { name: "Set A" }));
    await user.click(screen.getByRole("button", { name: "Select all shown" }));

    // Alice(10) + Carol(30) added; Bob(20) preserved though not shown.
    const ids = selectedIds().split(",").sort();
    expect(ids).toEqual(["10", "20", "30"]);
  });

  it("Clear shown removes only the filtered rows (AC-SP4)", async () => {
    const user = userEvent.setup();
    render(<Harness initial={[10, 20, 30]} />);

    await user.click(screen.getByRole("button", { name: "Set A" }));
    await user.click(screen.getByRole("button", { name: "Clear shown" }));

    // Alice(10) + Carol(30) cleared; Bob(20) kept.
    expect(selectedIds()).toBe("20");
  });

  it("clicking a row toggles that student's selection", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(rowText("Alice Smith"));
    expect(selectedIds()).toBe("10");
    await user.click(rowText("Alice Smith"));
    expect(selectedIds()).toBe("");
  });
});
