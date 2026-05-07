import { useState } from "react";
import toast from "react-hot-toast";
import { Download } from "lucide-react";
import { downloadAdminCsvExport } from "../../api/adminExport";

/**
 * Small outline button for admin CSV downloads (finance, users, etc.).
 */
export default function ExportCsvButton({
  exportKey,
  params = {},
  label = "Export CSV",
  className = "",
  disabled = false,
}) {
  const [pending, setPending] = useState(false);

  const onClick = async () => {
    setPending(true);
    try {
      await downloadAdminCsvExport(exportKey, params);
      toast.success("Download started");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Export failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || pending}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-xs font-bold text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors ${className}`}
    >
      <Download className="w-3.5 h-3.5 shrink-0" />
      {pending ? "…" : label}
    </button>
  );
}
