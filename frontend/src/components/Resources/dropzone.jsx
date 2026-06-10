import React, { useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-toastify";

import { lumi, tint } from "../luminous";
import { humanFileSize } from "../../utils/format";

const DEFAULT_ACCEPT = {
  "image/jpeg": [],
  "image/png": [],
  "image/gif": [],
  "image/svg+xml": [],
  "image/bmp": [],
  "application/pdf": [],
  "application/msword": [],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [],
  "application/vnd.ms-excel": [],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [],
  "application/vnd.ms-powerpoint": [],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [],
  "text/plain": [],
};

// Mirrors the server's per-file cap (apps/resources/models.py MAX_FILE_SIZE).
const MAX_FILE_BYTES = 100 * 1024 * 1024;

const baseStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "28px 20px",
  borderWidth: 2,
  borderRadius: lumi.radius.card,
  borderColor: lumi.color.outlineVariant,
  borderStyle: "dashed",
  backgroundColor: lumi.color.surfaceContainerLow,
  color: lumi.color.onSurfaceVariant,
  fontFamily: lumi.font.body,
  fontSize: 14,
  cursor: "pointer",
  outline: "none",
  transition: "border-color .24s ease-in-out, background-color .24s ease-in-out",
};

const focusedStyle = { borderColor: lumi.color.primary };
const acceptStyle = {
  borderColor: lumi.color.tertiary,
  backgroundColor: tint(lumi.color.tertiary, 0.08),
};
const rejectStyle = {
  borderColor: lumi.color.error,
  backgroundColor: tint(lumi.color.error, 0.08),
};

const Dropzone = ({ onDrop, accept, disabled, maxSize = MAX_FILE_BYTES }) => {
  const { getRootProps, getInputProps, isFocused, isDragAccept, isDragReject } =
    useDropzone({
      accept: accept || DEFAULT_ACCEPT,
      maxSize,
      disabled,
      onDropAccepted: (files) => {
        onDrop(files);
      },
      onDropRejected: (rejections) => {
        const tooBig = rejections.find((r) =>
          r.errors?.some((e) => e.code === "file-too-large")
        );
        toast.error(
          tooBig
            ? `"${tooBig.file.name}" is too large — files are limited to ${humanFileSize(maxSize)}.`
            : "File rejected. That file type is not supported."
        );
      },
    });

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isFocused ? focusedStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {}),
      ...(disabled ? { opacity: 0.5, cursor: "not-allowed" } : {}),
    }),
    [isFocused, isDragAccept, isDragReject, disabled]
  );

  return (
    <div className="container">
      <div {...getRootProps({ style })}>
        <input {...getInputProps()} />
        <p style={{ margin: 0 }}>Drag and drop files here, or click to select</p>
        <p
          style={{
            margin: "6px 0 0",
            fontFamily: lumi.font.mono,
            fontSize: 12,
            letterSpacing: "0.02em",
            color: lumi.color.onSurfaceVariant,
            opacity: 0.8,
          }}
        >
          Max {humanFileSize(maxSize)} per file
        </p>
      </div>
    </div>
  );
};

export default Dropzone;
