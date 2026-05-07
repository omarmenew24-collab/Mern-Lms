import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGradeSubmission, useGetSubmissionsByTask } from "../../api/task";
import { ArrowLeft, Download } from "lucide-react";
import toast from "react-hot-toast";

export const TaskSubmissionsPage = () => {
  const { t, i18n } = useTranslation();
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { submissions, isLoading, isErrorsubmission } = useGetSubmissionsByTask(taskId);
  const [grades, setGrades] = useState({});

  const { GradeMySubmission, isPending, isError } = useGradeSubmission(taskId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleGrade = async (submission) => {
    const inputGrade = grades[submission._id];
    const gradeToSubmit = inputGrade !== undefined ? inputGrade : submission.grade;

    if (gradeToSubmit === "" || gradeToSubmit === undefined || gradeToSubmit === null) {
      toast.error(t("submissions.enterGrade"));
      return;
    }

    try {
      await GradeMySubmission({
        studentId: submission.studentId._id,
        grade: Number(gradeToSubmit),
      });
      toast.success(t("submissions.gradeSuccess"));
      setGrades((prev) => ({ ...prev, [submission._id]: "" }));
    } catch {
      toast.error(t("submissions.gradeError"));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 rtl-flip" /> {t("commonActions.back")}
        </button>

        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">{t("submissions.title")}</h1>

        {(!submissions || submissions.length === 0) ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
            <p className="text-gray-400 dark:text-gray-500">{t("submissions.noSubmissions")}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
                  <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">{t("submissions.student")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">{t("submissions.status")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">{t("submissions.submittedAt")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">{t("submissions.grade")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">{t("submissions.file")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">{t("submissions.newGrade")}</th>
                  <th className="text-end px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">{t("commonActions.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {submissions.map((submission) => (
                  <tr key={submission._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{submission.studentId?.name || t("submissions.unknownStudent")}</td>
                    <td className="px-4 py-3">
                      {submission.status === "submitted" ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">{t("submissions.submitted")}</span>
                      ) : submission.status === "late" ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">{t("submissions.late")}</span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{t("submissions.pending")}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString(i18n.language) : "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{submission.grade ?? "—"}</td>
                    <td className="px-4 py-3">
                      <a href={submission.fileUrl} download className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:underline text-xs font-medium">
                        <Download className="w-3.5 h-3.5" /> {t("submissions.download")}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0-100"
                        className="w-20 h-8 px-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        value={grades[submission._id] ?? submission.grade ?? ""}
                        onChange={(e) => setGrades({ ...grades, [submission._id]: e.target.value })}
                      />
                    </td>
                    <td className="px-4 py-3 text-end">
                      <button
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
                        disabled={isPending}
                        onClick={() => handleGrade(submission)}
                      >
                        {isPending ? t("commonActions.saving") : submission.grade !== null ? t("submissions.update") : t("submissions.grade")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isError && <p className="text-red-500 text-sm">{t("submissions.gradeError")}</p>}
        {isErrorsubmission && <p className="text-red-500 text-sm">{t("submissions.fetchError")}</p>}
      </div>
    </div>
  );
};
