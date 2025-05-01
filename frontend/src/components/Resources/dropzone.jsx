import React, { useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-toastify";

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

const focusedStyle = {
  borderColor: "#2196f3",
};

const acceptStyle = {
  borderColor: "#00e676",
};

const rejectStyle = {
  borderColor: "#ff1744",
};

const Dropzone = ({ onDrop }) => {
  const { getRootProps, getInputProps, isFocused, isDragAccept, isDragReject } =
    useDropzone({
      accept: {
        "image/jpeg": [],
        "image/png": [],
        "image/gif": [],
        "image/svg+xml": [],
        "image/bmp": [],
        "application/pdf": [],
        "application/msword": [], // .doc
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          [], // .docx
        "application/vnd.ms-excel": [], // .xls
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [], // .xlsx
        "application/vnd.ms-powerpoint": [], // .ppt
        "application/vnd.openxmlformats-officedocument.presentationml.presentation":
          [], // .pptx
        "text/plain": [], // .txt
      },
      maxSize: 50 * 1024 * 1024, // 50MB
      onDropAccepted: (files) => {
        console.log(files);
        onDrop(files);
      },
      onDropRejected: (files) => {
        toast.error(
          "File rejected. Ensure it is under 50MB and of correct type."
        );
      },
    });

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isFocused ? focusedStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {}),
    }),
    [isFocused, isDragAccept, isDragReject]
  );

  return (
    <div className="container">
      <div {...getRootProps({ style })}>
        <input {...getInputProps()} />
        <p>Drag and drop some files, or click to select files</p>
      </div>
    </div>
  );
};

export default Dropzone;
