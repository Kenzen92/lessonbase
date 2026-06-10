import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { toast } from "react-toastify";

import Dropzone from "./dropzone";
import {
  lumi,
  lumiType,
  tint,
  LumiIcon,
  PrimaryActionButton,
  fieldSx,
} from "../luminous";
import { getToken } from "../../utils/tokenStorage";
import { resolveMediaUrl } from "../../utils/media";
import { humanFileSize } from "../../utils/format";

const BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

const CONTEXT_ENDPOINTS = {
  "class-event": (id) => `${BASE_URL}/class-event/${id}/resources/`,
  assignment: (id) => `${BASE_URL}/assignment/${id}/materials/`,
};

function getAuthHeaders() {
  return { Authorization: `Token ${getToken()}` };
}

// Short type label for the meta line, mirroring resource_card's mapping.
function typeLabel(resource) {
  if (resource.kind === "link") return "LINK";
  const mime = (resource.mime_type || "").toLowerCase();
  if (mime.includes("pdf")) return "PDF";
  if (mime.startsWith("image/")) return (mime.split("/")[1] || "image").toUpperCase();
  if (mime === "text/plain") return "TXT";
  if (mime.includes("wordprocessingml")) return "DOCX";
  if (mime.includes("spreadsheetml")) return "XLSX";
  if (mime.includes("presentationml")) return "PPTX";
  if (mime === "application/msword") return "DOC";
  if (mime === "application/vnd.ms-excel") return "XLS";
  if (mime === "application/vnd.ms-powerpoint") return "PPT";
  return "FILE";
}

/**
 * ResourcePicker — attach / detach resources on a class event or assignment.
 * Luminous-styled: attached rows with icon badge + type/size meta, an upload
 * dropzone, and a searchable "My library" tab for re-using existing resources.
 *
 * Props:
 *   context        { type: 'class-event' | 'assignment', id }
 *   mode           'teacher' | 'student'
 *   value          Resource[] — currently attached resources (read from parent)
 *   onChange       () => void — called after a successful attach or detach so
 *                  the parent can reload data
 *   disabled       boolean
 */
