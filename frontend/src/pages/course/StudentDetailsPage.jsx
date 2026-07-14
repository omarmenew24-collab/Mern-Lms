import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FileText,
  Calendar,
  GraduationCap,
  Percent,
  Award,
  ClipboardList,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Download,
  ExternalLink,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { useGetStudentSubmissionsByCourse } from "../../api/task";
import {
  useGetCourseProgress,
  useToggleCertificatePermission,
  useStaffLearnerEnrollmentSnapshot,
  downloadCourseCertificatePdf,
} from "../../api/course";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import LearnerEnrollmentDetailPanel from "../../components/courseSections/LearnerEnrollmentDetailPanel";
import { paths } from "../../config/paths";
import { downloadSubmissionBlob, getSubmissionDownloadFilename } from "../../lib/submissionDownload";
import { useFormatter } from "../../lib/i18nFormatters";

const StudentDetails = () => {
  const { t } = useTranslation();
  const { date } = useFormatter();
  const { courseId, studentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { student, course } = location.state || {};

  const { submissions = [], isLoading } = useGetStudentSubmissionsByCourse(courseId, studentId);
  const { progressData } = useGetCourseProgress(courseId, studentId);
  const { data: learnerSnapshot, isLoading: snapshotLoading } =
    useStaffLearnerEnrollmentSnapshot(courseId, studentId);

  const { togglecertpermission, isPending } = useToggleCertificatePermission();
  const queryClient = useQueryClient();
  const [downloading, setDownloading] = useState(false);

  const progress = progressData?.progress || 0;
  const isFullProgress = progress === 100;
  const isApproved = progressData?.certificateApproved;

  const gradedSubmissions = submissions.filter((s) => s.grade !== null);
  const avgGrade =
    gradedSubmissions.length > 0
      ? (gradedSubmissions.reduce((acc, curr) => acc + curr.grade, 0) / gradedSubmissions.length).toFixed(1)
      : t("workspace.studentDetails.na");

  const certificateCode = progressData?.certificateCode;

  const handleDownloadPdf = async () => {
    if (!isApproved || !courseId || !studentId || downloading) return;
    setDownloading(true);
    try {
      await downloadCourseCertificatePdf({ courseId, studentId, queryClient });
    } catch {
      /* toast in api */
    } finally {
      setDownloading(false);
    }
  };

  const handleToggle = async () => {
    if (progress < 100) {
      toast.error(t("workspace.studentDetails.approveOnlyAt100"));
      return;
    }
    try {
      await togglecertpermission({ courseId, studentId });
    } catch (error) {
      toast.error(error.response?.data?.message || t("workspace.studentDetails.updatePermFailed"));
    }
  };

  const handleDownloadSubmission = async (sub) => {
    if (!sub?.fileUrl) {
      toast.error(t("workspace.studentDetails.noFile"));
      return;
    }
    const filename = getSubmissionDownloadFilename(sub);
    try {
      await downloadSubmissionBlob(sub.fileUrl, filename);
    } catch {
      toast.error(t("workspace.studentDetails.downloadFallback"));
      window.open(sub.fileUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleOpenSubmissionInNewTab = (sub) => {
    if (!sub?.fileUrl) {
      toast.error(t("workspace.studentDetails.noFile"));
      return;
    }
    window.open(sub.fileUrl, "_blank", "noopener,noreferrer");
  };

  if (isLoading)
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 rtl-flip" /> {t("commonActions.back")}
        </button>

        {/* Header Card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center text-white">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">{student?.name}</h1>
                <p className="text-sm text-brand-600 dark:text-brand-400 font-medium flex items-center gap-1 mt-0.5">
                  <Award className="w-3.5 h-3.5" /> {course?.title}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t("workspace.studentDetails.avgGrade")}</p>
                <p className="text-xl font-black text-gray-900 dark:text-white">{avgGrade}%</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t("workspace.studentDetails.status")}</p>
                <span className={`inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${isFullProgress ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"}`}>
                  {isFullProgress ? t("workspace.studentDetails.completed") : t("workspace.studentDetails.inProgress")}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t("workspace.studentDetails.certificate")}</p>
                <button
                  onClick={handleToggle}
                  disabled={isPending}
                  className={`mt-0.5 flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors border ${
                    isApproved
                      ? "bg-emerald-600 border-emerald-700 text-white hover:bg-emerald-700"
                      : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-brand-500 hover:text-brand-600"
                  } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isPending ? (
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isApproved ? (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  ) : (
                    <ShieldAlert className="w-3.5 h-3.5" />
                  )}
                  {isApproved ? t("workspace.studentDetails.revoke") : t("workspace.studentDetails.approve")}
                </button>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Percent className="w-3 h-3" /> {t("workspace.studentDetails.courseCompletion")}
              </span>
              <span className={`text-sm font-black ${isFullProgress ? "text-emerald-600" : "text-brand-600"}`}>
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${isFullProgress ? "bg-emerald-500" : "bg-brand-600"}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
            {t("workspace.studentDetails.enrollmentActivity")}
          </h2>
          {snapshotLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
              {t("workspace.studentDetails.loadingDetails")}
            </div>
          ) : (
            <LearnerEnrollmentDetailPanel
              snapshot={learnerSnapshot}
              omitCourseHeading={Boolean(course?.title)}
              suppressProgress
            />
          )}
        </div>

        {/* Submissions */}
        <div className="flex items-center gap-2 ms-1">
          <ClipboardList className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">{t("workspace.studentDetails.assignmentPortfolio")}</h2>
        </div>

        {submissions.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
            <AlertCircle className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={40} />
            <p className="text-sm text-gray-400 dark:text-gray-500">{t("workspace.studentDetails.noSubmissions")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {submissions.map((sub) => (
              <div key={sub._id} className="group bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand-200 dark:hover:border-brand-900/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    sub.grade >= 50
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                      : sub.grade === null
                      ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                      : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                  }`}>
                    {sub.grade !== null ? t("workspace.studentDetails.grade", { grade: sub.grade }) : t("workspace.studentDetails.pending")}
                  </span>
                </div>

                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {sub.taskId.title}
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
                  <Calendar className="w-3 h-3" />
                  {sub.taskId.dueDate ? date(sub.taskId.dueDate) : t("workspace.studentDetails.noDeadline")}
                </div>

                <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadSubmission(sub)}
                      className="flex flex-1 items-center justify-center gap-1.5 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold hover:bg-brand-600 hover:text-white transition-all border-0 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> {t("workspace.studentDetails.downloadSubmission")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenSubmissionInNewTab(sub)}
                      className="flex flex-1 items-center justify-center gap-1.5 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> {t("workspace.studentDetails.openNewTab")}
                    </button>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t("workspace.studentDetails.feedback")}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                      {sub.feedback || t("workspace.studentDetails.awaitingFeedback")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{t("workspace.studentDetails.certificatePdf")}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            {t("workspace.studentDetails.certificatePdfDesc")}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => handleDownloadPdf()}
              disabled={!isApproved || downloading}
              title={!isApproved ? t("workspace.studentDetails.mustApproveFirst") : undefined}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                isApproved
                  ? "bg-brand-600 text-white hover:bg-brand-700"
                  : "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
              }`}
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {isApproved ? t("workspace.studentDetails.downloadPdfCert") : t("workspace.studentDetails.certificateLocked")}
            </button>
            {certificateCode && isApproved && (
              <Link
                to={paths.certificateVerify(certificateCode)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400"
              >
                <CheckCircle className="w-4 h-4" />
                {t("workspace.studentDetails.verifyCredential")}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetails;
