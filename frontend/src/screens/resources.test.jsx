import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import ResourcesPage from "./resources";

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("../contexts/auth_context", async () => {
  const { createContext } = await import("react");
  const auth = { userType: "teacher", token: "test-token" };
  return {
    // The real module also exports the raw context (consumed by useRole);
    // seed it with the same auth value the hook returns.
    AuthContext: createContext({ auth }),
    useAuth: () => ({ auth }),
  };
});

vi.mock("../contexts/user_context", () => ({
  useUser: () => ({ firstName: "Ada", profilePicture: null }),
}));

vi.mock("../utils/tokenStorage", () => ({
  getToken: () => "test-token",
}));

vi.mock("../utils/media", () => ({
  resolveMediaUrl: (v) => v || "",
}));

const toastError = vi.fn();
const toastSuccess = vi.fn();
vi.mock("react-toastify", () => ({
  toast: {
    error: (...args) => toastError(...args),
    success: (...args) => toastSuccess(...args),
  },
}));

// Make the dropzone hand files straight to onDropAccepted (jsdom can't do
// real drag-and-drop or file-type sniffing).
vi.mock("react-dropzone", () => ({
  useDropzone: ({ onDropAccepted }) => ({
    getRootProps: () => ({ onClick: (e) => e.preventDefault() }),
    getInputProps: () => ({
      "data-testid": "dropzone-input",
      type: "file",
      onChange: (e) => onDropAccepted([...e.target.files]),
    }),
    isFocused: false,
    isDragAccept: false,
    isDragReject: false,
  }),
}));

// ── Fetch stub ────────────────────────────────────────────────────────────────

const MB = 1024 * 1024;

const sampleResources = [
  {
    id: 1,
    title: "Worksheet.pdf",
    kind: "file",
    mime_type: "application/pdf",
    size_bytes: 2 * MB,
    updated_at: "2026-06-01T10:00:00Z",
  },
];

function stubFetch({ storage }) {
  const calls = [];
  globalThis.fetch = vi.fn(async (url, options = {}) => {
    const method = options.method || "GET";
    calls.push({ url: String(url), method });
    if (String(url).includes("/resources/storage/")) {
      return { ok: true, status: 200, json: async () => storage };
    }
    if (method === "DELETE") {
      return { ok: true, status: 204, json: async () => ({}) };
    }
    if (method === "POST") {
      return { ok: true, status: 201, json: async () => ({}) };
    }
    return { ok: true, status: 200, json: async () => sampleResources };
  });
  return calls;
}

function setup() {
  return render(
    <MemoryRouter initialEntries={["/resources"]}>
      <ResourcesPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  toastError.mockClear();
  toastSuccess.mockClear();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ResourcesPage — storage meter", () => {
  it("renders the meter from the storage endpoint", async () => {
    stubFetch({
      storage: {
        used_bytes: 50 * MB,
        limit_bytes: 150 * MB,
        remaining_bytes: 100 * MB,
        max_file_bytes: 100 * MB,
      },
    });
    setup();
    await waitFor(() =>
      expect(screen.getByTestId("storage-meter-usage")).toHaveTextContent("50 MB of 150 MB")
    );
    expect(screen.queryByTestId("storage-meter-warning")).not.toBeInTheDocument();
  });

  it("warns when usage is at 90% or more", async () => {
    stubFetch({
      storage: {
        used_bytes: 140 * MB,
        limit_bytes: 150 * MB,
        remaining_bytes: 10 * MB,
        max_file_bytes: 100 * MB,
      },
    });
    setup();
    await waitFor(() =>
      expect(screen.getByTestId("storage-meter-warning")).toHaveTextContent(/almost full/i)
    );
  });
});

describe("ResourcesPage — delete confirmation", () => {
  const storage = {
    used_bytes: 50 * MB,
    limit_bytes: 150 * MB,
    remaining_bytes: 100 * MB,
    max_file_bytes: 100 * MB,
  };

  it("does not delete until the modal is confirmed", async () => {
    const calls = stubFetch({ storage });
    setup();
    await screen.findByText("Worksheet.pdf");

    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(await screen.findByText(/delete resource\?/i)).toBeInTheDocument();
    // Modal mentions the freed space.
    expect(screen.getByText(/freeing 2\.0 MB of storage/i)).toBeInTheDocument();
    expect(calls.some((c) => c.method === "DELETE")).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(calls.some((c) => c.method === "DELETE")).toBe(false);
  });

  it("deletes and refreshes after confirming", async () => {
    const calls = stubFetch({ storage });
    setup();
    await screen.findByText("Worksheet.pdf");

    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    await screen.findByText(/delete resource\?/i);
    const confirm = screen
      .getAllByRole("button", { name: /^delete$/i })
      .find((b) => b.closest(".MuiDialogActions-root"));
    fireEvent.click(confirm);

    await waitFor(() =>
      expect(calls.some((c) => c.method === "DELETE" && c.url.includes("/resources/1/"))).toBe(true)
    );
    expect(toastSuccess).toHaveBeenCalledWith(expect.stringContaining("deleted"));
    // Storage is re-fetched after a delete (initial load + refresh).
    const storageCalls = calls.filter((c) => c.url.includes("/resources/storage/"));
    expect(storageCalls.length).toBeGreaterThan(1);
  });
});

describe("ResourcesPage — upload quota checks", () => {
  it("blocks an upload that exceeds the remaining space", async () => {
    const calls = stubFetch({
      storage: {
        used_bytes: 19 * MB,
        limit_bytes: 20 * MB,
        remaining_bytes: 1 * MB,
        max_file_bytes: 100 * MB,
      },
    });
    setup();
    await screen.findByText("Worksheet.pdf");

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /add resource/i }));
    const input = await screen.findByTestId("dropzone-input");

    const big = new File([new Uint8Array(2 * MB)], "big.pdf", { type: "application/pdf" });
    await waitFor(() => fireEvent.change(input, { target: { files: [big] } }));

    await user.click(screen.getByRole("button", { name: /upload/i }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(expect.stringMatching(/not enough storage space/i))
    );
    // No file POST went out.
    expect(calls.some((c) => c.method === "POST")).toBe(false);
  });

  it("blocks a single file over the per-file cap", async () => {
    const calls = stubFetch({
      storage: {
        used_bytes: 0,
        limit_bytes: 150 * MB,
        remaining_bytes: 150 * MB,
        max_file_bytes: 3 * MB, // shrunk so the test file stays small
      },
    });
    setup();
    await screen.findByText("Worksheet.pdf");

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /add resource/i }));
    const input = await screen.findByTestId("dropzone-input");

    const big = new File([new Uint8Array(4 * MB)], "too-big.pdf", { type: "application/pdf" });
    await waitFor(() => fireEvent.change(input, { target: { files: [big] } }));

    await user.click(screen.getByRole("button", { name: /upload/i }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(expect.stringMatching(/too large/i))
    );
    expect(calls.some((c) => c.method === "POST")).toBe(false);
  });
});
