import { BASE_URL } from "./agent";

/**
 * Resolve a media reference (profile picture, teaching resource, etc.) to a
 * fully-qualified URL the browser can load directly.
 *
 * The backend already returns absolute URLs for stored media — pointing at the
 * R2/CDN public domain when configured (MEDIA_PUBLIC_BASE_URL), or the Django
 * /media/ proxy otherwise. This helper is the single place the frontend trusts
 * those URLs: it passes through absolute (http/https), blob:, and data: URLs
 * untouched, and only prefixes the API base for legacy relative "/media/..."
 * values. Components should never hand-build a media URL from a bare storage
 * key — always route through here so the source of truth stays the backend.
 */
export function resolveMediaUrl(value) {
  if (!value) return "";
  if (/^(https?:|blob:|data:)/i.test(value)) return value;

  const base = (BASE_URL || "").replace(/\/+$/, "");
  const path = value.startsWith("/") ? value : `/${value}`;
  return `${base}${path}`;
}
