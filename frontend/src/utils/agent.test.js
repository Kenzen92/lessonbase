import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiRequest, apiMutate } from "./agent";

// agent.js reads the auth token from tokenStorage; stub it so requests build.
vi.mock("./tokenStorage", () => ({
  getToken: () => "test-token",
  clearAuth: vi.fn(),
}));

// Build a minimal fetch Response stand-in. `body` is the raw text the server
// would send (use "" to simulate an empty body).
const fakeResponse = ({ status, ok, body = "", statusText = "" }) => ({
  status,
  ok: ok ?? (status >= 200 && status < 300),
  statusText,
  text: async () => body,
});

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("apiMutate (envelope contract)", () => {
  it("treats a 201 with an empty body as success without throwing", async () => {
    fetch.mockResolvedValueOnce(fakeResponse({ status: 201, body: "" }));

    const result = await apiMutate("/assignment/", "POST", { title: "x" });

    expect(result).toEqual({ ok: true, status: 201, data: null, error: null });
  });

  it("treats a 204 with no content as success", async () => {
    fetch.mockResolvedValueOnce(fakeResponse({ status: 204, body: "" }));

    const result = await apiMutate("/class-event/1/", "DELETE");

    expect(result).toEqual({ ok: true, status: 204, data: null, error: null });
  });

  it("parses a JSON success body into data", async () => {
    fetch.mockResolvedValueOnce(
      fakeResponse({ status: 201, body: JSON.stringify({ id: 7 }) })
    );

    const result = await apiMutate("/assignment/", "POST", { title: "x" });

    expect(result).toEqual({ ok: true, status: 201, data: { id: 7 }, error: null });
  });

  it("tolerates a non-JSON success body instead of throwing", async () => {
    fetch.mockResolvedValueOnce(
      fakeResponse({ status: 200, body: "Created" })
    );

    const result = await apiMutate("/assignment/", "POST", {});

    expect(result.ok).toBe(true);
    expect(result.data).toBeNull();
  });

  it("returns a non-ok envelope with the server error message on 4xx", async () => {
    fetch.mockResolvedValueOnce(
      fakeResponse({
        status: 400,
        body: JSON.stringify({ detail: "Title is required" }),
      })
    );

    const result = await apiMutate("/assignment/", "POST", {});

    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
    expect(result.error).toBe("Title is required");
  });

  it("never rejects on a network failure", async () => {
    fetch.mockRejectedValueOnce(new Error("Failed to fetch"));

    const result = await apiMutate("/assignment/", "POST", {});

    expect(result.ok).toBe(false);
    expect(result.status).toBe(0);
    expect(result.error).toBe("Failed to fetch");
  });

  it("redirects and returns a non-ok envelope on 401", async () => {
    fetch.mockResolvedValueOnce(fakeResponse({ status: 401, body: "" }));
    const navigate = vi.fn();

    const result = await apiMutate("/assignment/", "POST", {}, navigate);

    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
    expect(navigate).toHaveBeenCalledWith("/login");
  });
});

describe("apiRequest (read-style back-compat contract)", () => {
  it("returns null for an empty-body success rather than throwing", async () => {
    fetch.mockResolvedValueOnce(fakeResponse({ status: 201, body: "" }));

    await expect(apiRequest("/thing/", "GET")).resolves.toBeNull();
  });

  it("returns the parsed body on success", async () => {
    fetch.mockResolvedValueOnce(
      fakeResponse({ status: 200, body: JSON.stringify([{ id: 1 }]) })
    );

    await expect(apiRequest("/students/", "GET")).resolves.toEqual([{ id: 1 }]);
  });

  it("returns null on 404", async () => {
    fetch.mockResolvedValueOnce(fakeResponse({ status: 404, body: "" }));

    await expect(apiRequest("/missing/", "GET")).resolves.toBeNull();
  });

  it("throws on a server error so existing try/catch handling fires", async () => {
    fetch.mockResolvedValueOnce(
      fakeResponse({ status: 500, body: JSON.stringify({ detail: "boom" }) })
    );

    await expect(apiRequest("/broken/", "GET")).rejects.toThrow("boom");
  });
});
