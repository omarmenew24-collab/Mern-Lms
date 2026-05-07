/**
 * RFC-style CSV (comma-separated) with optional UTF-8 BOM for Excel.
 */

export function csvEscape(val) {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * @param {import("express").Response} res
 * @param {string} filenameBase - no extension; date is appended
 * @param {string[]} headers
 * @param {unknown[][]} rows
 */
export function sendCsv(res, filenameBase, headers, rows) {
  const esc = (v) => csvEscape(v);
  const lines = [headers.map(esc).join(","), ...rows.map((row) => row.map(esc).join(","))];
  const body = `\uFEFF${lines.join("\r\n")}`;
  const date = new Date().toISOString().slice(0, 10);
  const safeName = `${filenameBase}-${date}.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);
  return res.status(200).send(body);
}
