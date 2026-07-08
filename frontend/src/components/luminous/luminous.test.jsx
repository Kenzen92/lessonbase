import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import AppShell from "./AppShell";
import PageHeader from "./PageHeader";
import StatSummary from "./StatSummary";
import StripCard from "./StripCard";
import StatusPill from "./StatusPill";
import SearchInput from "./SearchInput";
import PrimaryActionButton from "./PrimaryActionButton";
import AvatarStack from "./AvatarStack";
import KebabMenu from "./KebabMenu";
import EmptyState from "./EmptyState";
import ViewToggle from "./ViewToggle";
import FilterBar from "./FilterBar";
import KanbanColumn from "./KanbanColumn";
import LumiModal from "./LumiModal";
import LumiDrawer from "./LumiDrawer";
import { SubjectChip, brightenForDark } from "./shared";
import { navItemsFor, activeNavFromPath } from "./nav";
import { AuthContext } from "../../contexts/auth_context";

describe("Luminous shared components", () => {
  it("AppShell renders nav, search and page content", () => {
    render(
      <MemoryRouter initialEntries={["/students"]}>
        <AppShell
          user={{ userName: "Ada", avatarUrl: null }}
          search={{ placeholder: "Search student…", value: "", onChange: () => {} }}
        >
          <div>Page body</div>
        </AppShell>
      </MemoryRouter>
    );
    // Brand + nav from SideNav, search placeholder from TopBar, and the body.
    expect(screen.getAllByText("Lessonbase").length).toBeGreaterThan(0);
    expect(screen.getByText("Students")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search student…")).toBeInTheDocument();
    expect(screen.getByText("Page body")).toBeInTheDocument();
  });

  it("AppShell omits the search box when no onChange is given (Settings)", () => {
    render(
      <MemoryRouter initialEntries={["/settings"]}>
        <AppShell activeNav="settings" user={{ userName: "Ada" }}>
          <div>Settings body</div>
        </AppShell>
      </MemoryRouter>
    );
    expect(screen.queryByPlaceholderText(/Search/)).not.toBeInTheDocument();
    expect(screen.getByText("Settings body")).toBeInTheDocument();
  });

  it("PageHeader shows title, subtitle, stats and fires the action", async () => {
    const onClick = vi.fn();
    render(
      <PageHeader
        title="Students Directory"
        subtitle="Manage your students."
        stats={[{ id: "total", value: 20, label: "Total" }]}
        action={{ label: "Add New Student", icon: "add", onClick }}
      />
    );
    expect(screen.getByRole("heading", { name: "Students Directory" })).toBeInTheDocument();
    expect(screen.getByText("Manage your students.")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Add New Student/ }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("StatSummary renders nothing when empty", () => {
    const { container } = render(<StatSummary items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("StripCard is clickable and renders children", async () => {
    const onClick = vi.fn();
    render(
      <StripCard accent="tertiary" onClick={onClick}>
        <div>Class 1</div>
      </StripCard>
    );
    await userEvent.click(screen.getByText("Class 1"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("brightenForDark lifts dark hues but leaves light ones and non-hex alone", () => {
    // A dark navy gets lightened (changes), a near-white passes through.
    expect(brightenForDark("#0f3460")).not.toBe("#0f3460");
    expect(brightenForDark("#ffffff")).toBe("#ffffff");
    // Named-accent / non-hex strings are returned untouched.
    expect(brightenForDark("rgb(1,2,3)")).toBe("rgb(1,2,3)");
    expect(brightenForDark(undefined)).toBe(undefined);
  });

  it("StatusPill and SubjectChip render their labels", () => {
    render(
      <>
        <StatusPill label="Late" accent="error" />
        <SubjectChip label="Physics" accent="tertiary" />
      </>
    );
    expect(screen.getByText("Late")).toBeInTheDocument();
    expect(screen.getByText("Physics")).toBeInTheDocument();
  });

  it("SearchInput is controlled and reports changes", async () => {
    const onChange = vi.fn();
    render(<SearchInput placeholder="Search…" value="" onChange={onChange} />);
    await userEvent.type(screen.getByPlaceholderText("Search…"), "a");
    expect(onChange).toHaveBeenCalledWith("a");
  });

  it("PrimaryActionButton fires onClick", async () => {
    const onClick = vi.fn();
    render(<PrimaryActionButton label="Create" icon="add" onClick={onClick} />);
    await userEvent.click(screen.getByRole("button", { name: /Create/ }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("AvatarStack caps avatars and shows a +N overflow", () => {
    const people = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      first_name: `F${i}`,
      last_name: `L${i}`,
    }));
    render(<AvatarStack people={people} max={4} />);
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("KebabMenu opens and fires an item action", async () => {
    const onClick = vi.fn();
    render(<KebabMenu items={[{ label: "Edit", onClick }]} />);
    await userEvent.click(screen.getByRole("button", { name: /More actions/ }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("KebabMenu renders nothing with no items", () => {
    const { container } = render(<KebabMenu items={[false, null]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("EmptyState shows its message", () => {
    render(<EmptyState icon="folder_open" message="No resources yet." />);
    expect(screen.getByText("No resources yet.")).toBeInTheDocument();
  });

  it("ViewToggle reports the selected view", async () => {
    const onChange = vi.fn();
    render(<ViewToggle value="grid" onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /List view/ }));
    expect(onChange).toHaveBeenCalledWith("list");
  });

  it("FilterBar toggles chips and shows Clear when active", async () => {
    const onToggle = vi.fn();
    const onClear = vi.fn();
    const chips = [
      { id: "PDF", label: "PDF" },
      { id: "IMAGE", label: "Images" },
    ];
    const { rerender } = render(
      <FilterBar chips={chips} selected={[]} onToggle={onToggle} onClear={onClear} />
    );
    expect(screen.queryByText("Clear")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "PDF" }));
    expect(onToggle).toHaveBeenCalledWith("PDF");
    rerender(<FilterBar chips={chips} selected={["PDF"]} onToggle={onToggle} onClear={onClear} />);
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("FilterBar renders nothing without chips", () => {
    const { container } = render(<FilterBar chips={[]} selected={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("KanbanColumn shows title, count and children", () => {
    render(
      <KanbanColumn title="To Mark" accent="amber" count={1}>
        <div>Homework 2</div>
      </KanbanColumn>
    );
    expect(screen.getByText("To Mark")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Homework 2")).toBeInTheDocument();
  });

  it("KanbanColumn shows an empty state with no children", () => {
    render(<KanbanColumn title="Upcoming" accent="violet" count={0} empty="No upcoming assignments." />);
    expect(screen.getByText("No upcoming assignments.")).toBeInTheDocument();
  });

  it("LumiModal renders title, body, actions and closes", async () => {
    const onClose = vi.fn();
    render(
      <LumiModal open onClose={onClose} title="Add New Student" actions={<button>Save</button>}>
        <div>Body content</div>
      </LumiModal>
    );
    expect(screen.getByRole("heading", { name: "Add New Student" })).toBeInTheDocument();
    expect(screen.getByText("Body content")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("LumiModal renders nothing when closed", () => {
    render(
      <LumiModal open={false} onClose={() => {}} title="Hidden">
        <div>Nope</div>
      </LumiModal>
    );
    expect(screen.queryByText("Nope")).not.toBeInTheDocument();
  });

  it("LumiDrawer renders title, body and footer when open", async () => {
    const onClose = vi.fn();
    render(
      <LumiDrawer open onClose={onClose} title="Student details" footer={<button>Delete</button>}>
        <div>Drawer body</div>
      </LumiDrawer>
    );
    expect(screen.getByRole("heading", { name: "Student details" })).toBeInTheDocument();
    expect(screen.getByText("Drawer body")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("Role-aware shell", () => {
  const withAuth = (userType, ui) => (
    <AuthContext.Provider value={{ auth: { userType, token: "t", user: null, isLoading: false } }}>
      <MemoryRouter initialEntries={["/dashboard"]}>{ui}</MemoryRouter>
    </AuthContext.Provider>
  );

  it("students see a Teachers tab instead of Students", () => {
    render(withAuth("student", <AppShell user={{ userName: "Ada" }}>x</AppShell>));
    expect(screen.getByText("Teachers")).toBeInTheDocument();
    expect(screen.queryByText("Students")).not.toBeInTheDocument();
  });

  it("teachers keep the Students tab", () => {
    render(withAuth("teacher", <AppShell user={{ userName: "Ada" }}>x</AppShell>));
    expect(screen.getByText("Students")).toBeInTheDocument();
    expect(screen.queryByText("Teachers")).not.toBeInTheDocument();
  });

  it("hides the Create New CTA when no handler is supplied", () => {
    render(withAuth("student", <AppShell user={{ userName: "Ada" }}>x</AppShell>));
    expect(screen.queryByText("Create New")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create New" })).not.toBeInTheDocument();
  });

  it("shows the Create New CTA when a handler is supplied", () => {
    render(
      withAuth("teacher", (
        <AppShell user={{ userName: "Ada" }} onCreateNew={() => {}}>
          x
        </AppShell>
      ))
    );
    expect(screen.getByText("Create New")).toBeInTheDocument();
  });

  it("navItemsFor maps roles to their directories", () => {
    expect(navItemsFor("teacher").map((i) => i.id)).toContain("students");
    expect(navItemsFor("student").map((i) => i.id)).toContain("teachers");
    // Unknown role falls back to the teacher list (standalone renders).
    expect(navItemsFor(null).map((i) => i.id)).toContain("students");
  });

  it("activeNavFromPath resolves the teachers directory", () => {
    expect(activeNavFromPath("/teachers")).toBe("teachers");
    expect(activeNavFromPath("/teachers/3")).toBe("teachers");
  });
});
