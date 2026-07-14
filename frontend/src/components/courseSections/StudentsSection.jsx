import { useState, useMemo, useCallback, Fragment } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Users,
  ChevronDown,
  Eye,
  UserPlus,
  Search,
  Loader2,
  Megaphone,
} from "lucide-react";
import { UseGetAllUsers } from "../../api/admin";
import ExportCsvButton from "../admin/ExportCsvButton";
import LearnerEnrollmentDetailPanel from "./LearnerEnrollmentDetailPanel";

const toId = (id) => String(id ?? "");

/** Teacher roster segment for filtering enrolled learners. */
const ROSTER_STATUS_FILTERS = [
  { id: "all", labelKey: "workspace.studentsSection.statusAll" },
  { id: "active", labelKey: "workspace.studentsSection.statusActive" },
  { id: "inactive", labelKey: "workspace.studentsSection.statusInactive" },
  { id: "in_progress", labelKey: "workspace.studentsSection.statusInProgress" },
  { id: "completed", labelKey: "workspace.studentsSection.statusCompleted" },
  { id: "not_started", labelKey: "workspace.studentsSection.statusNotStarted" },
];

function classifyRosterStudent(student, progressRecord, snapshot) {
  const progress = Math.min(
    100,
    Math.max(
      0,
      Number(progressRecord?.progress ?? snapshot?.completionPercent ?? 0),
    ),
  );
  const isCompleted = Boolean(progressRecord?.isCompleted || progress >= 100);
  const isSuspended = student?.status === "suspended";
  const visits = Number(snapshot?.workspaceVisitCount ?? 0);
  const hasStarted = progress > 0 || visits > 0;

  if (isSuspended) return "inactive";
  if (isCompleted) return "completed";
  if (progress > 0) return "in_progress";
  if (!hasStarted) return "not_started";
  return "active";
}

function rosterStatusMatchesFilter(status, filterId) {
  if (filterId === "all") return true;
  if (filterId === "active") return status === "in_progress" || status === "active";
  if (filterId === "inactive") return status === "inactive" || status === "not_started";
  return status === filterId;
}

