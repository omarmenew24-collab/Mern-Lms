import { axiosInstance } from "../lib/axios";

/** Matches backend GET `/api/admin/exports/*` (admin JWT required). */
export const ADMIN_CSV_EXPORT_PATHS = {
  users: "/admin/exports/users",
  courses: "/admin/exports/courses",
  payments: "/admin/exports/payments",
  enrollments: "/admin/exports/enrollments",
  refunds: "/admin/exports/refunds",
  manualPayments: "/admin/exports/manual-payments",
  chargebacks: "/admin/exports/chargebacks",
};

/**
 * Triggers a CSV download via authenticated blob response.
 * @param {keyof typeof ADMIN_CSV_EXPORT_PATHS} key
 * @param {Record<string, string | number | undefined>} [params] query string (e.g. courseId, status, filter)
 */
export async function downloadAdminCsvExport(key, params = {}) {
  const path = ADMIN_CSV_EXPORT_PATHS[key];
  if (!path) throw new Error(`Unknown export: ${key}`);

  const res = await axiosInstance.get(path, {
    params,
    responseType: "blob",
  });

  const cd = res.headers["content-disposition"] || res.headers["Content-Disposition"];
  let filename = `${String(key)}.csv`;
  if (typeof cd === "string") {
    const m = cd.match(/filename="([^"]+)"/i) || cd.match(/filename\*?=['"]?([^'";\n]+)/i);
    if (m?.[1]) filename = m[1].trim();
  }

  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
