import "@testing-library/jest-dom";

// Silence "act()" warnings in tests that use fetch mocks
global.IS_REACT_ACT_ENVIRONMENT = true;

// Minimal fetch mock — tests override this per-case
global.fetch = vi.fn();

// Silence toast in tests
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
