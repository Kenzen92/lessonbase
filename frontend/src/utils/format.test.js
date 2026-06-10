import { describe, it, expect } from "vitest";

import { humanFileSize } from "./format";

describe("humanFileSize", () => {
  it("returns null for non-numbers", () => {
    expect(humanFileSize(undefined)).toBeNull();
    expect(humanFileSize(null)).toBeNull();
    expect(humanFileSize("100")).toBeNull();
    expect(humanFileSize(NaN)).toBeNull();
  });

  it("formats bytes below 1 KB", () => {
    expect(humanFileSize(0)).toBe("0 B");
    expect(humanFileSize(512)).toBe("512 B");
  });

  it("formats KB and MB with one decimal under 10", () => {
    expect(humanFileSize(1536)).toBe("1.5 KB");
    expect(humanFileSize(2.4 * 1024 * 1024)).toBe("2.4 MB");
  });

  it("drops decimals from 10 upwards", () => {
    expect(humanFileSize(150 * 1024 * 1024)).toBe("150 MB");
    expect(humanFileSize(20 * 1024 * 1024)).toBe("20 MB");
  });

  it("rolls over to GB", () => {
    expect(humanFileSize(2 * 1024 * 1024 * 1024)).toBe("2.0 GB");
  });
});
