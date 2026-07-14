const MIME_EXT = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "text/plain": ".txt",
  "application/rtf": ".rtf",
  "application/zip": ".zip",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

function basenameSafe(name) {
  const s = String(name || "")
    .trim()
    .replace(/[/\\]/g, "_")
    .replace(/[/\\<>:"|?*\x00-\x1f]/g, "_")
    .replace(/^\.+/, "")
    .trim();
  return s.slice(0, 200);
}

/** Last path segment of a URL if it looks like a real filename with extension. */
export function inferFilenameFromFileUrl(url) {
  if (!url || typeof url !== "string") return "";
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    if (!last) return "";
    const decoded = decodeURIComponent(last.split("?")[0] || "");
    if (/\.[a-zA-Z0-9]{1,10}$/.test(decoded) && decoded.length < 220) {
      return basenameSafe(decoded);
    }
  } catch {
    /* ignore */
  }
  return "";
}

/**
 * Filename for Save dialog: prefers API field, then URL path, then generic.
 */
export function getSubmissionDownloadFilename(submission, fallbackId = "file") {
  const fromApi = basenameSafe(submission?.originalFileName);
  if (fromApi) return fromApi;
  const fromUrl = inferFilenameFromFileUrl(submission?.fileUrl);
  if (fromUrl) return fromUrl;
  return `submission-${submission?._id || fallbackId}.bin`;
}

/**
 * Download remote file with a chosen filename (blob; works cross-origin when CORS allows).
 */
export async function downloadSubmissionBlob(fileUrl, filename) {
  const name = basenameSafe(filename) || "download.bin";
  const res = await fetch(fileUrl, { mode: "cors" });
  if (!res.ok) {
    throw new Error(`Download failed (${res.status})`);
  }
  const blob = await res.blob();
  const extFromType = blob.type ? MIME_EXT[blob.type] : "";
  let finalName = name;
  if (!/\.[a-zA-Z0-9]{1,10}$/.test(finalName) && extFromType) {
    finalName = `${finalName.replace(/\.+$/, "")}${extFromType}`;
  }
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = finalName;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}
