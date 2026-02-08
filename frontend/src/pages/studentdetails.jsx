import { useParams, useLocation } from "react-router-dom";
import {
  FileText,
  Calendar,
  CheckCircle,
  GraduationCap,
  Percent,
  Award,
  ClipboardList,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { useGetStudentSubmissionsByCourse } from "../api/task";
import {
  useGetCourseProgress,
  useToggleCertificatePermission,
} from "../api/course";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import CertificateTemplate from "../components/CertificateTemplate";

const StudentDetails = () => {
  const { courseId, studentId } = useParams();
  const location = useLocation();
  const { student, course } = location.state || {};

  const { submissions = [], isLoading } = useGetStudentSubmissionsByCourse(
    courseId,
    studentId
  );
  const { progressData } = useGetCourseProgress(courseId, studentId);

  // ✅ Using your mutation hook
  const { togglecertpermission, isPending } = useToggleCertificatePermission();

  const progress = progressData?.progress || 0;
  const isFullProgress = progress === 100;
  const isApproved = progressData?.certificateApproved; // Assuming this exists in progressData

  // Calculate Average Grade
  const gradedSubmissions = submissions.filter((s) => s.grade !== null);
  const avgGrade =
    gradedSubmissions.length > 0
      ? (
          gradedSubmissions.reduce((acc, curr) => acc + curr.grade, 0) /
          gradedSubmissions.length
        ).toFixed(1)
      : "N/A";

  const certificateRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: certificateRef,
    documentTitle: `${student?.name}_${course?.title}_Certificate`,
  });

  // ✅ Handle Toggle
 const handleToggle = async () => {
  // 1. Guard Clause: Check if progress is 100%
  if (progress < 100) {
    alert("You cannot approve a certificate until the student reaches 100% completion.");
    return;
  }

  // 2. If it is 100%, run the mutation
  try {
    await togglecertpermission({ courseId, studentId });
  } catch (error) {
    console.error("Failed to toggle permission:", error);
  }
};

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium">
          Analyzing student records...
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        {/* --- PROFESSIONAL HEADER & STATS CARD --- */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                <GraduationCap size={32} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                  {student?.name}
                </h1>
                <p className="text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1 mt-1">
                  <Award size={16} /> {course?.title}
                </p>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 md:flex gap-4 md:gap-8 border-t md:border-t-0 pt-6 md:pt-0 border-gray-100 dark:border-gray-800">
              <div className="text-center md:text-left">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Average Grade
                </p>
                <p className="text-2xl font-black text-gray-800 dark:text-white">
                  {avgGrade}%
                </p>
              </div>

              <div className="text-center md:text-left">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Status
                </p>
                <span
                  className={`text-sm font-bold px-3 py-1 rounded-full ${
                    isFullProgress
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {isFullProgress ? "Completed" : "In Progress"}
                </span>
              </div>

              {/* ✅ CERTIFICATE TOGGLE BUTTON */}
              <div className="flex flex-col items-center md:items-start justify-center">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 text-center md:text-left">
                  Certification
                </p>
                <button
                  onClick={handleToggle}
                  disabled={isPending}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 shadow-sm border ${
                    isApproved
                      ? "bg-green-500 border-green-600 text-white hover:bg-green-600"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-indigo-500 hover:text-indigo-600"
                  } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isPending ? (
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : isApproved ? (
                    <ShieldCheck size={16} />
                  ) : (
                    <ShieldAlert size={16} />
                  )}
                  {isApproved ? "Revoke Certificate" : "Approve Certificate"}
                </button>
              </div>
            </div>
          </div>

          {/* Compact Teacher-Style Progress Bar */}
          <div className="mt-8 pt-6 border-t border-gray-50 dark:border-gray-800">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-bold text-gray-500 flex items-center gap-1 uppercase">
                <Percent size={14} /> Overall Course Completion
              </span>
              <span
                className={`text-lg font-black ${
                  isFullProgress ? "text-green-600" : "text-indigo-600"
                }`}
              >
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ease-out rounded-full ${
                  isFullProgress
                    ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                    : "bg-indigo-600"
                }`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* --- SUBMISSIONS SECTION --- */}
        <div className="flex items-center gap-2 mb-6 ml-2">
          <ClipboardList className="text-gray-400" size={20} />
          <h2 className="text-lg font-bold text-gray-700 dark:text-gray-300">
            Assignment Portfolio
          </h2>
        </div>

        {submissions.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 text-center border border-dashed border-gray-200 dark:border-gray-800">
            <AlertCircle className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              No work has been submitted by this student yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {submissions.map((sub) => (
              <div
                key={sub._id}
                className="group bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <FileText size={24} />
                  </div>
                  <span
                    className={`px-3 py-1 text-xs rounded-lg font-bold tracking-tight ${
                      sub.grade >= 50
                        ? "bg-green-50 text-green-700 border border-green-100"
                        : sub.grade === null
                        ? "bg-gray-100 text-gray-500"
                        : "bg-red-50 text-red-700 border border-red-100"
                    }`}
                  >
                    {sub.grade !== null ? `GRADE: ${sub.grade}` : "PENDING"}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors">
                  {sub.taskId.title}
                </h3>

                <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                  <Calendar size={12} />
                  {sub.taskId.dueDate
                    ? new Date(sub.taskId.dueDate).toLocaleDateString()
                    : "No deadline"}
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-50 dark:border-gray-800">
                  <a
                    href={sub.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-full py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    Review Document
                  </a>

                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">
                      Feedback
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                      "{sub.feedback || "Awaiting instructor feedback..."}"
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="absolute -z-50 opacity-0">
          <CertificateTemplate
            ref={certificateRef}
            studentName={student?.name}
            courseTitle={course?.title}
            date={new Date().toLocaleDateString()}
          />
        </div>

        <button
          onClick={() => {
            if (isApproved) {
              handlePrint();
            } else {
              alert("Certificate must be approved before generating the PDF.");
            }
          }}
          disabled={!isApproved}
          className={`mt-6 px-6 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
            isApproved
              ? "bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer shadow-md shadow-indigo-200"
              : "bg-gray-200 text-gray-500 cursor-not-allowed opacity-70"
          }`}
        >
          <FileText size={18} />
          {isApproved ? "Generate PDF Certificate" : "Certificate Locked"}
        </button>
      </div>
    </div>
  );
};

export default StudentDetails;
