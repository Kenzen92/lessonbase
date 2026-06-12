import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import Settings from "./settings";

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("../contexts/user_context", () => ({
  useUser: () => ({ firstName: "Ada", profilePicture: null }),
}));

vi.mock("../utils/tokenStorage", () => ({
  getToken: () => "test-token",
  clearAuth: () => {},
}));

vi.mock("../utils/media", () => ({
  resolveMediaUrl: (v) => v || "",
}));

const toastError = vi.fn();
vi.mock("react-toastify", () => ({
  toast: {
    error: (...args) => toastError(...args),
    success: () => {},
  },
}));

const fetchMarketingPreferences = vi.fn();
const updateMarketingPreferences = vi.fn();
vi.mock("../utils/agent", () => ({
  fetchMarketingPreferences: (...args) => fetchMarketingPreferences(...args),
  updateMarketingPreferences: (...args) => updateMarketingPreferences(...args),
}));

function setup() {
  return render(
    <MemoryRouter initialEntries={["/settings"]}>
      <Settings />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchMarketingPreferences.mockResolvedValue({
    product_updates: false,
    tips_and_tutorials: true,
    promotions: false,
  });
});

describe("Settings screen", () => {
  it("loads and renders the email preference toggles", async () => {
    setup();
    expect(await screen.findByText("Product updates")).toBeInTheDocument();
    expect(screen.getByText("Tips & tutorials")).toBeInTheDocument();
    expect(screen.getByText("Promotions & offers")).toBeInTheDocument();

    expect(screen.getByRole("checkbox", { name: "Product updates" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Tips & tutorials" })).toBeChecked();
  });

  it("saves a toggle via PATCH and keeps the server state", async () => {
    updateMarketingPreferences.mockResolvedValue({
      ok: true,
      data: { product_updates: true, tips_and_tutorials: true, promotions: false },
    });
    setup();

    await userEvent.click(await screen.findByRole("checkbox", { name: "Product updates" }));

    await waitFor(() =>
      expect(updateMarketingPreferences).toHaveBeenCalledWith(
        { product_updates: true },
        expect.anything()
      )
    );
    expect(screen.getByRole("checkbox", { name: "Product updates" })).toBeChecked();
  });

  it("reverts the toggle and shows an error when the save fails", async () => {
    updateMarketingPreferences.mockResolvedValue({ ok: false, error: "nope" });
    setup();

    await userEvent.click(await screen.findByRole("checkbox", { name: "Promotions & offers" }));

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(screen.getByRole("checkbox", { name: "Promotions & offers" })).not.toBeChecked();
  });
});
