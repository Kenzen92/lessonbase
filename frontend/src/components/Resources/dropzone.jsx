import React, { useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-toastify";

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

const baseStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "20px",
  borderWidth: 2,
  borderRadius: 2,
  borderColor: "#eeeeee",
  borderStyle: "dashed",
  backgroundColor: "#1c1b1b",
  color: "#bdbdbd",
  outline: "none",
  transition: "border .24s ease-in-out",
};

const focusedStyle = { borderColor: "#2196f3" };
const acceptStyle = { borderColor: "#00e676" };
const rejectStyle = { borderColor: "#ff1744" };

const Dropzone = ({ onDrop, accept, disabled }) => {
  const { getRootProps, getInputProps, isFocused, isDragAccept, isDragReject } =
    useDropzone({
      accept: accept || DEFAULT_ACCEPT,
      maxSize: 50 * 1024 * 1024,
      disabled,
      onDropAccepted: (files) => {
        onDrop(files);
      },
      onDropRejected: () => {
        toast.error("File rejected. Ensure it is under 50 MB and of the correct type.");
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
        <p>Drag and drop files here, or click to select</p>
      </div>
    </div>
  );
};

export default Dropzone;
