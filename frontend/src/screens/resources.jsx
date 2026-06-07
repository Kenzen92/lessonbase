import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Button,
  TextField,
  Chip,
  CircularProgress,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { FaUpload } from "react-icons/fa";
import { toast } from "react-toastify";

import { AppShell, PageHeader, FilterBar, ViewToggle, EmptyState, lumi } from "../components/luminous";
import ResourceCard, { resourceCategory } from "../components/Resources/resource_card";
import Dropzone from "../components/Resources/dropzone";
import { useAuth } from "../contexts/auth_context";
import { useUser } from "../contexts/user_context";
import { getToken } from "../utils/tokenStorage";
import { resolveMediaUrl } from "../utils/media";

const BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

function getAuthHeaders(json = false) {
  const h = { Authorization: `Token ${getToken()}` };
  if (json) h["Content-Type"] = "application/json";
  return h;
}

export default function ResourcesPage() {
  const { auth } = useAuth();
  const { firstName, profilePicture } = useUser();
  const isTeacher = auth.userType === "teacher";

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [view, setView] = useState("grid");
  const [typeFilters, setTypeFilters] = useState([]);

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkMode, setLinkMode] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadResources = useCallback(async () => {
    setLoading(true);
    try {
      const qs = query ? `?q=${encodeURIComponent(query)}` : "";
      const url = isTeacher ? `${BASE_URL}/resources/${qs}` : `${BASE_URL}/resources/shared/`;
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

  // Distinct type chips present in the current result set.
  const typeChips = useMemo(() => {
    const byId = new Map();
    resources.forEach((r) => {
      const c = resourceCategory(r);
      if (!byId.has(c.id)) byId.set(c.id, c);
    });
    return [...byId.values()];
  }, [resources]);

  const visibleResources = useMemo(() => {
    if (typeFilters.length === 0) return resources;
    return resources.filter((r) => typeFilters.includes(resourceCategory(r).id));
  }, [resources, typeFilters]);

  const toggleType = (id) =>
    setTypeFilters((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

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
        if (!linkUrl) {
          toast.error("URL is required");
          return;
        }
        const res = await fetch(`${BASE_URL}/resources/`, {
          method: "POST",
          headers: getAuthHeaders(true),
          body: JSON.stringify({ kind: "link", url: linkUrl, title: linkTitle || linkUrl }),
        });
        if (res.ok || res.status === 201) {
          toast.success("Link added");
          setLinkUrl("");
          setLinkTitle("");
          setUploadDialogOpen(false);
          loadResources();
        }
      } else {
        for (const file of uploadFiles) {
          const fd = new FormData();
          fd.append("kind", "file");
          fd.append("file", file, file.name);
          await fetch(`${BASE_URL}/resources/`, { method: "POST", headers: getAuthHeaders(), body: fd });
        }
        toast.success(`${uploadFiles.length} file(s) uploaded`);
        setUploadFiles([]);
        setUploadDialogOpen(false);
        loadResources();
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppShell
      activeNav="resources"
      user={{ userName: firstName, avatarUrl: resolveMediaUrl(profilePicture) }}
      search={{ placeholder: "Search resources…", value: query, onChange: setQuery }}
      onCreateNew={isTeacher ? () => setUploadDialogOpen(true) : undefined}
    >
      <PageHeader
        title={isTeacher ? "Resource Library" : "My Resources"}
        subtitle="Manage and organize teaching materials, documents, and assets for your classes."
        action={
          isTeacher
            ? { label: "Add Resource", icon: "add", onClick: () => setUploadDialogOpen(true) }
            : undefined
        }
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <FilterBar
            chips={typeChips}
            selected={typeFilters}
            onToggle={toggleType}
            onClear={() => setTypeFilters([])}
            label="Filter by type"
          />
          <ViewToggle value={view} onChange={setView} />
        </Box>
      </PageHeader>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: lumi.color.primary }} />
        </Box>
      ) : visibleResources.length === 0 ? (
        <EmptyState
          icon="folder_open"
          message={
            query || typeFilters.length
              ? "No resources match your filters."
              : isTeacher
              ? "No resources yet. Use Add Resource to upload a file or add a link."
              : "No resources shared with you yet."
          }
        />
      ) : view === "grid" ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" },
            gap: 2.5,
          }}
        >
          {visibleResources.map((r) => (
            <ResourceCard key={r.id} resource={r} onDelete={handleDelete} onRestore={handleRestore} layout="grid" />
          ))}
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {visibleResources.map((r) => (
            <ResourceCard key={r.id} resource={r} onDelete={handleDelete} onRestore={handleRestore} layout="list" />
          ))}
        </Box>
      )}

      {/* Upload dialog — kept as-is; restyled in the Phase 6 overlay pass. */}
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
                  onDelete={() => setUploadFiles((prev) => prev.filter((_, idx) => idx !== i))}
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
    </AppShell>
  );
}