const ROSTER_STATUS_META = {
  completed: {
    labelKey: "workspace.studentsSection.statusCompleted",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  },
  in_progress: {
    labelKey: "workspace.studentsSection.statusInProgress",
    className: "bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200",
  },
  active: {
    labelKey: "workspace.studentsSection.statusActive",
    className: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
  },
  not_started: {
    labelKey: "workspace.studentsSection.statusNotStarted",
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  inactive: {
    labelKey: "workspace.studentsSection.statusInactive",
    className: "bg-amber-100 text-amber-900 dark:bg-amber-900/35 dark:text-amber-200",
  },
};

/**
 * Enrolled students table for a course. If the parent passes `onBulkEnroll`, an admin bulk-enroll
 * block appears above: pick users, then the parent sends their ids to the API.
 */
export default function StudentsSection({
  courseId,
  students = [],
  bulkprogressData = [],
  isLoading = false,
  onBulkEnroll,
  isBulkEnrolling = false,
  /** When set (e.g. admin course screen), show “Export roster CSV” for this course. */
  adminRosterExportCourseId,
  /** Teacher workspace: link to send in-app announcements (e.g. paths.sendAnnouncement). */
  announcementHref,
  /** From GET /courses/:courseId/roster-learners (admin / course owner). */
  learnerSnapshots = [],
  learnerSnapshotsLoading = false,
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);
  const [expandedStudentId, setExpandedStudentId] = useState(null);
  /** Roster filter (teacher view); separate from bulk-enroll search. */
  const [rosterSearch, setRosterSearch] = useState("");
  const [rosterStatusFilter, setRosterStatusFilter] = useState("all");

  // --- Bulk enrollment only (ignored when `onBulkEnroll` is omitted) ---
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("student");
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const { allusers, isLoading: usersLoading, isError: usersError } =
    UseGetAllUsers();

  /** Populated enrollments may contain null if a user document was deleted */
  const validStudents = useMemo(
    () => (students || []).filter((s) => s != null),
    [students],
  );

  const snapshotByStudentId = useMemo(() => {
    const m = new Map();
    for (const s of learnerSnapshots || []) {
      if (s?.studentId != null) m.set(String(s.studentId), s);
    }
    return m;
  }, [learnerSnapshots]);

  const rosterRows = useMemo(() => {
    return validStudents.map((student) => {
      const sid = toId(student._id);
      const record = bulkprogressData?.find((item) => toId(item.student) === sid);
      const snap = snapshotByStudentId.get(sid);
      const status = classifyRosterStudent(student, record, snap);
      const progress = Math.min(
        100,
        Math.max(
          0,
          Number(record?.progress ?? snap?.completionPercent ?? 0),
        ),
      );
      return { student, sid, record, snap, status, progress };
    });
  }, [validStudents, bulkprogressData, snapshotByStudentId]);

  const rosterStatusCounts = useMemo(() => {
    const counts = Object.fromEntries(ROSTER_STATUS_FILTERS.map((f) => [f.id, 0]));
    counts.all = rosterRows.length;
    for (const row of rosterRows) {
      for (const filter of ROSTER_STATUS_FILTERS) {
        if (filter.id === "all") continue;
        if (rosterStatusMatchesFilter(row.status, filter.id)) {
          counts[filter.id] += 1;
        }
      }
    }
    return counts;
  }, [rosterRows]);

  const filteredRosterStudents = useMemo(() => {
    let rows = rosterRows;
    if (onBulkEnroll) return rows;
    if (rosterStatusFilter !== "all") {
      rows = rows.filter((row) =>
        rosterStatusMatchesFilter(row.status, rosterStatusFilter),
      );
    }
    const q = rosterSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(({ student: s }) => {
      const name = (s.name || "").toLowerCase();
      const email = (s.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [onBulkEnroll, rosterRows, rosterStatusFilter, rosterSearch]);

  const enrolledIdSet = useMemo(
    () => new Set(validStudents.map((s) => toId(s._id))),
    [validStudents],
  );

  // Who can be selected: matches search + role, not yet enrolled
  const enrollCandidates = useMemo(() => {
    if (!allusers) return [];
    const q = search.trim().toLowerCase();
    return allusers.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (enrolledIdSet.has(toId(u._id))) return false;
      if (q && !(u.name || "").toLowerCase().includes(q) && !(u.email || "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allusers, search, roleFilter, enrolledIdSet]);

  // Row checkbox: add/remove one user id from the selection
  const toggleOne = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // Header checkbox: all rows currently visible in the bulk table
  const allVisibleSelected =
    enrollCandidates.length > 0 &&
    enrollCandidates.every((u) => selectedIds.has(toId(u._id)));

  // Select / clear every row in the current filtered list
  const toggleSelectAll = useCallback(() => {
    setSelectedIds(
      allVisibleSelected
        ? new Set()
        : new Set(enrollCandidates.map((u) => toId(u._id))),
    );
  }, [allVisibleSelected, enrollCandidates]);

  const selectedArray = useMemo(() => Array.from(selectedIds), [selectedIds]);

  // Parent (e.g. AdminCourseDetails) runs the mutation; this component stays UI-only
  const handleBulkEnrollClick = () => {
    if (!onBulkEnroll || selectedArray.length === 0 || isBulkEnrolling) return;
    onBulkEnroll(selectedArray);
  };

  const enrolledSection = (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden mb-4">
      <button
        type="button"
        onClick={() => setIsOpen((p) => !p)}
        className="w-full px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors text-start"
      >
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
          <Users className="w-5 h-5 text-brand-500" />
          {t("workspace.studentsSection.enrolledStudents")}
        </h3>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {announcementHref && !onBulkEnroll ? (
            <div onClick={(e) => e.stopPropagation()}>
              <Link
                to={announcementHref}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
              >
                <Megaphone className="w-3.5 h-3.5 shrink-0" aria-hidden />
                {t("workspace.quickActions.messageStudents")}
              </Link>
            </div>
          ) : null}
          {adminRosterExportCourseId ? (
            <div onClick={(e) => e.stopPropagation()}>
              <ExportCsvButton
                exportKey="enrollments"
                params={{ courseId: adminRosterExportCourseId }}
                label={t("workspace.studentsSection.rosterCsv")}
                className="py-1.5 px-2.5 text-[11px]"
              />
            </div>
          ) : null}
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {t("workspace.studentsSection.studentCount", { count: validStudents.length })}
          </span>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {isLoading ? (
          <div className="px-5 py-5 space-y-3">
            <div className="h-12 bg-gray-50 dark:bg-gray-800/60 rounded-lg animate-pulse" />
            <div className="h-12 bg-gray-50 dark:bg-gray-800/60 rounded-lg animate-pulse" />
            <div className="h-12 bg-gray-50 dark:bg-gray-800/60 rounded-lg animate-pulse" />
          </div>
        ) : !validStudents.length ? (
          <div className="px-5 py-8 text-center">
            <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              {t("workspace.studentsSection.noEnrolled")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {!onBulkEnroll && validStudents.length > 0 ? (
              <div className="px-5 pt-4 pb-2 space-y-3">
                <div className="relative max-w-sm">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="search"
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    placeholder={t("workspace.studentsSection.searchPlaceholder")}
                    className="w-full h-9 ps-9 pe-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    aria-label={t("workspace.studentsSection.searchAria")}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    {t("workspace.studentsSection.filter")}
                  </span>
                  {ROSTER_STATUS_FILTERS.map((filter) => {
                    const count = rosterStatusCounts[filter.id] ?? 0;
                    const selected = rosterStatusFilter === filter.id;
                    return (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => setRosterStatusFilter(filter.id)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                          selected
                            ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                        }`}
                      >
                        {t(filter.labelKey)}
                        <span
                          className={`tabular-nums ${
                            selected
                              ? "text-white/75 dark:text-gray-900/70"
                              : "text-gray-400 dark:text-gray-500"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {(rosterSearch.trim() || rosterStatusFilter !== "all") &&
                filteredRosterStudents.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("workspace.studentsSection.noMatch")}
                  </p>
                ) : null}
              </div>
            ) : null}
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/60">
                  <th className="px-5 py-2.5 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {t("workspace.studentsSection.colStudent")}
                  </th>
                  <th className="px-5 py-2.5 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {t("workspace.studentsSection.colStatus")}
                  </th>
                  <th className="px-5 py-2.5 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {t("workspace.studentsSection.colProgress")}
                  </th>
                  <th className="px-5 py-2.5 text-end text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {t("workspace.studentsSection.colActions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredRosterStudents.map(({ student, sid, progress, snap, status }) => {
                  const expanded = expandedStudentId === sid;
                  const statusMeta = ROSTER_STATUS_META[status] || ROSTER_STATUS_META.not_started;
                  return (
                    <Fragment key={sid || "student-row"}>
                    <tr
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-gray-800 dark:text-white">
                          {student.name}
                        </p>
                        {student.email && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {student.email}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${statusMeta.className}`}
                        >
                          {t(statusMeta.labelKey)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                progress === 100
                                  ? "bg-emerald-500"
                                  : "bg-brand-500"
                              }`}
                              style={{
                                width: `${Math.min(100, progress)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 tabular-nums w-8">
                            {progress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-end">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedStudentId((cur) =>
                                cur === sid ? null : sid,
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform shrink-0 ${
                                expanded ? "rotate-180" : ""
                              }`}
                              aria-hidden
                            />
                            {expanded ? t("workspace.studentsSection.hideDetails") : t("workspace.studentsSection.details")}
                          </button>
                          <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/courses/${courseId}/students/${student._id}`,
                              {
                                state: {
                                  student,
                                  course: { _id: courseId },
                                },
                              },
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/50 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {t("workspace.studentsSection.open")}
                        </button>
                        </div>
                      </td>
                    </tr>
                    {expanded ? (
                      <tr className="bg-gray-50/95 dark:bg-gray-800/40">
                        <td
                          colSpan={4}
                          className="px-5 py-4 border-t border-gray-100 dark:border-gray-800"
                        >
                          {learnerSnapshotsLoading ? (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                              {t("workspace.studentsSection.loadingDetails")}
                            </div>
                          ) : (
                            <LearnerEnrollmentDetailPanel
                              snapshot={snap}
                              suppressProgress
                              omitCourseHeading
                            />
                          )}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  if (!onBulkEnroll) {
    return <>{enrolledSection}</>;
  }

  return (
    <>
      {/* Bulk enrollment UI → `onBulkEnroll(ids)` → api/payment `useBulkEnrollStudents` → POST /enroll/:courseId/bulk */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden mb-4">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-brand-500" />
            {t("workspace.studentsSection.bulkEnrollment")}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-end max-w-md">
            {t("workspace.studentsSection.bulkHint")}
          </p>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                name="search"
                placeholder={t("workspace.studentsSection.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 ps-10 pe-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 sm:w-44"
            >
              <option value="all">{t("workspace.studentsSection.roleAll")}</option>
              <option value="student">{t("workspace.studentsSection.roleStudents")}</option>
              <option value="teacher">{t("workspace.studentsSection.roleTeachers")}</option>
              <option value="admin">{t("workspace.studentsSection.roleAdmins")}</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleBulkEnrollClick}
              disabled={
                selectedArray.length === 0 || isBulkEnrolling || usersLoading
              }
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              {isBulkEnrolling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("workspace.studentsSection.enrolling")}
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  {t("workspace.studentsSection.enrollSelected", { count: selectedArray.length })}
                </>
              )}
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {selectedArray.length > 0
                ? t("workspace.studentsSection.selectedCount", { count: selectedArray.length })
                : t("workspace.studentsSection.selectPrompt")}
            </span>
          </div>

          {usersError && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {t("workspace.studentsSection.loadError")}
            </p>
          )}

          {usersLoading ? (
            <div className="space-y-2 pt-1">
              <div className="h-14 bg-gray-50 dark:bg-gray-800/60 rounded-lg animate-pulse" />
              <div className="h-14 bg-gray-50 dark:bg-gray-800/60 rounded-lg animate-pulse" />
              <div className="h-14 bg-gray-50 dark:bg-gray-800/60 rounded-lg animate-pulse" />
            </div>
          ) : enrollCandidates.length === 0 ? (
            <div className="text-center py-8 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
              <Users className="w-9 h-9 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {!allusers?.length
                  ? t("workspace.studentsSection.noUsersMatch")
                  : t("workspace.studentsSection.allEnrolled")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/60">
                    <th className="w-12 px-3 py-2.5">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 dark:border-gray-600 text-brand-600 focus:ring-brand-500"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAll}
                        aria-label={t("workspace.studentsSection.selectAllAria")}
                      />
                    </th>
                    <th className="px-3 py-2.5 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {t("workspace.studentsSection.colUser")}
                    </th>
                    <th className="px-3 py-2.5 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {t("workspace.studentsSection.colRole")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {enrollCandidates.map((user) => {
                    const uid = toId(user._id);
                    const checked = selectedIds.has(uid);
                    return (
                      <tr
                        key={uid}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                      >
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 dark:border-gray-600 text-brand-600 focus:ring-brand-500"
                            checked={checked}
                            onChange={() => toggleOne(uid)}
                            aria-label={t("workspace.studentsSection.selectUserAria", { name: user.name || user.email })}
                          />
                        </td>
                        <td className="px-3 py-3">
                          <p className="font-medium text-gray-800 dark:text-white">
                            {user.name || "—"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {user.email}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 capitalize">
                            {user.role || "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {enrolledSection}
    </>
  );
}
