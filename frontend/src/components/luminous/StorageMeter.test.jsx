import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import StorageMeter from "./StorageMeter";

const MB = 1024 * 1024;

describe("StorageMeter", () => {
  it("renders nothing without usage data", () => {
    const { container } = render(<StorageMeter usedBytes={undefined} limitBytes={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows used / limit and no warning below 90%", () => {
    render(<StorageMeter usedBytes={50 * MB} limitBytes={150 * MB} />);
    expect(screen.getByTestId("storage-meter-usage")).toHaveTextContent("50 MB of 150 MB");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "33");
    expect(screen.queryByTestId("storage-meter-warning")).not.toBeInTheDocument();
  });

  it("shows the warning from 90% usage", () => {
    render(<StorageMeter usedBytes={135 * MB} limitBytes={150 * MB} />);
    expect(screen.getByTestId("storage-meter-warning")).toHaveTextContent(/storage almost full/i);
  });

  it("switches to the full message at 100%", () => {
    render(<StorageMeter usedBytes={150 * MB} limitBytes={150 * MB} />);
    expect(screen.getByTestId("storage-meter-warning")).toHaveTextContent(/storage full/i);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  it("caps the bar at 100% when usage exceeds the limit", () => {
    render(<StorageMeter usedBytes={200 * MB} limitBytes={150 * MB} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });
});
