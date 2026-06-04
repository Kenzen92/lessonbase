import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  InputAdornment,
  Chip,
  CircularProgress,
  Tab,
  Tabs,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { FaSearch, FaUpload, FaLink, FaFile, FaTrash, FaUndo, FaDownload } from "react-icons/fa";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/auth_context";
import Dropzone from "../components/Resources/dropzone";
import { getToken } from "../utils/tokenStorage";
import { resolveMediaUrl } from "../utils/media";
import Navigation from "../components/main_navigation";

const BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

function getAuthHeaders(json = false) {
  const h = { Authorization: `Token ${getToken()}` };
  if (json) h["Content-Type"] = "application/json";
  return h;
}

const KindIcon = ({ kind }) =>
  kind === "link" ? <FaLink size={16} color="#64b5f6" /> : <FaFile size={16} color="#81c784" />;

function ResourceCard({ resource, onDelete, onRestore, trashed }) {
  const url =
    resource.kind === "link"
      ? resource.url
      : resolveMediaUrl(resource.file || resource.file_url);

  return (
    <Card
      sx={{
        backgroundColor: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#fff",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <KindIcon kind={resource.kind} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, wordBreak: "break-all" }}>
            {resource.title}
          </Typography>
        </Box>
        {resource.description && (
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", mb: 1 }}>
            {resource.description}
          </Typography>
        )}
        {resource.mime_type && (
          <Chip
            label={resource.mime_type.split("/")[1]?.toUpperCase()}
            size="small"
            sx={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#fff", mr: 0.5 }}
          />
        )}
        {resource.subject_name && (
          <Chip
            label={resource.subject_name}
            size="small"
            sx={{ backgroundColor: "rgba(33,150,243,0.2)", color: "#64b5f6" }}
          />
        )}
      </CardContent>
      <CardActions>
        {!trashed && url && (
          <Tooltip title="Open / download">
            <IconButton
              component="a"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              download={resource.kind !== "link" ? resource.original_name || resource.title : undefined}
              size="small"
              sx={{ color: "rgba(255,255,255,0.7)" }}
            >
              <FaDownload />
            </IconButton>
          </Tooltip>
        )}
        {!trashed ? (
          <Tooltip title="Delete">
            <IconButton size="small" sx={{ color: "#ef5350" }} onClick={() => onDelete(resource)}>
              <FaTrash />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Restore">
            <IconButton size="small" sx={{ color: "#81c784" }} onClick={() => onRestore(resource)}>
              <FaUndo />
            </IconButton>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );
}

export default function ResourcesPage() {
  const { auth } = useAuth();
  const isTeacher = auth.userType === "teacher";

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trashTab, setTrashTab] = useState(false);
  const [query, setQuery] = useState("");

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkMode, setLinkMode] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadResources = useCallback(async () => {
    setLoading(true);
    try {
      const params = [];
      if (query) params.push(`q=${encodeURIComponent(query)}`);
      const qs = params.length ? "?" + params.join("&") : "";
      const url = isTeacher
        ? `${BASE_URL}/resources/${qs}`
        : `${BASE_URL}/resources/shared/`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.ok) setResources(await res.json());
    } catch {
      toast.error("Could not load resources");
    } finally {
      setLoading(false);
    }
  }, [isTeacher, query]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const handleDelete = async (resource) => {
    const res = await fetch(`${BASE_URL}/resources/${resource.id}/`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (res.ok || res.status === 204) {
      toast.success(`"${resource.title}" deleted`);
      loadResources();
    } else {
      toast.error("Could not delete resource");
    }
  };

  const handleRestore = async (resource) => {
    const res = await fetch(`${BASE_URL}/resources/${resource.id}/restore/`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      toast.success(`"${resource.title}" restored`);
      loadResources();
    }
  };

  const handleUpload = async () => {
    setUploading(true);
    try {
      if (linkMode) {
        if (!linkUrl) { toast.error("URL is required"); return; }
        const res = await fetch(`${BASE_URL}/resources/`, {
          method: "POST",
          headers: getAuthHeaders(true),
          body: JSON.stringify({ kind: "link", url: linkUrl, title: linkTitle || linkUrl }),
        });
        if (res.ok || res.status === 201) {
          toast.success("Link added");
          setLinkUrl(""); setLinkTitle(""); setUploadDialogOpen(false);
          loadResources();
        }
      } else {
        for (const file of uploadFiles) {
          const fd = new FormData();
          fd.append("kind", "file");
          fd.append("file", file, file.name);
          await fetch(`${BASE_URL}/resources/`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: fd,
          });
        }
        toast.success(`${uploadFiles.length} file(s) uploaded`);
        setUploadFiles([]); setUploadDialogOpen(false);
        loadResources();
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#0a0a1a", color: "#fff" }}>
      <Navigation />
      <Box sx={{ p: 3, maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {isTeacher ? "Resource Library" : "My Resources"}
          </Typography>
          {isTeacher && (
            <Button
              variant="contained"
              startIcon={<FaUpload />}
              onClick={() => setUploadDialogOpen(true)}
              sx={{ background: "linear-gradient(135deg, #2196F3 0%, #1976D2 100%)" }}
            >
              Add Resource
            </Button>
          )}
        </Box>

        {/* Search */}
        <TextField
          placeholder="Search resources…"
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && loadResources()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FaSearch color="#bdbdbd" />
              </InputAdornment>
            ),
            style: { color: "#fff" },
          }}
          sx={{
            mb: 2,
            "& .MuiOutlinedInput-root fieldset": { borderColor: "rgba(255,255,255,0.2)" },
          }}
        />

        {/* Trash toggle (teachers) */}
        {isTeacher && (
          <Box sx={{ mb: 2 }}>
            <Button
              variant={trashTab ? "contained" : "outlined"}
              size="small"
              startIcon={<FaTrash />}
              onClick={() => setTrashTab((v) => !v)}
              sx={{ color: trashTab ? "#fff" : "rgba(255,255,255,0.6)" }}
            >
              {trashTab ? "Hide trash" : "Show trash"}
            </Button>
          </Box>
        )}

        {/* Resource grid */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : resources.length === 0 ? (
          <Typography sx={{ color: "rgba(255,255,255,0.5)", textAlign: "center", py: 6 }}>
            {isTeacher
              ? "No resources yet. Use the Add Resource button to upload a file or add a link."
              : "No resources shared with you yet."}
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {resources.map((r) => (
              <Grid key={r.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <ResourceCard
                  resource={r}
                  onDelete={handleDelete}
                  onRestore={handleRestore}
                  trashed={false}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Upload dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        PaperProps={{
          sx: {
            background: "linear-gradient(135deg, #10101d 0%, #0a132b 100%)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
            minWidth: 400,
          },
        }}
      >
        <DialogTitle>Add Resource</DialogTitle>
        <DialogContent>
          <Tabs
            value={linkMode ? 1 : 0}
            onChange={(_, v) => setLinkMode(v === 1)}
            sx={{ mb: 2, borderBottom: "1px solid rgba(255,255,255,0.1)" }}
          >
            <Tab label="Upload File" sx={{ color: "rgba(255,255,255,0.7)" }} />
            <Tab label="Add Link" sx={{ color: "rgba(255,255,255,0.7)" }} />
          </Tabs>

          {!linkMode ? (
            <>
              <Dropzone onDrop={(files) => setUploadFiles((prev) => [...prev, ...files])} />
              {uploadFiles.map((f, i) => (
                <Chip
                  key={i}
                  label={f.name}
                  onDelete={() =>
                    setUploadFiles((prev) => prev.filter((_, idx) => idx !== i))
                  }
                  sx={{ mt: 0.5, color: "#fff" }}
                />
              ))}
            </>
          ) : (
            <>
              <TextField
                label="URL"
                fullWidth
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                sx={{ mb: 2, "& input": { color: "#fff" } }}
                InputLabelProps={{ style: { color: "rgba(255,255,255,0.7)" } }}
              />
              <TextField
                label="Title (optional)"
                fullWidth
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                sx={{ "& input": { color: "#fff" } }}
                InputLabelProps={{ style: { color: "rgba(255,255,255,0.7)" } }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} sx={{ color: "rgba(255,255,255,0.7)" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={uploading || (!linkMode && uploadFiles.length === 0)}
            startIcon={uploading ? <CircularProgress size={16} /> : <FaUpload />}
          >
            {linkMode ? "Add link" : `Upload ${uploadFiles.length || ""}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
