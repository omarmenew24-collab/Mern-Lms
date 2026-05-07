import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useFormatter } from "../../lib/i18nFormatters";
import useUserStore from "../../store/userstore";
import { useGetTeachingRequests, useReviewRequest } from "../../api/teaching";
import { paths } from "../../config/paths";
import { safeHttpUrl } from "../../lib/safeHttpUrl";
import { ArrowLeft, User, Mail, BookOpen, FileText, CreditCard, Link2, Clock } from "lucide-react";

const TeachingRequest = () => {
  const { t } = useTranslation();
  const { dateTime } = useFormatter();
  const { id } = useParams();
  const navigate = useNavigate();
  const isAdmin = useUserStore((s) => s.user?.role === "admin");

  const { teachingRequests, isLoading: isFetching, needsReauth } = useGetTeachingRequests(isAdmin);
  const { reviewrequest, isPending: isReviewing } = useReviewRequest();

  const teachingRequest = teachingRequests?.find((req) => req._id === id);

  const handleRequestAction = async (action) => {
    try {
      await reviewrequest({ requestId: id, action });
      navigate(paths.home);
    } catch (err) {
      console.error("Error reviewing request:", err);
    }
  };

  if (isAdmin && needsReauth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/90 dark:bg-amber-950/20 px-6 py-5 text-center">
          <p className="text-sm text-gray-800 dark:text-gray-200">
            Your session could not be restored. Log in again to view teaching requests.
          </p>
          <Link
            to="/login"
            className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  if (isFetching) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!teachingRequest) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
        <div className="max-w-lg mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">No teaching request found.</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-sm text-brand-600 dark:text-brand-400 hover:underline">Go back</button>
        </div>
      </div>
    );
  }

  const portfolioHref = teachingRequest.portfolioLink
    ? safeHttpUrl(teachingRequest.portfolioLink)
    : null;

  const statusStyle = (s) => {
    switch (s) {
      case "approved": return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300";
      case "rejected": return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300";
      default: return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-lg mx-auto space-y-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 rtl-flip" /> Back
        </button>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Teaching Request</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Review this instructor application</p>
          </div>

          <div className="p-6 space-y-4 text-sm">
            <DetailRow icon={<User className="w-4 h-4" />} label="Name" value={teachingRequest.user.name} />
            <DetailRow icon={<Mail className="w-4 h-4" />} label="Email" value={teachingRequest.user.email} />
            <DetailRow icon={<BookOpen className="w-4 h-4" />} label="Subject" value={teachingRequest.subject} />
            <DetailRow icon={<FileText className="w-4 h-4" />} label="Bio" value={teachingRequest.bio} />
            <DetailRow icon={<CreditCard className="w-4 h-4" />} label="Payment Method" value={teachingRequest.paymentMethod} />

            {teachingRequest.portfolioLink ? (
              <div className="flex items-start gap-3">
                <Link2 className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Portfolio</p>
                  {portfolioHref ? (
                    <a
                      href={portfolioHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-600 dark:text-brand-400 hover:underline font-medium"
                    >
                      View Portfolio
                    </a>
                  ) : (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Stored portfolio link is not a valid http(s) URL.
                    </p>
                  )}
                </div>
              </div>
            ) : null}

            <DetailRow icon={<Clock className="w-4 h-4" />} label={t("commonActions.save", "Submitted")} value={dateTime(teachingRequest.submittedAt)} />

            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Status:</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusStyle(teachingRequest.status)}`}>
                {teachingRequest.status}
              </span>
            </div>
          </div>

          {teachingRequest.status === "pending" && (
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
              <button
                disabled={isReviewing}
                onClick={() => handleRequestAction("rejected")}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isReviewing ? "Processing..." : "Reject"}
              </button>
              <button
                disabled={isReviewing}
                onClick={() => handleRequestAction("approve")}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {isReviewing ? "Processing..." : "Accept"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
      <p className="text-gray-800 dark:text-white font-medium">{value}</p>
    </div>
  </div>
);

export default TeachingRequest;
