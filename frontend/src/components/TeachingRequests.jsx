import React from "react";
import toast from "react-hot-toast";
import { useDarkMode } from "../store/darkmode";
import { useNavigate } from "react-router-dom";
import { useDeleteRequest, useGetTeachingRequests } from "../api/teaching";
import useUserStore from "../store/userstore";
import { Trash2, Loader2, Info, BookOpen, User, Mail, ChevronRight } from "lucide-react";

const TeachingRequests = () => {
  const { darkMode } = useDarkMode();
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();

  // --- Only fetch teaching requests if the user is admin ---
 const {
  teachingRequests = [],
  isLoading,
  isError,
} = useGetTeachingRequests(user?.role === "admin");

  const { mutateAsync: deleteRequest } = useDeleteRequest();

  // --- Logic Functions ---
  const handleDeleteClick = (e, id) => {
    e.stopPropagation(); // Prevents navigating

    toast((t) => (
      <div className="flex flex-col gap-3 p-1">
        <div className="flex items-center gap-2">
          <Info size={20} className="text-red-500" />
          <span className="font-semibold text-gray-800">Confirm Deletion</span>
        </div>
        <p className="text-sm text-gray-600">
          Are you sure? This action cannot be undone and the applicant will be removed.
        </p>
        <div className="flex gap-2 justify-end mt-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              executeDelete(id);
              toast.dismiss(t.id);
            }}
            className="px-4 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 shadow-sm transition-all"
          >
            Delete
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
        loading: 'Deleting request...',
        success: 'Successfully removed!',
        error: (err) => typeof err === 'string' ? err : (err.response?.data?.message || "Could not delete")
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

  // --- If not admin, render nothing ---
  if (user?.role !== "admin") return null;

  // --- Render States ---
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
        <p className={`text-lg font-medium animate-pulse ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          Fetching requests...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-xl mx-auto my-10 p-6 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-4 text-red-800">
        <Info className="shrink-0" />
        <p className="font-medium">Failed to load teaching requests. Please check your connection or refresh.</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${darkMode ? "bg-gray-950" : "bg-gray-50"}`}>
      <div className="max-w-7xl mx-auto">
        <section>
          <header className="mb-12">
            <h2 className={`text-4xl font-black tracking-tight ${darkMode ? "text-white" : "text-gray-900"}`}>
              Instructor Hub
            </h2>
            <p className={`mt-3 text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Review and manage teacher applications.
            </p>
          </header>

          {teachingRequests?.length === 0 ? (
            <div className={`text-center py-32 rounded-[2.5rem] border-4 border-dashed transition-colors ${darkMode ? "border-gray-800 bg-gray-900/50" : "border-gray-200 bg-white"}`}>
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <User size={32} />
              </div>
              <h3 className={`text-xl font-bold ${darkMode ? "text-gray-300" : "text-gray-800"}`}>All Caught Up!</h3>
              <p className="text-gray-500 mt-1">There are no pending requests at this time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {teachingRequests.map((req) => (
                <div
                  key={req._id}
                  onClick={() => navigate(`/teachingrequest/${req._id}`)}
                  className={`group relative flex flex-col rounded-[2rem] p-6 transition-all duration-300 hover:-translate-y-2 cursor-pointer border-2 ${darkMode ? "bg-gray-900 border-gray-800 hover:border-blue-500/50 shadow-blue-900/10" : "bg-white border-transparent shadow-xl shadow-gray-200/50 hover:border-blue-500"}`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="relative">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-500/30">
                        {req.user?.name?.charAt(0) || "?"}
                      </div>
                      <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 border-4 border-white dark:border-gray-900 rounded-full"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border ${getStatusStyle(req.status)}`}>
                        {req.status}
                      </span>
                      <button
                        onClick={(e) => handleDeleteClick(e, req._id)}
                        className={`p-2 rounded-xl transition-all ${darkMode ? "bg-gray-800 text-red-400 hover:bg-red-500/20" : "bg-red-50 text-red-500 hover:bg-red-500 hover:text-white"}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-grow">
                    <h3 className={`text-2xl font-bold mb-1 leading-tight ${darkMode ? "text-white" : "text-gray-900"}`}>
                      {req.user?.name || "Applicant Name"}
                    </h3>
                    <div className="flex items-center gap-1.5 text-blue-500 font-semibold text-sm mb-6">
                      <Mail size={14} />
                      <span className="truncate">{req.user?.email || "No email provided"}</span>
                    </div>
                    <div className={`space-y-4 rounded-2xl p-4 ${darkMode ? "bg-gray-950/50" : "bg-gray-50"}`}>
                      <div className="flex items-start gap-3">
                        <BookOpen size={18} className="mt-1 text-blue-600" />
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest opacity-50 text-gray-500">Desired Subject</p>
                          <p className={`font-semibold ${darkMode ? "text-gray-100" : "text-gray-800"}`}>{req.subject}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between group-hover:px-2 transition-all duration-300">
                    <span className="text-xs font-black uppercase tracking-widest text-blue-600">Review Application</span>
                    <ChevronRight size={20} className="text-blue-600 group-hover:translate-x-1 transition-transform" />
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