const ResourcePicker = ({ context, mode, value = [], onChange, disabled = false }) => {
  const [tab, setTab] = useState(0);
  const [libraryResources, setLibraryResources] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryQuery, setLibraryQuery] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const isTeacher = mode === "teacher";
  const endpoint = context ? CONTEXT_ENDPOINTS[context.type]?.(context.id) : null;

  const loadLibrary = useCallback(async () => {
    if (!isTeacher) return;
    setLibraryLoading(true);
    try {
      const params = libraryQuery ? `?q=${encodeURIComponent(libraryQuery)}` : "";
      const res = await fetch(`${BASE_URL}/resources/${params}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setLibraryResources(await res.json());
      }
    } catch {
      /* silently ignore */
    } finally {
      setLibraryLoading(false);
    }
  }, [isTeacher, libraryQuery]);

  useEffect(() => {
    if (tab === 1) loadLibrary();
  }, [tab, loadLibrary]);

  const handleFileDrop = (files) => {
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveSelected = (file) => {
    setSelectedFiles((prev) => prev.filter((f) => f !== file));
  };

  const handleUpload = async () => {
    if (!endpoint || selectedFiles.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach((f) => formData.append("file", f, f.name));
      const res = await fetch(endpoint, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });
      if (res.ok) {
        toast.success(
          `${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""} uploaded`
        );
        setSelectedFiles([]);
        onChange?.();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Upload failed");
      }
    } catch {
      toast.error("An error occurred during upload");
    } finally {
      setUploading(false);
    }
  };

  const handleAttachFromLibrary = async (resource) => {
    if (!endpoint) return;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ resource_id: resource.id }),
      });
      if (res.ok) {
        toast.success(`"${resource.title}" attached`);
        onChange?.();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Could not attach resource");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleDetach = async (resource) => {
    if (!endpoint) return;
    try {
      const res = await fetch(`${endpoint}${resource.id}/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok || res.status === 204) {
        toast.success(`"${resource.title}" removed`);
        onChange?.();
      } else {
        toast.error("Could not remove resource");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const resourceUrl = (r) =>
    r.kind === "link" ? r.url : resolveMediaUrl(r.file || r.file_url);

  const alreadyAttachedIds = new Set(value.map((r) => r.id));

  return (
    <Box>
      {/* Attached resources */}
      {value.length === 0 ? (
        <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.onSurfaceVariant, fontStyle: "italic", mt: 1, mb: 1 }}>
          No files attached yet.
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 1.5 }}>
          {value.map((resource, i) => {
            const url = resourceUrl(resource);
            const size = humanFileSize(resource.size_bytes);
            return (
              <Box
                key={resource.id ?? i}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 1.5,
                  py: 1,
                  borderRadius: lumi.radius.md,
                  backgroundColor: lumi.color.surfaceContainerHigh,
                  border: `1px solid ${lumi.color.hairline}`,
                }}
              >
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    flexShrink: 0,
                    borderRadius: lumi.radius.md,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: tint(lumi.color.primary, 0.15),
                    color: lumi.color.primary,
                  }}
                >
                  <LumiIcon name={resource.kind === "link" ? "link" : "file"} sx={{ fontSize: 16 }} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    component={url ? "a" : "span"}
                    {...(url
                      ? {
                          href: url,
                          target: "_blank",
                          rel: "noopener noreferrer",
                          download:
                            resource.kind !== "link"
                              ? resource.original_name || resource.title
                              : undefined,
                        }
                      : {})}
                    sx={{
                      ...lumiType.bodyMd,
                      fontWeight: 600,
                      color: lumi.color.onSurface,
                      textDecoration: "none",
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      "&:hover": url ? { color: lumi.color.primary } : undefined,
                    }}
                  >
                    {resource.title || resource.original_name || "File"}
                  </Typography>
                  <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant }}>
                    {typeLabel(resource)}
                    {size ? ` · ${size}` : ""}
                  </Typography>
                </Box>
                {isTeacher && !disabled && (
                  <Tooltip title="Remove from this list">
                    <IconButton
                      size="small"
                      aria-label={`Remove ${resource.title || "resource"}`}
                      onClick={() => handleDetach(resource)}
                      sx={{ color: lumi.color.onSurfaceVariant, "&:hover": { color: lumi.color.error } }}
                    >
                      <LumiIcon name="close" sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            );
          })}
        </Box>
      )}

      {/* Upload / pick UI — teachers only */}
      {isTeacher && !disabled && (
        <Box>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{
              mb: 1.5,
              minHeight: 36,
              borderBottom: `1px solid ${lumi.color.outlineVariant}`,
              "& .MuiTab-root": {
                color: lumi.color.onSurfaceVariant,
                textTransform: "none",
                fontFamily: lumi.font.body,
                minHeight: 36,
                py: 0.5,
              },
              "& .MuiTab-root.Mui-selected": { color: lumi.color.primary },
              "& .MuiTabs-indicator": { backgroundColor: lumi.color.primary },
            }}
          >
            <Tab label="Upload new" />
            <Tab label="My library" />
          </Tabs>

          {tab === 0 && (
            <Box>
              <Dropzone onDrop={handleFileDrop} />
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: selectedFiles.length ? 1 : 0 }}>
                {selectedFiles.map((f, i) => (
                  <Chip
                    key={i}
                    label={`${f.name} · ${humanFileSize(f.size)}`}
                    onDelete={() => handleRemoveSelected(f)}
                    sx={{
                      color: lumi.color.onSurface,
                      backgroundColor: lumi.color.surfaceContainerHigh,
                      "& .MuiChip-deleteIcon": { color: lumi.color.onSurfaceVariant },
                    }}
                  />
                ))}
              </Box>
              {selectedFiles.length > 0 && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 1.5 }}>
                  <PrimaryActionButton
                    icon={uploading ? undefined : "add"}
                    label={
                      uploading
                        ? "Uploading…"
                        : `Upload ${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""}`
                    }
                    onClick={handleUpload}
                    disabled={uploading}
                  />
                </Box>
              )}
            </Box>
          )}

          {tab === 1 && (
            <Box>
              <TextField
                placeholder="Search your library…"
                size="small"
                fullWidth
                value={libraryQuery}
                onChange={(e) => setLibraryQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadLibrary()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LumiIcon name="search" sx={{ fontSize: 18, color: lumi.color.onSurfaceVariant }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ ...fieldSx, mb: 1 }}
              />
              {libraryLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                  <CircularProgress size={24} sx={{ color: lumi.color.primary }} />
                </Box>
              ) : libraryResources.length === 0 ? (
                <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.onSurfaceVariant, fontStyle: "italic" }}>
                  No resources in your library yet.
                </Typography>
              ) : (
                libraryResources.map((r) => {
                  const attached = alreadyAttachedIds.has(r.id);
                  const size = humanFileSize(r.size_bytes);
                  return (
                    <Box
                      key={r.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                        py: 0.75,
                        borderBottom: `1px solid ${lumi.color.hairline}`,
                      }}
                    >
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.onSurface }} noWrap>
                          {r.title}
                        </Typography>
                        <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant }}>
                          {typeLabel(r)}
                          {size ? ` · ${size}` : ""}
                        </Typography>
                      </Box>
                      <Chip
                        label={attached ? "Attached" : "Attach"}
                        size="small"
                        clickable={!attached}
                        disabled={attached}
                        onClick={attached ? undefined : () => handleAttachFromLibrary(r)}
                        sx={{
                          ...lumiType.labelMd,
                          color: attached ? lumi.color.onSurfaceVariant : lumi.color.primary,
                          backgroundColor: attached
                            ? lumi.color.surfaceContainerHigh
                            : tint(lumi.color.primary, 0.15),
                          "&:hover": attached
                            ? undefined
                            : { backgroundColor: tint(lumi.color.primary, 0.25) },
                        }}
                      />
                    </Box>
                  );
                })
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ResourcePicker;
