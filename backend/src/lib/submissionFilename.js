import path from "path";

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

/**
 * Safe display/download name for a learner upload (stored on Submission).
 */
export function buildSubmissionOriginalFileName(originalname, mimetype) {
  let base = path.basename(String(originalname || "").replace(/\0/g, "")).trim();
  base = base.replace(/[/\\<>:"|?*\x00-\x1f]/g, "_").replace(/^\.+/, "").trim();
  if (!base) base = "submission";

  const hasExt = /\.[a-zA-Z0-9]{1,10}$/.test(base);
  if (!hasExt) {
    const ext = MIME_EXT[String(mimetype || "").toLowerCase()] || "";
    if (ext && !base.toLowerCase().endsWith(ext.toLowerCase())) {
      base = `${base}${ext}`;
    }
  }
  return base.slice(0, 200);
}
