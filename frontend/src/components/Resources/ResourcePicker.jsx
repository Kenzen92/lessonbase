import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Chip,
  Button,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  CircularProgress,
  Link,
} from "@mui/material";
import { FaSearch, FaUpload, FaLink, FaFile } from "react-icons/fa";
import { toast } from "react-toastify";
import Dropzone from "./dropzone";
import { getToken } from "../../utils/tokenStorage";
import { resolveMediaUrl } from "../../utils/media";

const BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

const CONTEXT_ENDPOINTS = {
  "class-event": (id) => `${BASE_URL}/class-event/${id}/resources/`,
  assignment: (id) => `${BASE_URL}/assignment/${id}/materials/`,
};

function getAuthHeaders() {
  return { Authorization: `Token ${getToken()}` };
}

/**
 * ResourcePicker — replaces the old ClassResources component.
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
        toast.error("Could not attach resource");
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
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", mt: 1, mb: 1 }}>
          No files attached yet.
        </Typography>
      ) : (
        <Box sx={{ mb: 1 }}>
          {value.map((resource, i) => (
            <Chip
              key={resource.id ?? i}
              icon={resource.kind === "link" ? <FaLink size={12} /> : <FaFile size={12} />}
              label={
                <Link
                  href={resourceUrl(resource)}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={resource.kind !== "link" ? resource.original_name || resource.title : undefined}
                  sx={{ color: "inherit", textDecoration: "none" }}
                >
                  {resource.title || resource.original_name || "File"}
                </Link>
              }
              onDelete={isTeacher && !disabled ? () => handleDetach(resource) : undefined}
              color="primary"
              sx={{ m: "0.25rem", width: "100%", justifyContent: "space-between" }}
            />
          ))}
        </Box>
      )}

      {/* Upload / pick UI — teachers only */}
      {isTeacher && !disabled && (
        <Box>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            textColor="inherit"
            sx={{ borderBottom: "1px solid rgba(255,255,255,0.1)", mb: 1 }}
          >
            <Tab label="Upload new" sx={{ color: "rgba(255,255,255,0.7)" }} />
            <Tab label="My library" sx={{ color: "rgba(255,255,255,0.7)" }} />
          </Tabs>

          {tab === 0 && (
            <Box>
              <Dropzone onDrop={handleFileDrop} />
              {selectedFiles.map((f, i) => (
                <Chip
                  key={i}
                  label={f.name}
                  onDelete={() => handleRemoveSelected(f)}
                  color="secondary"
                  sx={{ m: "0.25rem", width: "100%", justifyContent: "space-between" }}
                />
              ))}
              {selectedFiles.length > 0 && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                  <Button
                    variant="contained"
                    onClick={handleUpload}
                    disabled={uploading}
                    startIcon={uploading ? <CircularProgress size={16} /> : <FaUpload />}
                    sx={{ width: 200 }}
                  >
                    Upload {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""}
                  </Button>
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
                      <FaSearch color="#bdbdbd" />
                    </InputAdornment>
                  ),
                  style: { color: "#fff" },
                }}
                sx={{
                  mb: 1,
                  "& .MuiOutlinedInput-root fieldset": {
                    borderColor: "rgba(255,255,255,0.2)",
                  },
                }}
              />
              {libraryLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : libraryResources.length === 0 ? (
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)" }}>
                  No resources in your library yet.
                </Typography>
              ) : (
                libraryResources.map((r) => (
                  <Box
                    key={r.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      py: 0.5,
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <Typography variant="body2" sx={{ color: "#fff", flex: 1 }}>
                      {r.title}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={alreadyAttachedIds.has(r.id)}
                      onClick={() => handleAttachFromLibrary(r)}
                      sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)", ml: 1 }}
                    >
                      {alreadyAttachedIds.has(r.id) ? "Attached" : "Attach"}
                    </Button>
                  </Box>
                ))
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ResourcePicker;
