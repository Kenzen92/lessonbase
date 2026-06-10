import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  InputAdornment,
  TextField,
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
  fieldSx,
} from "../luminous";
import { getToken } from "../../utils/tokenStorage";
import { resolveMediaUrl } from "../../utils/media";
import { humanFileSize } from "../../utils/format";

const BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;
const MAX_INSERT_DIM = 480; // largest edge of an inserted image, in scene units

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

/**
 * Teacher's resource library, surfaced inside the classroom. Image resources
 * insert straight onto the shared board (centred in the current viewport);
 * everything else opens in a new tab.
 */
const ClassroomResourceDrawer = ({ open, onClose, getBoardApi }) => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [insertingId, setInsertingId] = useState(null);

  const loadLibrary = useCallback(async () => {
    setLoading(true);
    try {
      const params = query ? `?q=${encodeURIComponent(query)}` : "";
      const res = await fetch(`${BASE_URL}/resources/${params}`, {
        headers: { Authorization: `Token ${getToken()}` },
      });
      if (res.ok) setResources(await res.json());
    } catch {
      /* drawer just shows empty state */
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    if (open) loadLibrary();
  }, [open, loadLibrary]);

  const insertImage = async (resource) => {
    const api = getBoardApi?.();
    if (!api) return;
    setInsertingId(resource.id);
    try {
      const url = resolveMediaUrl(resource.file || resource.file_url);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
      const blob = await res.blob();
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

  return (
    <LumiDrawer
      open={open}
      onClose={onClose}
      title="Teaching resources"
      subtitle="Images drop straight onto the board"
      width={400}
    >
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
              <LumiIcon name="search" sx={{ fontSize: 18, color: lumi.color.onSurfaceVariant }} />
            </InputAdornment>
          ),
        }}
        sx={{ ...fieldSx, mb: 1.5 }}
      />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
          <CircularProgress size={24} sx={{ color: lumi.color.primary }} />
        </Box>
      ) : resources.length === 0 ? (
        <Typography
          sx={{ ...lumiType.bodyMd, color: lumi.color.onSurfaceVariant, fontStyle: "italic" }}
        >
          No resources in your library yet.
        </Typography>
      ) : (
        resources.map((resource) => {
          const image = isImage(resource);
          const size = humanFileSize(resource.size_bytes);
          const url =
            resource.kind === "link"
              ? resource.url
              : resolveMediaUrl(resource.file || resource.file_url);
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
        })
      )}
    </LumiDrawer>
  );
};

export default ClassroomResourceDrawer;
