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
import { SubjectChip } from "./shared";

describe("Luminous shared components", () => {
  it("AppShell renders nav, search and page content", () => {
    render(
      <MemoryRouter initialEntries={["/students"]}>
        <AppShell
          user={{ userName: "Ada", avatarUrl: null }}
          search={{ placeholder: "Search student…" }}
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
});
