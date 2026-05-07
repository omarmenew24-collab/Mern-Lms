import toast from "react-hot-toast";
import i18n from "../i18n";

const panelClass =
  "rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg p-4 max-w-sm text-start";

/**
 * Non-blocking confirmation (replaces window.confirm). Resolves true if confirmed.
 */
export function confirmAction(message, options = {}) {
  const confirmLabel = options.confirmLabel ?? i18n.t("commonActions.confirm");
  const cancelLabel = options.cancelLabel ?? i18n.t("commonActions.cancel");
  const destructive = options.destructive ?? false;

  return new Promise((resolve) => {
    toast.custom(
      (t) => (
        <div className={panelClass}>
          <p className="text-sm text-gray-800 dark:text-gray-100 font-medium mb-3">{message}</p>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg text-white transition-colors ${
                destructive ? "bg-red-600 hover:bg-red-700" : "bg-brand-600 hover:bg-brand-700"
              }`}
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      ),
      { duration: 20000, position: "top-center" },
    );
  });
}

const roleOptions = ["student", "teacher", "admin"];

/**
 * Pick a user role (replaces window.prompt). Resolves role string or null if cancelled.
 */
export function pickRoleToast(currentRole) {
  const roleLabelMap = {
    student: i18n.t("accountNav.myLearning"),
    teacher: i18n.t("accountNav.teachingHub"),
    admin: i18n.t("accountNav.adminProfile"),
  };

  return new Promise((resolve) => {
    toast.custom(
      (t) => {
        let selected = currentRole;
        return (
          <div className={panelClass}>
            <p className="text-sm text-gray-800 dark:text-gray-100 font-medium mb-2">{i18n.t("commonActions.changeRole")}</p>
            <select
              className="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              defaultValue={currentRole}
              onChange={(e) => {
                selected = e.target.value;
              }}
            >
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {roleLabelMap[r] || r}
                </option>
              ))}
            </select>
            <div className="flex gap-2 justify-end mt-3">
              <button
                type="button"
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(null);
                }}
              >
                {i18n.t("commonActions.cancel")}
              </button>
              <button
                type="button"
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-700"
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(selected);
                }}
              >
                {i18n.t("commonActions.update")}
              </button>
            </div>
          </div>
        );
      },
      { duration: 30000, position: "top-center" },
    );
  });
}
