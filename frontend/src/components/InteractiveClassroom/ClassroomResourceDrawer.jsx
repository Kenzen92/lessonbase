import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  InputAdornment,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  convertToExcalidrawElements,
  CaptureUpdateAction,
  getDataURL,
  viewportCoordsToSceneCoords,
} from "@excalidraw/excalidraw";
import { toast } from "react-toastify";

import {
  lumi,
  lumiType,
  tint,
  LumiIcon,
  LumiDrawer,
  PrimaryActionButton,
  fieldSx,
} from "../luminous";
import { getToken } from "../../utils/tokenStorage";
import { resolveMediaUrl } from "../../utils/media";
import { humanFileSize } from "../../utils/format";

const BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;
const MAX_INSERT_DIM = 480; // largest edge of an inserted image, in scene units

// Mirrors backend ALLOWED_MIME_TYPES (apps/resources/models.py).
const UPLOAD_ACCEPT =
  "image/jpeg,image/png,image/gif,image/svg+xml,image/bmp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt";

const isImage = (resource) =>
  resource.kind !== "link" &&
  (resource.mime_type || "").startsWith("image/") &&
  Boolean(resource.file || resource.file_url);

function typeLabel(resource) {
  if (resource.kind === "link") return "LINK";
  const mime = (resource.mime_type || "").toLowerCase();
  if (mime.includes("pdf")) return "PDF";
  if (mime.startsWith("image/")) return (mime.split("/")[1] || "image").toUpperCase();
  return "FILE";
}

const loadImageDimensions = (dataURL) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = dataURL;
  });

const authHeaders = () => ({ Authorization: `Token ${getToken()}` });

// CDN/R2 media URLs can fail in the browser (domain not yet live, missing
// CORS rule on the bucket). The Django /media/ proxy serves the same storage
// key same-origin with the API, so derive it as a fallback fetch target.
const mediaProxyUrl = (url) => {
  if (!url || url.startsWith(BASE_URL)) return null;
  try {
    const { pathname } = new URL(url);
    return `${BASE_URL}/media${pathname}`;
  } catch {
    return null;
  }
};

const fetchMediaBlob = async (url) => {
  try {
    const res = await fetch(url);
    if (res.ok) return res.blob();
  } catch {
    /* fall through to the proxy */
  }
  const fallback = mediaProxyUrl(url);
  if (!fallback) throw new Error(`fetch failed: ${url}`);
  const res = await fetch(fallback);
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  return res.blob();
};

/**
 * In-classroom resource library, replacing Excalidraw's built-in library.
 *
 * Everyone in the class sees the resources attached to this class event;
 * teachers additionally get their personal library tab, can pin library items
 * to the class, and can upload files straight into the class from here.
 * Image resources insert onto the shared board (centred in the viewport);
 * everything else opens in a new tab.
 */
