import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import ResourceCard, { resourceCategory } from "./resource_card";

vi.mock("../../utils/media", () => ({
  resolveMediaUrl: (v) => v || "",
}));

const fileResource = (overrides = {}) => ({
  id: 1,
  title: "Worksheet.pdf",
  kind: "file",
  mime_type: "application/pdf",
  size_bytes: 2.4 * 1024 * 1024,
  updated_at: "2026-06-01T10:00:00Z",
  ...overrides,
});

describe("ResourceCard", () => {
  it("shows the file size from size_bytes on the card", () => {
    render(<ResourceCard resource={fileResource()} />);
    expect(screen.getByText(/2\.4 MB/)).toBeInTheDocument();
  });

  it("maps office mime types to friendly labels", () => {
    render(
      <ResourceCard
        resource={fileResource({
          mime_type:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        })}
      />
    );
    expect(screen.getByText("DOCX")).toBeInTheDocument();
    expect(
      screen.queryByText(/openxmlformats/i)
    ).not.toBeInTheDocument();
  });

  it("labels plain text files TXT", () => {
    render(<ResourceCard resource={fileResource({ mime_type: "text/plain" })} />);
    expect(screen.getByText("TXT")).toBeInTheDocument();
  });

  it("fires onDelete with the resource when the delete icon is clicked", () => {
    const onDelete = vi.fn();
    const resource = fileResource();
    render(<ResourceCard resource={resource} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith(resource);
  });

  it("list layout also shows the size", () => {
    render(<ResourceCard resource={fileResource()} layout="list" />);
    expect(screen.getByText(/2\.4 MB/)).toBeInTheDocument();
  });
});

describe("resourceCategory", () => {
  it("buckets office documents under Documents", () => {
    expect(
      resourceCategory({
        kind: "file",
        mime_type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }).label
    ).toBe("Documents");
  });

  it("keeps links, pdfs and images in their own buckets", () => {
    expect(resourceCategory({ kind: "link" }).id).toBe("LINK");
    expect(resourceCategory({ kind: "file", mime_type: "application/pdf" }).id).toBe("PDF");
    expect(resourceCategory({ kind: "file", mime_type: "image/png" }).id).toBe("IMAGE");
  });

  it("falls back to Other for unknown types", () => {
    expect(resourceCategory({ kind: "file", mime_type: "application/zip" }).id).toBe("OTHER");
  });
});
