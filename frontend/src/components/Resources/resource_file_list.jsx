import { Box, Typography } from "@mui/material";

import { lumi, lumiType, tint, LumiIcon } from "../luminous";
import { resolveMediaUrl } from "../../utils/media";
import { humanFileSize } from "../../utils/format";

// Short type label for the meta line (PDF, DOCX, PNG…).
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
 * Read-only Luminous list of resource files — each row an icon badge, a
 * downloadable title, and a type/size meta line. Shared by the submission
 * and feedback file lists.
 */
export default function ResourceFileList({ files = [], emptyMessage = "No files.", accent = "primary" }) {
  if (files.length === 0) {
    return (
      <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.onSurfaceVariant, fontStyle: "italic" }}>
        {emptyMessage}
      </Typography>
    );
  }

  const accentSolid = accent === "tertiary" ? lumi.color.tertiary : lumi.color.primary;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {files.map((resource, i) => {
        const url =
          resource.kind === "link"
            ? resource.url
            : resolveMediaUrl(resource.file || resource.file_url);
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
                backgroundColor: tint(accentSolid, 0.15),
                color: accentSolid,
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
                  "&:hover": url ? { color: accentSolid } : undefined,
                }}
              >
                {resource.title || resource.original_name || "File"}
              </Typography>
              <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant }}>
                {typeLabel(resource)}
                {size ? ` · ${size}` : ""}
              </Typography>
            </Box>
            {url && (
              <LumiIcon
                name="download"
                aria-hidden
                sx={{ fontSize: 16, color: lumi.color.onSurfaceVariant }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}
