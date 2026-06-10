import { Box, Typography, IconButton, Tooltip } from "@mui/material";

import { lumi, lumiType, tint, LumiIcon, SubjectChip, StripCard, accentColor } from "../luminous";
import { resolveMediaUrl } from "../../utils/media";
import { humanFileSize } from "../../utils/format";

// Friendly short labels for office mime types whose subtype is unreadable
// (e.g. "vnd.openxmlformats-officedocument.wordprocessingml.document").
const MIME_LABELS = {
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/vnd.ms-excel": "XLS",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "application/vnd.ms-powerpoint": "PPT",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
  "text/plain": "TXT",
};

// Resolve a resource to an accent + a short mono type label + icon.
function resourceMeta(resource) {
  if (resource.kind === "link") {
    return { accent: "violet", typeLabel: "LINK", icon: "link" };
  }
  const mime = (resource.mime_type || "").toLowerCase();
  const sub = mime.split("/")[1];
  if (mime.includes("pdf")) return { accent: "error", typeLabel: "PDF", icon: "file" };
  if (mime.startsWith("image/")) return { accent: "primary", typeLabel: (sub || "image").toUpperCase(), icon: "file" };
  if (mime.startsWith("text/")) return { accent: "tertiary", typeLabel: MIME_LABELS[mime] || (sub || "text").toUpperCase(), icon: "file" };
  return { accent: "amber", typeLabel: MIME_LABELS[mime] || (sub || "file").toUpperCase(), icon: "file" };
}

// Coarse bucket for the filter bar (Images, not PNG/JPG individually).
export function resourceCategory(resource) {
  if (resource.kind === "link") return { id: "LINK", label: "Links", color: lumi.color.violet };
  const mime = (resource.mime_type || "").toLowerCase();
  if (mime.includes("pdf")) return { id: "PDF", label: "PDF", color: lumi.color.error };
  if (mime.startsWith("image/")) return { id: "IMAGE", label: "Images", color: lumi.color.primary };
  if (mime.startsWith("text/")) return { id: "TEXT", label: "Text", color: lumi.color.tertiary };
  if (MIME_LABELS[mime]) return { id: "DOC", label: "Documents", color: lumi.color.amber };
  return { id: "OTHER", label: "Other", color: lumi.color.amber };
}

// Compose a best-effort "size · updated" meta line from whatever fields exist.
function metaLine(resource) {
  const size = humanFileSize(resource.size_bytes ?? resource.size ?? resource.file_size);
  const stamp = resource.updated_at || resource.created_at || resource.uploaded_at;
  let when = null;
  if (stamp) {
    const d = new Date(stamp);
    if (!Number.isNaN(d.getTime())) when = d.toLocaleDateString();
  }
  return [size, when].filter(Boolean).join(" · ");
}

function resourceUrl(resource) {
  return resource.kind === "link"
    ? resource.url
    : resolveMediaUrl(resource.file || resource.file_url);
}

function ActionIcons({ resource, url, trashed, onDelete, onRestore }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      {!trashed && url && (
        <Tooltip title="Open / download">
          <IconButton
            component="a"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            download={resource.kind !== "link" ? resource.original_name || resource.title : undefined}
            size="small"
            onClick={(e) => e.stopPropagation()}
            sx={{ color: lumi.color.onSurfaceVariant, "&:hover": { color: lumi.color.primary } }}
          >
            <LumiIcon name="download" sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      )}
      {!trashed ? (
        <Tooltip title="Delete">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(resource);
            }}
            sx={{ color: lumi.color.onSurfaceVariant, "&:hover": { color: lumi.color.error } }}
          >
            <LumiIcon name="delete" sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title="Restore">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onRestore?.(resource);
            }}
            sx={{ color: lumi.color.onSurfaceVariant, "&:hover": { color: lumi.color.tertiary } }}
          >
            <LumiIcon name="restore" sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}

/**
 * Luminous resource card. `layout="grid"` (default) renders a StripCard with a
 * file-type strip; `layout="list"` renders a compact full-width row. Keeps the
 * legacy handler props (`onDelete`, `onRestore`, `trashed`).
 */
export default function ResourceCard({ resource, onDelete, onRestore, trashed = false, layout = "grid" }) {
  const { accent, typeLabel, icon } = resourceMeta(resource);
  const a = accentColor(accent);
  const url = resourceUrl(resource);
  const meta = metaLine(resource);

  const iconBadge = (
    <Box
      sx={{
        width: 36,
        height: 36,
        flexShrink: 0,
        borderRadius: lumi.radius.md,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: tint(a.solid, 0.15),
        color: a.text,
      }}
    >
      <LumiIcon name={icon} sx={{ fontSize: 20 }} />
    </Box>
  );

  if (layout === "list") {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          px: 2.5,
          py: 1.5,
          borderRadius: lumi.radius.card,
          backgroundColor: lumi.color.surfaceContainer,
          border: `1px solid ${lumi.color.hairline}`,
          borderLeft: `4px solid ${a.solid}`,
          "&:hover": { backgroundColor: lumi.color.surfaceContainerHigh },
        }}
      >
        {iconBadge}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ ...lumiType.bodyMd, fontWeight: 700, color: lumi.color.onSurface }} noWrap>
            {resource.title}
          </Typography>
          <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant }} noWrap>
            {typeLabel}
            {meta ? ` · ${meta}` : ""}
          </Typography>
        </Box>
        {resource.subject_name && <SubjectChip label={resource.subject_name} accent="primary" />}
        <ActionIcons resource={resource} url={url} trashed={trashed} onDelete={onDelete} onRestore={onRestore} />
      </Box>
    );
  }

  return (
    <StripCard accent={accent} hover sx={{ height: "100%" }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, height: "100%" }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
          {iconBadge}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ ...lumiType.bodyMd, fontWeight: 700, color: lumi.color.onSurface }} noWrap>
              {resource.title}
            </Typography>
            <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant }}>
              {typeLabel}
            </Typography>
          </Box>
        </Box>

        {resource.subject_name && (
          <Box>
            <SubjectChip label={resource.subject_name} accent="primary" />
          </Box>
        )}

        <Box
          sx={{
            mt: "auto",
            pt: 1.5,
            borderTop: `1px solid ${tint(lumi.color.outlineVariant, 0.5)}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant }} noWrap>
            {meta || " "}
          </Typography>
          <ActionIcons resource={resource} url={url} trashed={trashed} onDelete={onDelete} onRestore={onRestore} />
        </Box>
      </Box>
    </StripCard>
  );
}
