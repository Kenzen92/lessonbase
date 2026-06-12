import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ClassroomResourceDrawer from "./ClassroomResourceDrawer";

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("../../utils/tokenStorage", () => ({
  getToken: () => "test-token",
}));

vi.mock("../../utils/media", () => ({
  resolveMediaUrl: (v) => v || "",
}));

// The drawer only uses a handful of Excalidraw helpers; the real package is
// far too heavy for jsdom.
vi.mock("@excalidraw/excalidraw", () => ({
  convertToExcalidrawElements: vi.fn((els) => els),
  CaptureUpdateAction: { IMMEDIATELY: "IMMEDIATELY", NEVER: "NEVER" },
  getDataURL: vi.fn(async () => "data:image/png;base64,xx"),
  viewportCoordsToSceneCoords: vi.fn(() => ({ x: 0, y: 0 })),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

const classResource = (overrides = {}) => ({
  id: 1,
  title: "Class worksheet",
  kind: "file",
  file: "/media/worksheet.pdf",
  file_url: null,
  url: "",
  original_name: "worksheet.pdf",
  mime_type: "application/pdf",
  size_bytes: 1024,
  ...overrides,
});

const imageResource = (overrides = {}) =>
  classResource({
    id: 2,
    title: "Diagram",
    file: "/media/diagram.png",
    original_name: "diagram.png",
    mime_type: "image/png",
    ...overrides,
  });

// fetch router: maps URL substrings to JSON payloads, records calls.
function mockFetchRoutes(routes) {
  global.fetch = vi.fn(async (url, options = {}) => {
    const match = Object.entries(routes).find(([fragment]) =>
      String(url).includes(fragment)
    );
    const body = match ? match[1] : [];
    return {
      ok: true,
      status: options.method === "POST" ? 201 : 200,
      json: async () => (typeof body === "function" ? body(options) : body),
    };
  });
  return global.fetch;
}

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  getBoardApi: () => null,
  classEventId: 42,
  userRole: "teacher",
};

function setup(props = {}) {
  return render(<ClassroomResourceDrawer {...defaultProps} {...props} />);
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("ClassroomResourceDrawer — teacher", () => {
  it("loads and lists the class resources on open", async () => {
    const fetchMock = mockFetchRoutes({
      "/class-event/42/resources/": [classResource()],
    });
    setup();

    expect(await screen.findByText("Class worksheet")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/class-event/42/resources/"),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Token test-token" }),
      })
    );
  });

  it("shows the Class resources / My library tabs and the upload button", async () => {
    mockFetchRoutes({ "/class-event/42/resources/": [] });
    setup();

    expect(screen.getByRole("tab", { name: /class resources/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /my library/i })).toBeInTheDocument();
    expect(await screen.findByText(/upload to class/i)).toBeInTheDocument();
  });

  it("uploads a selected file to the class endpoint and reloads the list", async () => {
    const fetchMock = mockFetchRoutes({ "/class-event/42/resources/": [] });
    setup();

    const input = await screen.findByTestId("classroom-upload-input");
    const file = new File(["dummy"], "photo.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      const post = fetchMock.mock.calls.find(([, opts]) => opts?.method === "POST");
      expect(post).toBeTruthy();
      expect(String(post[0])).toContain("/class-event/42/resources/");
      expect(post[1].body).toBeInstanceOf(FormData);
    });

    // initial GET + POST + reload GET
    await waitFor(() => {
      const gets = fetchMock.mock.calls.filter(([, opts]) => !opts?.method);
      expect(gets.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("loads the personal library on the My library tab and can pin to class", async () => {
    const fetchMock = mockFetchRoutes({
      "/class-event/42/resources/": [],
      "/resources/": [classResource({ id: 9, title: "From my library" })],
    });
    setup();

    fireEvent.click(screen.getByRole("tab", { name: /my library/i }));
    expect(await screen.findByText("From my library")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("attach-resource-9"));
    await waitFor(() => {
      const post = fetchMock.mock.calls.find(([, opts]) => opts?.method === "POST");
      expect(post).toBeTruthy();
      expect(String(post[0])).toContain("/class-event/42/resources/");
      expect(post[1].body).toBe(JSON.stringify({ resource_id: 9 }));
    });
  });

  it("offers Add to board for images and Open for other files", async () => {
    mockFetchRoutes({
      "/class-event/42/resources/": [classResource(), imageResource()],
    });
    setup();

    expect(await screen.findByText("Diagram")).toBeInTheDocument();
    expect(screen.getByTestId("insert-resource-2")).toHaveTextContent(/add to board/i);
    expect(screen.getByRole("link", { name: /open/i })).toHaveAttribute(
      "href",
      "/media/worksheet.pdf"
    );
  });
});

describe("ClassroomResourceDrawer — student", () => {
  it("lists class resources without tabs or upload", async () => {
    mockFetchRoutes({ "/class-event/42/resources/": [classResource()] });
    setup({ userRole: "student" });

    expect(await screen.findByText("Class worksheet")).toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(screen.queryByText(/upload to class/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/my library/i)).not.toBeInTheDocument();
  });

  it("students can still add image resources to the board", async () => {
    mockFetchRoutes({ "/class-event/42/resources/": [imageResource()] });
    setup({ userRole: "student" });

    expect(await screen.findByTestId("insert-resource-2")).toHaveTextContent(
      /add to board/i
    );
  });
});
