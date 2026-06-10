// Pull the most specific human-readable message out of a DRF error response.
// Handles {"error": "..."}, {"detail": "..."}, and serializer field errors
// like {"files": ["..."]} / {"file": ["..."]}. Falls back when the body is
// empty or not JSON.
export async function extractApiError(res, fallback) {
  try {
    const data = await res.json();
    if (typeof data === "string") return data;
    if (data.error) return data.error;
    if (data.detail) return data.detail;
    const first = Object.values(data)[0];
    if (Array.isArray(first) && typeof first[0] === "string") return first[0];
    if (typeof first === "string") return first;
  } catch {
    /* not JSON */
  }
  return fallback;
}