const ClassroomResourceDrawer = ({
  open,
  onClose,
  getBoardApi,
  classEventId,
  userRole,
}) => {
  const isTeacher = userRole === "teacher";

  const [tab, setTab] = useState(0); // 0 = class resources, 1 = my library
  const [classResources, setClassResources] = useState([]);
  const [classLoading, setClassLoading] = useState(false);
  const [libraryResources, setLibraryResources] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [insertingId, setInsertingId] = useState(null);
  const [attachingId, setAttachingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const classEndpoint = classEventId
    ? `${BASE_URL}/class-event/${classEventId}/resources/`
    : null;

  const loadClassResources = useCallback(async () => {
    if (!classEndpoint) return;
    setClassLoading(true);
    try {
      const res = await fetch(classEndpoint, { headers: authHeaders() });
      if (res.ok) setClassResources(await res.json());
    } catch {
      /* drawer just shows empty state */
    } finally {
      setClassLoading(false);
    }
  }, [classEndpoint]);

  const loadLibrary = useCallback(async () => {
    setLibraryLoading(true);
    try {
      const params = query ? `?q=${encodeURIComponent(query)}` : "";
      const res = await fetch(`${BASE_URL}/resources/${params}`, {
        headers: authHeaders(),
      });
      if (res.ok) setLibraryResources(await res.json());
    } catch {
      /* drawer just shows empty state */
    } finally {
      setLibraryLoading(false);
    }
  }, [query]);

  useEffect(() => {
    if (open) loadClassResources();
  }, [open, loadClassResources]);

  useEffect(() => {
    if (open && isTeacher && tab === 1) loadLibrary();
  }, [open, isTeacher, tab, loadLibrary]);

  const insertImage = async (resource) => {
    const api = getBoardApi?.();
    if (!api) return;
    setInsertingId(resource.id);
    try {
      const url = resolveMediaUrl(resource.file || resource.file_url);
      const blob = await fetchMediaBlob(url);
      const dataURL = await getDataURL(blob);
      const natural = await loadImageDimensions(dataURL);

      const scale = Math.min(
        1,
        MAX_INSERT_DIM / Math.max(natural.width, natural.height)
      );
      const width = Math.max(1, Math.round(natural.width * scale));
      const height = Math.max(1, Math.round(natural.height * scale));

      const fileId = `res-${resource.id}-${Date.now().toString(36)}`;
      api.addFiles([
        {
          id: fileId,
          dataURL,
          mimeType: blob.type || resource.mime_type || "image/png",
          created: Date.now(),
        },
      ]);

      // Centre of the visible canvas, in scene coordinates.
      const appState = api.getAppState();
      const centre = viewportCoordsToSceneCoords(
        {
          clientX: (appState.offsetLeft ?? 0) + appState.width / 2,
          clientY: (appState.offsetTop ?? 0) + appState.height / 2,
        },
        appState
      );

      const newElements = convertToExcalidrawElements([
        {
          type: "image",
          fileId,
          x: centre.x - width / 2,
          y: centre.y - height / 2,
          width,
          height,
        },
      ]);

      api.updateScene({
        elements: [...api.getSceneElementsIncludingDeleted(), ...newElements],
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });

      toast.success(`"${resource.title}" added to the board`);
      onClose?.();
    } catch (err) {
      console.error("Failed to insert resource image:", err);
      toast.error("Couldn't load that image onto the board");
    } finally {
      setInsertingId(null);
    }
  };

  // One request per file: the endpoint stores a single `file` per POST.
  const handleUploadFiles = async (files) => {
    if (!classEndpoint || files.length === 0) return;
    setUploading(true);
    let uploaded = 0;
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("file", file, file.name);
        const res = await fetch(classEndpoint, {
          method: "POST",
          headers: authHeaders(),
          body: formData,
        });
        if (res.ok) {
          uploaded += 1;
        } else {
          const err = await res.json().catch(() => ({}));
          toast.error(err.error || `Couldn't upload "${file.name}"`);
        }
      } catch {
        toast.error(`Couldn't upload "${file.name}"`);
      }
    }
    setUploading(false);
    if (uploaded > 0) {
      toast.success(`${uploaded} file${uploaded > 1 ? "s" : ""} added to the class`);
      loadClassResources();
    }
  };

  const attachToClass = async (resource) => {
    if (!classEndpoint) return;
    setAttachingId(resource.id);
    try {
      const res = await fetch(classEndpoint, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ resource_id: resource.id }),
      });
      if (res.ok) {
        toast.success(`"${resource.title}" added to class resources`);
        loadClassResources();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Couldn't add resource to the class");
      }
    } catch {
      toast.error("Couldn't add resource to the class");
    } finally {
      setAttachingId(null);
    }
  };

  const classResourceIds = new Set(classResources.map((r) => r.id));

  const renderResourceRow = (resource, { showAttach = false } = {}) => {
    const image = isImage(resource);
    const size = humanFileSize(resource.size_bytes);
    const url =
      resource.kind === "link"
        ? resource.url
        : resolveMediaUrl(resource.file || resource.file_url);
    const attached = classResourceIds.has(resource.id);
    return (
      <Box
        key={resource.id}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          py: 0.75,
          borderBottom: `1px solid ${lumi.color.hairline}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0, flex: 1 }}>
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
            <LumiIcon
              name={resource.kind === "link" ? "link" : "file"}
              sx={{ fontSize: 16 }}
            />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.onSurface }} noWrap>
              {resource.title || resource.original_name || "File"}
            </Typography>
            <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant }}>
              {typeLabel(resource)}
              {size ? ` · ${size}` : ""}
            </Typography>
          </Box>
        </Box>

        {showAttach && (
          <Tooltip title={attached ? "Already in class resources" : "Add to class resources"}>
            <span>
              <Chip
                data-testid={`attach-resource-${resource.id}`}
                label={
                  attached ? "In class" : attachingId === resource.id ? "Adding…" : "Pin to class"
                }
                size="small"
                clickable={!attached && attachingId === null}
                disabled={attached || attachingId !== null}
                onClick={attached ? undefined : () => attachToClass(resource)}
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
            </span>
          </Tooltip>
        )}

        {image ? (
          <Chip
            data-testid={`insert-resource-${resource.id}`}
            label={insertingId === resource.id ? "Adding…" : "Add to board"}
            size="small"
            clickable={insertingId === null}
            disabled={insertingId !== null}
            onClick={() => insertImage(resource)}
            sx={{
              ...lumiType.labelMd,
              color: lumi.color.primary,
              backgroundColor: tint(lumi.color.primary, 0.15),
              "&:hover": { backgroundColor: tint(lumi.color.primary, 0.25) },
            }}
          />
        ) : url ? (
          <Chip
            label="Open"
            size="small"
            clickable
            component="a"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              ...lumiType.labelMd,
              color: lumi.color.onSurfaceVariant,
              backgroundColor: lumi.color.surfaceContainerHigh,
            }}
          />
        ) : null}
      </Box>
    );
  };

  const renderList = (resources, loading, emptyText, rowOptions) =>
    loading ? (
      <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
        <CircularProgress size={24} sx={{ color: lumi.color.primary }} />
      </Box>
    ) : resources.length === 0 ? (
      <Typography
        sx={{ ...lumiType.bodyMd, color: lumi.color.onSurfaceVariant, fontStyle: "italic" }}
      >
        {emptyText}
      </Typography>
    ) : (
      resources.map((resource) => renderResourceRow(resource, rowOptions))
    );

  return (
    <LumiDrawer
      open={open}
      onClose={onClose}
      title={isTeacher ? "Teaching resources" : "Class resources"}
      subtitle="Images drop straight onto the board"
      width={400}
    >
      {isTeacher && (
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
          <Tab label="Class resources" />
          <Tab label="My library" />
        </Tabs>
      )}

      {(!isTeacher || tab === 0) && (
        <Box>
          {isTeacher && (
            <Box sx={{ mb: 1.5 }}>
              <input
                ref={fileInputRef}
                data-testid="classroom-upload-input"
                type="file"
                hidden
                multiple
                accept={UPLOAD_ACCEPT}
                onChange={(e) => {
                  handleUploadFiles([...e.target.files]);
                  e.target.value = "";
                }}
              />
              <PrimaryActionButton
                data-testid="classroom-upload-btn"
                icon={uploading ? undefined : "upload"}
                label={uploading ? "Uploading…" : "Upload to class"}
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                sx={{ width: "100%" }}
              />
            </Box>
          )}
          {renderList(
            classResources,
            classLoading,
            isTeacher
              ? "No resources attached to this class yet — upload one above, or pin one from your library."
              : "No class resources yet.",
            {}
          )}
        </Box>
      )}

      {isTeacher && tab === 1 && (
        <Box>
          <TextField
            placeholder="Search your library…"
            size="small"
            fullWidth
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadLibrary()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LumiIcon
                    name="search"
                    sx={{ fontSize: 18, color: lumi.color.onSurfaceVariant }}
                  />
                </InputAdornment>
              ),
            }}
            sx={{ ...fieldSx, mb: 1.5 }}
          />
          {renderList(
            libraryResources,
            libraryLoading,
            "No resources in your library yet.",
            { showAttach: true }
          )}
        </Box>
      )}
    </LumiDrawer>
  );
};

export default ClassroomResourceDrawer;
