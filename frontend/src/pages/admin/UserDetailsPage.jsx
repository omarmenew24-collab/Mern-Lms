import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Mail,
  Shield,
  CheckCircle,
  Calendar,
  Clock,
  BookOpen,
  Users,
  TrendingUp,
  ArrowLeft,
  ExternalLink,
  Plus,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  useGetCoursesByTeacher,
  useAdminGetStudentEnrolledCourses,
  useGetStudentsByCourse,
  useGetCourseProgress,
  useAdminUserLearnerSnapshots,
} from "../../api/course";
import { UseGetUserById } from "../../api/admin";
import { axiosInstance } from "../../lib/axios";
import { paths } from "../../config/paths";
import LearnerEnrollmentDetailPanel from "../../components/courseSections/LearnerEnrollmentDetailPanel";
import { useFormatter } from "../../lib/i18nFormatters";

const UserDetailsPage = () => {
  const { t } = useTranslation();
  const { date } = useFormatter();
  const { userId } = useParams();
  const navigate = useNavigate();

  const { userbyid: user, isLoading: isUserLoading, isError: isUserError } =
    UseGetUserById(userId);

  const {
    coursesbyteacher,
    isLoading: isTeacherCoursesLoading,
    isError: isTeacherCoursesError,
  } = useGetCoursesByTeacher(userId);

  const {
    coursesbystudent,
    isLoading: isEnrolledLoading,
    isError: isEnrolledError,
  } = useAdminGetStudentEnrolledCourses(userId);

  const { data: adminLearnerSnapshots = [], isLoading: adminSnapLoading } =
    useAdminUserLearnerSnapshots(userId);

  const snapByCourseId = useMemo(() => {
    const m = new Map();
    for (const s of adminLearnerSnapshots) {
      if (s?.courseId != null) m.set(String(s.courseId), s);
    }
    return m;
  }, [adminLearnerSnapshots]);

  if (isUserLoading)
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  if (isUserError || !user)
    return <p className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 text-red-500 font-medium">{t("workspace.userDetails.failedLoad")}</p>;

  const roleStyle = (r) => {
    switch (r) {
      case "admin": return "bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300";
      case "teacher": return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300";
      default: return "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 rtl-flip" /> {t("commonActions.back")}
        </button>

        {/* User Card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <img
              src={user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=7c3aed&color=fff&size=64`}
              alt=""
              className="w-14 h-14 rounded-full object-cover"
            />
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">{user.name}</h1>
              <span className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${roleStyle(user.role)}`}>{user.role}</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            <InfoItem icon={<Mail className="w-4 h-4" />} label={t("workspace.userDetails.email")} value={user.email} />
            <InfoItem icon={<Shield className="w-4 h-4" />} label={t("workspace.userDetails.role")} value={user.role} />
            <InfoItem icon={<CheckCircle className="w-4 h-4" />} label={t("workspace.userDetails.status")} value={user.status} />
            <InfoItem icon={<Calendar className="w-4 h-4" />} label={t("workspace.userDetails.joined")} value={date(user.createdAt)} />
            <InfoItem icon={<Clock className="w-4 h-4" />} label={t("workspace.userDetails.lastLogin")} value={user.lastLogin ? date(user.lastLogin) : t("workspace.userDetails.never")} />
          </div>
        </div>

        <AdminUserPublicProfileCard userId={user._id} user={user} />

        {/* Courses Taught */}
        {user.role === "teacher" && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">{t("workspace.userDetails.coursesTaught")}</h2>
            </div>
            <div className="p-6 space-y-4">
              {isTeacherCoursesLoading && <p className="text-sm text-gray-500 dark:text-gray-400">{t("workspace.userDetails.loadingCourses")}</p>}
              {isTeacherCoursesError && <p className="text-sm text-red-500">{t("workspace.userDetails.errorCourses")}</p>}
              {coursesbyteacher?.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500">{t("workspace.userDetails.noCoursesTaught")}</p>}
              {coursesbyteacher?.map((course) => (
                <div key={course._id} className="p-4 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-brand-200 dark:hover:border-brand-900/50 transition-colors">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{course.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{course.description}</p>
                  <StudentsTable courseId={course._id} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Courses Enrolled */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">{t("workspace.userDetails.coursesEnrolled")}</h2>
          </div>
          <div className="p-6 space-y-4">
            {isEnrolledLoading && <p className="text-sm text-gray-500 dark:text-gray-400">{t("workspace.userDetails.loadingEnrolled")}</p>}
            {isEnrolledError && <p className="text-sm text-red-500">{t("workspace.userDetails.errorEnrolled")}</p>}
            {coursesbystudent?.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500">{t("workspace.userDetails.noEnrolled")}</p>}
            {coursesbystudent?.map((course) => (
              <div key={course._id} className="p-4 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-brand-200 dark:hover:border-brand-900/50 transition-colors">
                <h3 className="font-semibold text-gray-900 dark:text-white">{course.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{course.description}</p>
                <CourseProgress courseId={course._id} studentId={user._id} />
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {t("workspace.userDetails.activityDetails")}
                  </div>
                  {adminSnapLoading ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500">{t("workspace.userDetails.loading")}</p>
                  ) : (
                    <LearnerEnrollmentDetailPanel
                      snapshot={snapByCourseId.get(String(course._id))}
                      omitCourseHeading
                      suppressProgress
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

function AdminUserPublicProfileCard({ userId, user }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [publicAbout, setPublicAbout] = useState("");
  const [linkInputs, setLinkInputs] = useState([""]);

  useEffect(() => {
    setPublicAbout(typeof user.publicAbout === "string" ? user.publicAbout : "");
    const links = Array.isArray(user.publicProjectLinks) ? user.publicProjectLinks : [];
    setLinkInputs(links.length ? [...links, ""] : [""]);
  }, [userId, user.publicAbout, user.publicProjectLinks]);

  const { mutate, isPending: isSavingPublic } = useMutation({
    mutationFn: async () => {
      const publicProjectLinks = linkInputs
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 10);
      const formData = new FormData();
      formData.append("publicAbout", publicAbout.trim().slice(0, 4000));
      formData.append("publicProjectLinks", JSON.stringify(publicProjectLinks));
      const res = await axiosInstance.put(`/updateuserprofile/${userId}`, formData, {
        withCredentials: true,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userbyid", userId] });
      queryClient.invalidateQueries({ queryKey: ["public-user", userId] });
      toast.success(t("workspace.userDetails.profileSaved"));
    },
    onError: (e) => {
      toast.error(e?.response?.data?.message || t("workspace.userDetails.saveFailed"));
    },
  });

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">{t("workspace.userDetails.publicProfile")}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {t("workspace.userDetails.publicProfileDesc")}
          </p>
        </div>
        <Link
          to={paths.userPublic(userId)}
          className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1"
        >
          {t("workspace.userDetails.openUPage")}
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-bold uppercase text-gray-500">{t("workspace.userDetails.about")}</label>
          <textarea
            value={publicAbout}
            onChange={(e) => setPublicAbout(e.target.value.slice(0, 4000))}
            rows={4}
            className="mt-1 w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
            placeholder={t("workspace.userDetails.bioIntro")}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase text-gray-500">{t("workspace.userDetails.projectLinks")}</label>
          <div className="mt-1 space-y-2">
            {linkInputs.map((val, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="url"
                  value={val}
                  onChange={(e) => {
                    const next = [...linkInputs];
                    next[i] = e.target.value.slice(0, 500);
                    setLinkInputs(next);
                  }}
                  className="flex-1 h-9 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2"
                  placeholder="https://"
                />
                {linkInputs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setLinkInputs((rows) => rows.filter((_, j) => j !== i))}
                    className="p-2 text-gray-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {linkInputs.length < 10 && (
            <button
              type="button"
              onClick={() => setLinkInputs((r) => (r.length < 10 ? [...r, ""] : r))}
              className="mt-1 text-xs text-brand-600 font-medium inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              {t("workspace.userDetails.addLink")}
            </button>
          )}
        </div>
        <button
          type="button"
          disabled={isSavingPublic}
          onClick={() => mutate()}
          className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold disabled:opacity-50"
        >
          {isSavingPublic ? t("workspace.userDetails.savingShort") : t("workspace.userDetails.savePublicProfile")}
        </button>
      </div>
    </div>
  );
}

const InfoItem = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
    <span className="text-gray-400 dark:text-gray-500">{icon}</span>
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-800 dark:text-white capitalize">{value}</p>
    </div>
  </div>
);

const StudentsTable = ({ courseId }) => {
  const { t } = useTranslation();
  const { students, isLoading, isError } = useGetStudentsByCourse(courseId);

  if (isLoading) return <p className="text-xs text-gray-400 mt-3">{t("workspace.userDetails.loadingStudents")}</p>;
  if (isError) return <p className="text-xs text-red-400 mt-3">{t("workspace.userDetails.errorStudents")}</p>;
  const rows = (Array.isArray(students) ? students : []).filter(Boolean);
  if (rows.length === 0) return <p className="text-xs text-gray-400 mt-3">{t("workspace.userDetails.noStudents")}</p>;

  return (
    <div className="mt-4">
      <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-brand-600 dark:text-brand-400">
        <Users className="w-3.5 h-3.5" /> {t("workspace.userDetails.enrolledStudents")}
      </div>
      <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-sm">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
            <th className="p-2 text-start text-xs font-semibold text-gray-500 dark:text-gray-400">{t("workspace.userDetails.name")}</th>
            <th className="p-2 text-start text-xs font-semibold text-gray-500 dark:text-gray-400">{t("workspace.userDetails.email")}</th>
            <th className="p-2 text-start text-xs font-semibold text-gray-500 dark:text-gray-400">{t("workspace.userDetails.status")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((student, rowIdx) => (
            <tr
              key={student?._id ? String(student._id) : `enrolled-student-${rowIdx}`}
              className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
            >
              <td className="p-2 text-gray-800 dark:text-white font-medium">{student?.name ?? "—"}</td>
              <td className="p-2 text-gray-500 dark:text-gray-400">{student?.email ?? "—"}</td>
              <td className="p-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                  {student?.status ?? "—"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
};

const CourseProgress = ({ courseId, studentId }) => {
  const { t } = useTranslation();
  const { progressData, isLoading, isError } = useGetCourseProgress(courseId, studentId);

  if (isLoading) return <p className="text-xs text-gray-400 mt-3">{t("workspace.userDetails.loadingProgress")}</p>;
  if (isError) return <p className="text-xs text-red-400 mt-3">{t("workspace.userDetails.errorProgress")}</p>;

  const raw = progressData?.progress ?? progressData?.percentage ?? 0;
  const percentage = Math.round(Math.min(100, Math.max(0, Number(raw) || 0)));

  return (
    <div className="mt-4">
      <div className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400">
        <TrendingUp className="w-3.5 h-3.5" /> {t("workspace.userDetails.percentCompleted", { pct: percentage })}
      </div>
      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${percentage === 100 ? "bg-emerald-500" : "bg-brand-600"}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default UserDetailsPage;
