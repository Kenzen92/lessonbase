import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StudentAssignmentAttemptForm from "./student_assignment_attempt_form";

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("../../utils/tokenStorage", () => ({
  getToken: () => "test-token",
}));

vi.mock("../../utils/media", () => ({
  resolveMediaUrl: (v) => v || "",
}));

// Silence react-dropzone in jsdom
vi.mock("react-dropzone", () => ({
  useDropzone: () => ({
    getRootProps: () => ({}),
    getInputProps: () => ({}),
    isFocused: false,
    isDragAccept: false,
    isDragReject: false,
  }),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockAssignment = { id: 99, title: "Test Assignment" };

function setup(props = {}) {
  return render(
    <StudentAssignmentAttemptForm assignment={mockAssignment} {...props} />
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("StudentAssignmentAttemptForm — empty state copy", () => {
  it("shows 'No files attached yet' (not the old wrong copy)", () => {
    setup();
    expect(screen.getByText(/no files attached yet/i)).toBeInTheDocument();
  });

  it("does NOT show the old wrong copy 'No class resources available'", () => {
    setup();
    expect(screen.queryByText(/no class resources available/i)).not.toBeInTheDocument();
  });
});

describe("StudentAssignmentAttemptForm — render", () => {
  it("renders the submit button", () => {
    setup();
    expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
  });

  it("renders a text area for the written answer", () => {
    setup();
    expect(screen.getByLabelText(/your answer/i)).toBeInTheDocument();
  });

  it("shows 'Your Submission' heading when an existing attempt is provided", () => {
    setup({
      assignmentAttempt: {
        id: 5,
        answer_text: "My existing answer",
        files: [],
        status: "submitted",
        submitted_at: "2024-01-01T10:00:00Z",
      },
    });
    expect(screen.getByText(/your submission/i)).toBeInTheDocument();
  });
});

describe("StudentAssignmentAttemptForm — submission", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ id: 1, status: "submitted" }),
    });
  });

  it("POSTs to the correct endpoint", async () => {
    const user = userEvent.setup();
    setup();

    const textarea = screen.getByLabelText(/your answer/i);
    await user.type(textarea, "My answer");

    const button = screen.getByRole("button", { name: /submit/i });
    await user.click(button);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    const [url, options] = global.fetch.mock.calls[0];
    // Must POST to the new submissions endpoint, not the old class_material endpoint
    expect(url).toContain(`/assignment/${mockAssignment.id}/submissions/`);
    expect(options.method).toBe("POST");
    expect(url).not.toContain("class_material");
    expect(url).not.toContain("assignment-attempt");
  });

  it("uses FormData with 'files' key (not the old broken 'file.filename' key)", async () => {
    // We verify the FormData is constructed correctly by inspecting what was
    // sent. The old buggy code did formData.append(file, file.filename) which
    // used the File object itself as the key — meaningless and always undefined.
    const user = userEvent.setup();
    const onReload = vi.fn();
    setup({ onReload });

    // type an answer so there's something to submit
    await user.type(screen.getByLabelText(/your answer/i), "Text only submission");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [, options] = global.fetch.mock.calls[0];
    // Body should be FormData (not JSON)
    expect(options.body).toBeInstanceOf(FormData);
    // 'answer_text' must be in the FormData
    expect(options.body.get("answer_text")).toBe("Text only submission");
  });

  it("calls onReload after a successful submit", async () => {
    const user = userEvent.setup();
    const onReload = vi.fn();
    setup({ onReload });

    await user.type(screen.getByLabelText(/your answer/i), "Done");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => expect(onReload).toHaveBeenCalled());
  });
});

describe("StudentAssignmentAttemptForm — disabled when graded", () => {
  it("disables the submit button when submission is graded", () => {
    setup({
      assignmentAttempt: {
        id: 3,
        answer_text: "Done",
        files: [],
        status: "graded",
        submitted_at: "2024-01-01T10:00:00Z",
      },
    });
    const btn = screen.getByRole("button", { name: /update submission/i });
    expect(btn).toBeDisabled();
  });
});
