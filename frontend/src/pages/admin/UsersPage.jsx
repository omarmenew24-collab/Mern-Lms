import React, { useState, useMemo } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { UseGetAllUsers, useDeleteUser } from "../../api/admin";
import { paths } from "../../config/paths";
import { confirmAction } from "../../lib/confirmToast.jsx";
import { Search, Trash2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ExportCsvButton from "../../components/admin/ExportCsvButton";

const UsersPage = () => {
  const { t, i18n } = useTranslation();
  const { allusers, isLoading, isError } = UseGetAllUsers();
  const { deleteMyUser, isPending: isDeleting } = useDeleteUser();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const navigate = useNavigate();

  const filteredUsers = useMemo(() => {
    if (!allusers) return [];
    return allusers
      .filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
      .filter((u) => roleFilter === "all" || u.role === roleFilter);
  }, [allusers, search, roleFilter]);

  const handleDelete = async (id) => {
    const ok = await confirmAction(t("admin.users.deleteConfirm"), {
      destructive: true,
      confirmLabel: t("commonActions.delete", "Delete"),
    });
    if (!ok) return;
    try {
      await deleteMyUser(id);
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center"><div className="w-7 h-7 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (isError) return <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 text-red-500 font-medium">{t("admin.users.failedLoad")}</div>;

  const roleStyle = (r) => {
    switch (r) {
      case "admin": return "bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300";
      case "teacher": return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300";
      default: return "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">{t("admin.users.title")}</h1>
          <div className="flex items-center gap-2">
            <ExportCsvButton exportKey="users" label={t("admin.users.exportCsv")} />
            <span className="text-xs text-gray-500 dark:text-gray-400">{t("admin.users.shown", { count: filteredUsers.length })}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 w-64 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input type="text" placeholder={t("admin.users.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 ms-2 bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none" />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="all">{t("admin.users.allRoles")}</option>
            <option value="student">{t("admin.dashboard.students")}</option>
            <option value="teacher">{t("admin.dashboard.teachers")}</option>
            <option value="admin">{t("admin.users.admins")}</option>
          </select>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
                <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">{t("admin.users.user")}</th>
                <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">{t("admin.users.role")}</th>
                <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">{t("admin.users.joined")}</th>
                <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">{t("admin.users.lastLogin")}</th>
                <th className="text-end px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">{t("commonActions.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=7c3aed&color=fff&size=36`} alt="" className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${roleStyle(user.role)}`}>{user.role}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{new Date(user.createdAt).toLocaleDateString(i18n.language)}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString(i18n.language) : t("admin.users.never")}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button type="button" onClick={() => navigate(paths.adminUser(user._id))} className="p-2 rounded-lg text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/20 dark:hover:text-brand-400 transition-colors" title={t("commonActions.view")} aria-label={t("commonActions.view")}><Eye className="w-4 h-4" /></button>
                      <button type="button" onClick={() => handleDelete(user._id)} disabled={isDeleting} className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-colors disabled:opacity-50" title={t("home.courses.delete")} aria-label={t("home.courses.delete")}><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {filteredUsers.length === 0 && <div className="py-12 text-center text-gray-400 dark:text-gray-500">{t("admin.users.noUsers")}</div>}
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
