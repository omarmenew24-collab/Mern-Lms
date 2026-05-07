import React from "react";
import toast from "react-hot-toast";
import { useDarkMode } from "../store/darkmode";
import { useNavigate, Link } from "react-router-dom";
import { useDeleteRequest, useGetTeachingRequests } from "../api/teaching";
import useUserStore from "../store/userstore";
import { Trash2, Loader2, Info, BookOpen, User, Mail, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

const TeachingRequests = () => {
  const { t } = useTranslation();
  const { darkMode } = useDarkMode();
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();

  // --- Only fetch teaching requests if the user is admin ---
  const {
    teachingRequests = [],
    isLoading,
    isError,
    needsReauth,
  } = useGetTeachingRequests(user?.role === "admin");

  const { mutateAsync: deleteRequest } = useDeleteRequest();

  // --- Logic Functions ---
  const handleDeleteClick = (e, id) => {
    e.stopPropagation(); // Prevents navigating

    toast((t) => (
      <div className="flex flex-col gap-3 p-1">
        <div className="flex items-center gap-2">
          <Info size={20} className="text-red-500" />
          <span className="font-semibold text-gray-800">{t("home.teachingRequests.confirmDeletion")}</span>
        </div>
        <p className="text-sm text-gray-600">
          {t("home.teachingRequests.confirmDeletionBody")}
        </p>
        <div className="flex gap-2 justify-end mt-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            {t("home.teachingRequests.cancel")}
          </button>
          <button
            onClick={() => {
              executeDelete(id);
              toast.dismiss(t.id);
            }}
            className="px-4 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 shadow-sm transition-all"
          >
            {t("home.teachingRequests.delete")}
          </button>
        </div>
      </div>
    ), { 
      duration: 6000,
      style: { borderRadius: '16px', padding: '16px', minWidth: '320px' } 
    });
  };

  const executeDelete = async (id) => {
    toast.promise(
      deleteRequest(id),
      {
        loading: t("home.teachingRequests.deleting"),
        success: t("home.teachingRequests.deleted"),
        error: (err) => typeof err === "string" ? err : (err.response?.data?.message || t("home.teachingRequests.deleteError"))
      }
    );
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "approved": return "bg-green-100 text-green-700 border-green-200";
      case "pending": return "bg-amber-100 text-amber-700 border-amber-200";
      case "rejected": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  if (user?.role !== "admin") return null;

  if (needsReauth) {
    return (
      <div className="max-w-xl mx-auto my-8 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/90 dark:bg-amber-950/20 text-center">
        <p className="text-sm text-gray-800 dark:text-gray-200">
          {t("home.teachingRequests.reloginHint")}
        </p>
        <Link to="/login" className="mt-2 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700">
          {t("home.teachingRequests.login")}
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
        <p className={`text-lg font-medium animate-pulse ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          {t("home.teachingRequests.loading")}
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-xl mx-auto my-10 p-6 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-4 text-red-800">
        <Info className="shrink-0" />
        <p className="font-medium">{t("home.teachingRequests.loadError")}</p>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <section>
          <header className="mb-12">
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              {t("home.teachingRequests.title")}
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {t("home.teachingRequests.subtitle")}
            </p>
          </header>

          {teachingRequests?.length === 0 ? (
            <div className="text-center py-20 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800">
              <User size={28} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">{t("home.teachingRequests.emptyTitle")}</h3>
              <p className="text-sm text-gray-400 mt-1">{t("home.teachingRequests.emptySubtitle")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {teachingRequests.map((req) => (
                <div
                  key={req._id}
                  onClick={() => navigate(`/teaching/requests/${req._id}`)}
                  className="group flex flex-col rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900/20 flex items-center justify-center text-brand-700 dark:text-brand-300 text-sm font-bold">
                      {req.user?.name?.charAt(0) || "?"}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(req.status)}`}>
                        {req.status}
                      </span>
                      <button
                        onClick={(e) => handleDeleteClick(e, req._id)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-grow">
                    <h3 className="text-[15px] font-bold text-gray-900 dark:text-white mb-0.5">
                      {req.user?.name || t("home.teachingRequests.applicant")}
                    </h3>
                    <div className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400 text-xs mb-3">
                      <Mail size={12} />
                      <span className="truncate">{req.user?.email || t("home.teachingRequests.noEmail")}</span>
                    </div>
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                      <div className="flex items-start gap-2">
                        <BookOpen size={14} className="mt-0.5 text-brand-500" />
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{t("home.teachingRequests.subject")}</p>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{req.subject}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">{t("home.teachingRequests.review")}</span>
                    <ChevronRight size={14} className="text-brand-500 rtl-flip ltr:group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default TeachingRequests;
