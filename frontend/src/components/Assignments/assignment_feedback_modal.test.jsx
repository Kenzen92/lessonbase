import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AssignmentFeedbackModal from "./assignment_feedback_modal";

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("../../utils/tokenStorage", () => ({
  getToken: () => "test-token",
}));

vi.mock("../../utils/media", () => ({
  resolveMediaUrl: (v) => v || "",
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockAttempt = (overrides = {}) => ({
  id: 7,
  assignment: { id: 3, title: "Homework 1", max_score: 100 },
  student: { id: 2, first_name: "Alice", last_name: "Smith" },
  answer_text: "This is Alice's answer",
  files: [],
  status: "submitted",
  submitted_at: "2024-03-01T12:00:00Z",
  feedback: null,
  ...overrides,
});

function setup(attemptOverrides = {}, modalProps = {}) {
  return render(
    <AssignmentFeedbackModal
      feedbackModelOpen={true}
      setFeedbackModalOpen={vi.fn()}
      currentAssignmentAttempt={mockAttempt(attemptOverrides)}
      maxAssignmentScore={100}
      handleReloadData={vi.fn()}
      {...modalProps}
    />
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("AssignmentFeedbackModal — markdown fix", () => {
  it("does NOT render literal '**Submitted Text:**'", () => {
    setup();
    expect(screen.queryByText("**Submitted Text:**")).not.toBeInTheDocument();
  });

  it("does NOT render literal '**Submitted Files:**'", () => {
    setup();
    expect(screen.queryByText("**Submitted Files:**")).not.toBeInTheDocument();
  });

  it("renders a plain heading for submitted text (no markdown syntax)", () => {
    setup();
    // The label text should just be plain text without asterisks
    const textLabel = screen.getByText(/submitted text/i);
    expect(textLabel.textContent).not.toContain("**");
  });
});

describe("AssignmentFeedbackModal — no ClassResources", () => {
  it("does NOT contain a 'Class Resources' heading inside the modal", () => {
    setup();
    expect(screen.queryByText(/class resources/i)).not.toBeInTheDocument();
  });
});

describe("AssignmentFeedbackModal — content", () => {
  it("shows the student's answer text", () => {
    setup();
    expect(screen.getByText("This is Alice's answer")).toBeInTheDocument();
  });

  it("shows student name in the header", () => {
    setup();
    expect(screen.getByText(/alice smith/i)).toBeInTheDocument();
  });

  it("shows assignment title in the header", () => {
    setup();
    expect(screen.getByText(/homework 1/i)).toBeInTheDocument();
  });

  it("shows 'No text answer submitted' when answer_text is empty", () => {
    setup({ answer_text: "" });
    expect(screen.getByText(/no text answer submitted/i)).toBeInTheDocument();
  });

  it("shows the AssignmentAttemptFiles component (no files → correct empty state)", () => {
    setup({ files: [] });
    expect(screen.getByText(/no files submitted/i)).toBeInTheDocument();
  });
});

describe("AssignmentFeedbackModal — pre-filled with existing feedback", () => {
  it("pre-fills the feedback form with existing score and text", () => {
    setup({
      feedback: { score: 85, accepted: true, text: "Great work!" },
    });
    const gradeInput = screen.getByLabelText(/grade/i);
    expect(gradeInput.value).toBe("85");
    const feedbackField = screen.getByLabelText(/feedback text/i);
    expect(feedbackField.value).toBe("Great work!");
  });
});

describe("AssignmentFeedbackModal — submit", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  it("PUTs to the correct submission feedback endpoint", async () => {
    const user = userEvent.setup();
    const handleReloadData = vi.fn();
    setup({}, { handleReloadData });

    const textField = screen.getByLabelText(/feedback text/i);
    await user.type(textField, "Good effort");

    const gradeField = screen.getByLabelText(/grade/i);
    await user.clear(gradeField);
    await user.type(gradeField, "75");

    await user.click(screen.getByRole("button", { name: /submit feedback/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    const [url, options] = global.fetch.mock.calls[0];
    // Must use the NEW endpoint, not the old /feedback/ POST
    expect(url).toContain("/submission/7/feedback/");
    expect(options.method).toBe("PUT");
    // Must NOT be hitting the old bare /feedback/ endpoint (no submission id)
    expect(url).not.toMatch(/^[^/]*\/feedback\/$/);  // bare /feedback/ with no parent
  });

  it("calls handleReloadData after successful submit", async () => {
    const user = userEvent.setup();
    const handleReloadData = vi.fn();
    setup({}, { handleReloadData });

    await user.click(screen.getByRole("button", { name: /submit feedback/i }));
    await waitFor(() => expect(handleReloadData).toHaveBeenCalled());
  });
});
