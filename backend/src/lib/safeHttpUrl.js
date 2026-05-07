/**
 * Allow only browser http(s) URLs — blocks javascript:, data:, file:, etc.
 * @param {unknown} raw
 * @param {{ allowEmpty?: boolean }} [opts]
 * @returns {{ ok: true, value: string } | { ok: false, message: string }}
 */
export function parseHttpUrl(raw, opts = {}) {
  const { allowEmpty = false } = opts;

  if (raw == null || raw === "") {
    if (allowEmpty) return { ok: true, value: "" };
    return { ok: false, message: "URL is required" };
  }

  const s = String(raw).trim();
  if (!s) {
    if (allowEmpty) return { ok: true, value: "" };
    return { ok: false, message: "URL is required" };
  }

  let url;
  try {
    url = new URL(s);
  } catch {
    return { ok: false, message: "Invalid URL" };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return {
      ok: false,
      message: "Only http and https links are allowed",
    };
  }

  if (!url.hostname) {
    return { ok: false, message: "URL must include a hostname" };
  }

  return { ok: true, value: url.toString() };
}
