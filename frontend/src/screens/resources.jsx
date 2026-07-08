import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Button, TextField, Chip, CircularProgress, Tab, Tabs } from "@mui/material";
import { toast } from "react-toastify";

import {
  AppShell,
  PageHeader,
  FilterBar,
  ViewToggle,
  EmptyState,
  LumiModal,
  PrimaryActionButton,
  StorageMeter,
  fieldSx,
  lumi,
  lumiType,
} from "../components/luminous";
import ResourceCard, { resourceCategory } from "../components/Resources/resource_card";
import Dropzone from "../components/Resources/dropzone";
import { useAuth } from "../contexts/auth_context";
import { useUser } from "../contexts/user_context";
import { getToken } from "../utils/tokenStorage";
import { resolveMediaUrl } from "../utils/media";
import { humanFileSize } from "../utils/format";
import { extractApiError } from "../utils/apiError";

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

  const [storage, setStorage] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadStorage = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/resources/storage/`, { headers: getAuthHeaders() });
      if (res.ok) setStorage(await res.json());
    } catch {
      /* meter is non-critical; leave hidden on failure */
    }
  }, []);

  useEffect(() => {
    loadStorage();
  }, [loadStorage]);

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

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${BASE_URL}/resources/${deleteTarget.id}/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok || res.status === 204) {
        toast.success(`"${deleteTarget.title}" deleted`);
        setDeleteTarget(null);
        loadResources();
        loadStorage();
      } else {
        toast.error(await extractApiError(res, "Could not delete resource"));
      }
    } catch {
      toast.error("Could not delete resource");
    } finally {
      setDeleting(false);
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
      loadStorage();
    }
  };

  // Client-side mirror of the server limits, so users get instant feedback
  // instead of a failed request. The server remains the source of truth.
  const uploadBlockedReason = () => {
    if (!storage) return null;
    const oversize = uploadFiles.find((f) => f.size > storage.max_file_bytes);
    if (oversize) {
      return `"${oversize.name}" is too large — individual files are limited to ${humanFileSize(
        storage.max_file_bytes
      )}.`;
    }
    const incoming = uploadFiles.reduce((sum, f) => sum + f.size, 0);
    if (storage.used_bytes + incoming > storage.limit_bytes) {
      return `Not enough storage space — this upload needs ${humanFileSize(
        incoming
      )} but only ${humanFileSize(storage.remaining_bytes)} is free.`;
    }
    return null;
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
        } else {
          toast.error(await extractApiError(res, "Could not add link"));
        }
      } else {
        const blocked = uploadBlockedReason();
        if (blocked) {
          toast.error(blocked);
          return;
        }
        let uploaded = 0;
        for (const file of uploadFiles) {
          const fd = new FormData();
          fd.append("kind", "file");
          fd.append("file", file, file.name);
          const res = await fetch(`${BASE_URL}/resources/`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: fd,
          });
          if (res.ok || res.status === 201) {
            uploaded += 1;
          } else {
            toast.error(await extractApiError(res, `Could not upload "${file.name}"`));
          }
        }
        if (uploaded > 0) {
          toast.success(`${uploaded} file(s) uploaded`);
          setUploadFiles([]);
          setUploadDialogOpen(false);
          loadResources();
          loadStorage();
        }
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
        subtitle={
          isTeacher
            ? "Manage and organize teaching materials, documents, and assets for your classes."
            : "Materials your teachers have shared with your classes and assignments."
        }
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
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 3 }}>
            {storage && (
              <StorageMeter usedBytes={storage.used_bytes} limitBytes={storage.limit_bytes} />
            )}
            <ViewToggle value={view} onChange={setView} />
          </Box>
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
            <ResourceCard key={r.id} resource={r} onDelete={setDeleteTarget} onRestore={handleRestore} layout="grid" />
          ))}
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {visibleResources.map((r) => (
            <ResourceCard key={r.id} resource={r} onDelete={setDeleteTarget} onRestore={handleRestore} layout="list" />
          ))}
        </Box>
      )}

      {/* Upload dialog on the shared LumiModal shell. */}
      <LumiModal
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        title="Add Resource"
        actions={
          <>
            <Button onClick={() => setUploadDialogOpen(false)} sx={{ color: lumi.color.onSurfaceVariant }}>
              Cancel
            </Button>
            <PrimaryActionButton
              icon={uploading ? undefined : "add"}
              label={uploading ? "Uploading…" : linkMode ? "Add link" : `Upload ${uploadFiles.length || ""}`}
              onClick={handleUpload}
              disabled={uploading || (!linkMode && uploadFiles.length === 0)}
            />
          </>
        }
      >
        <Tabs
          value={linkMode ? 1 : 0}
          onChange={(_, v) => setLinkMode(v === 1)}
          sx={{
            mb: 2,
            borderBottom: `1px solid ${lumi.color.outlineVariant}`,
            "& .MuiTab-root": { color: lumi.color.onSurfaceVariant, textTransform: "none", fontFamily: lumi.font.body },
            "& .MuiTab-root.Mui-selected": { color: lumi.color.primary },
            "& .MuiTabs-indicator": { backgroundColor: lumi.color.primary },
          }}
        >
          <Tab label="Upload File" />
          <Tab label="Add Link" />
        </Tabs>

        {!linkMode ? (
          <>
            <Dropzone onDrop={(files) => setUploadFiles((prev) => [...prev, ...files])} />
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
              {uploadFiles.map((f, i) => (
                <Chip
                  key={i}
                  label={`${f.name} · ${humanFileSize(f.size)}`}
                  onDelete={() => setUploadFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  sx={{
                    color: lumi.color.onSurface,
                    backgroundColor: lumi.color.surfaceContainerHigh,
                    "& .MuiChip-deleteIcon": { color: lumi.color.onSurfaceVariant },
                  }}
                />
              ))}
            </Box>
          </>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="URL"
              fullWidth
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              sx={fieldSx}
            />
            <TextField
              label="Title (optional)"
              fullWidth
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              sx={fieldSx}
            />
          </Box>
        )}
      </LumiModal>

      {/* Delete confirmation. */}
      <LumiModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete resource?"
        maxWidth="xs"
        actions={
          <>
            <Button onClick={() => setDeleteTarget(null)} sx={{ color: lumi.color.onSurfaceVariant }}>
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleting}
              sx={{
                ...lumiType.buttonText,
                px: 2.5,
                borderRadius: lumi.radius.md,
                color: lumi.color.onErrorContainer,
                backgroundColor: lumi.color.errorContainer,
                "&:hover": { backgroundColor: lumi.color.errorContainer, filter: "brightness(1.15)" },
              }}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </>
        }
      >
        {deleteTarget && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Box component="p" sx={{ ...lumiType.bodyMd, color: lumi.color.onSurface, m: 0 }}>
              {`"${deleteTarget.title}" will be removed from your library`}
              {deleteTarget.kind === "file" && typeof deleteTarget.size_bytes === "number"
                ? `, freeing ${humanFileSize(deleteTarget.size_bytes)} of storage.`
                : "."}
            </Box>
            <Box component="p" sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant, m: 0 }}>
              Classes and assignments using it will lose access.
            </Box>
          </Box>
        )}
      </LumiModal>
    </AppShell>
  );
}
