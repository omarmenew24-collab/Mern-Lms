/**
 * Vimeo API 3.4 (server-side). Uses VIMEO_ACCESS_TOKEN from .env
 * (generate in Vimeo Developer: your app → Authentication → access token, scopes upload + edit).
 * Client ID/secret are for OAuth; direct uploads use the access token.
 */

const VIMEO_API = "https://api.vimeo.com";

const jsonHeaders = () => ({
  Accept: "application/vnd.vimeo.*+json;version=3.4",
});

export function isVimeoUploadConfigured() {
  return Boolean(process.env.VIMEO_ACCESS_TOKEN?.trim());
}

/**
 * @param {string} token
 * @param {string} path
 */
async function vimeoGet(token, path) {
  const res = await fetch(`${VIMEO_API}${path.startsWith("/") ? path : `/${path}`}`, {
    method: "GET",
    headers: { Authorization: `bearer ${token}`, ...jsonHeaders() },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error || data.message;
    const text = typeof msg === "string" ? msg : "Vimeo request failed";
    const err = new Error(text);
    err.status = res.status;
    throw err;
  }
  return data;
}

/**
 * Create a placeholder and return a TUS `upload_link` and numeric video id.
 * @param {{ name: string, fileSizeBytes: number }} p
 * @returns {Promise<{ videoId: string, uploadLink: string, uri: string }>}
 */
export async function createTusUploadPlaceholder(p) {
  const token = process.env.VIMEO_ACCESS_TOKEN?.trim();
  if (!token) {
    const err = new Error("Vimeo is not configured (missing VIMEO_ACCESS_TOKEN).");
    err.status = 503;
    throw err;
  }
  if (!p.fileSizeBytes || p.fileSizeBytes < 1 || p.fileSizeBytes > 300 * 1024 * 1024 * 1024) {
    const err = new Error("Invalid file size.");
    err.status = 400;
    throw err;
  }

  const res = await fetch(`${VIMEO_API}/me/videos`, {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
      ...jsonHeaders(),
    },
    body: JSON.stringify({
      name: (p.name || "Lecture video").trim().slice(0, 128) || "Lecture video",
      upload: {
        approach: "tus",
        size: Math.floor(p.fileSizeBytes),
      },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error || data.message;
    const text = typeof msg === "string" ? msg : "Vimeo create video failed";
    const err = new Error(text);
    err.status = res.status >= 400 && res.status < 600 ? res.status : 502;
    throw err;
  }

  const uri = data.uri;
  const videoId = typeof uri === "string" ? uri.split("/").filter(Boolean).pop() : "";
  const uploadLink = data.upload?.upload_link;
  if (!uploadLink || !/^\d+$/.test(String(videoId))) {
    const err = new Error("Vimeo did not return a valid TUS upload link or video id.");
    err.status = 502;
    throw err;
  }
  return { videoId: String(videoId), uploadLink, uri };
}

/**
 * @param {string} videoId
 * @returns {Promise<{ duration?: number, name?: string, status?: string } | null>}
 */
export async function getVimeoVideoMeta(videoId) {
  const token = process.env.VIMEO_ACCESS_TOKEN?.trim();
  if (!token || !/^\d{4,20}$/.test(String(videoId))) return null;
  try {
    const d = await vimeoGet(token, `/videos/${videoId}`);
    const rawDur = d?.duration;
    const duration =
      rawDur != null && !Number.isNaN(Number(rawDur)) ? Math.round(Number(rawDur)) : undefined;
    return { duration, name: d?.name, status: d?.transcode?.status };
  } catch {
    return null;
  }
}
