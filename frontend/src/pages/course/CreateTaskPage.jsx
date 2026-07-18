import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft, ClipboardList, FileText, BookOpenCheck, FileUp,
  Calendar, Link2, X, ChevronDown,
} from "lucide-react";
import { useCreateTask, useUpdateTask } from "../../api/task";
import { uploadRawFileToCloudinary } from "../../lib/cloudinaryClientUpload";
import toast from "react-hot-toast";

const TASK_TYPES = [
  {
    value: "assignment",
    icon: FileText,
    labelKey: "workspace.taskForm.typeAssignmentLabel",
    hintKey: "workspace.taskForm.typeAssignmentHint",
    active: "border-brand-400 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300",
    iconActive: "text-brand-500",
  },
  {
    value: "exam",
    icon: BookOpenCheck,
    labelKey: "workspace.taskForm.typeExamLabel",
    hintKey: "workspace.taskForm.typeExamHint",
    active: "border-amber-400 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300",
    iconActive: "text-amber-500",
  },
  {
    value: "resource",
    icon: FileUp,
    labelKey: "workspace.taskForm.typeResourceLabel",
    hintKey: "workspace.taskForm.typeResourceHint",
    active: "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300",
    iconActive: "text-emerald-500",
  },
];

const toInputValue = (d) => (d ? new Date(d).toISOString().slice(0, 16) : "");

export default function TaskForm() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const taskFromState = location.state?.task || null;
  const mode = location.state?.mode || "create";
  const passedCourseId = location.state?.courseId || null;
  const { courseId: paramCourseId } = useParams();
  const effectiveCourseId = passedCourseId || paramCourseId;

  const { createMyTask, isPending: isCreating } = useCreateTask(effectiveCourseId);
  const { updateMyTask, isPending: isUpdating } = useUpdateTask(effectiveCourseId);

  const [taskType, setTaskType] = useState("assignment");
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    startTime: "",
    endTime: "",
    resourceUrl: "",
    resourceFileName: "",
  });
  const [refLink, setRefLink] = useState({ url: "", label: "" });
  const [refLinkOpen, setRefLinkOpen] = useState(false);

  // Resource file upload state
  const [resourceFile, setResourceFile] = useState(null);
  const [resourceDragging, setResourceDragging] = useState(false);
  const [resourceProgress, setResourceProgress] = useState(0);
  const [isUploadingResource, setIsUploadingResource] = useState(false);
  const resourceFileRef = useRef(null);

  useEffect(() => {
    if (mode === "update" && taskFromState) {
      setTaskType(taskFromState.type || "assignment");
      setForm({
        title: taskFromState.title || "",
        description: taskFromState.description || "",
        dueDate: toInputValue(taskFromState.dueDate),
        startTime: toInputValue(taskFromState.examDetails?.startTime),
        endTime: toInputValue(taskFromState.examDetails?.endTime),
        resourceUrl: taskFromState.resourceUrl || "",
        resourceFileName: taskFromState.resourceFileName || "",
      });
      if (taskFromState.referenceLink?.url) {
        setRefLink({
          url: taskFromState.referenceLink.url,
          label: taskFromState.referenceLink.label || "",
        });
        setRefLinkOpen(true);
      }
    }
  }, [mode, taskFromState]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    let finalResourceUrl = form.resourceUrl;
    let finalResourceFileName = form.resourceFileName;

    if (taskType === "resource" && resourceFile) {
      setIsUploadingResource(true);
      try {
        const result = await uploadRawFileToCloudinary(resourceFile, {
          onProgress: setResourceProgress,
        });
        finalResourceUrl = result.secureUrl;
        if (!finalResourceFileName) {
          finalResourceFileName = result.originalFilename || resourceFile.name;
        }
      } catch (err) {
        toast.error(err.message || t("workspace.taskForm.uploadFailed"));
        setIsUploadingResource(false);
        return;
      } finally {
        setIsUploadingResource(false);
      }
    }

    if (taskType === "resource" && !finalResourceUrl) {
      toast.error(t("workspace.taskForm.addFile"));
      return;
    }

    const payload = {
      title: form.title,
      description: form.description,
      type: taskType,
      dueDate: taskType === "assignment" ? form.dueDate : null,
      examDetails:
        taskType === "exam"
          ? { startTime: form.startTime, endTime: form.endTime, questions: [] }
          : null,
      resourceUrl: taskType === "resource" ? finalResourceUrl : undefined,
      resourceFileName: taskType === "resource" ? finalResourceFileName : undefined,
      referenceLink:
        taskType !== "resource" && refLink.url.trim()
          ? { url: refLink.url.trim(), label: refLink.label.trim() }
          : undefined,
    };

    try {
      if (mode === "update" && taskFromState?._id) {
        await updateMyTask({ taskId: taskFromState._id, updatedFields: payload });
      } else {
        await createMyTask(payload);
      }
      navigate(-1);
    } catch {
      /* toast in hook */
    }
  };

  const inputClass =
    "w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow";

  const busy = isCreating || isUpdating || isUploadingResource;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 rtl-flip" /> {t("commonActions.back")}
        </button>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
            <ClipboardList className="w-5 h-5 text-brand-500" />
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {mode === "update" ? t("workspace.taskForm.editTask") : t("workspace.taskForm.newTask")}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {t("workspace.taskForm.headerHint")}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Type selector */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                {t("workspace.taskForm.taskType")}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {TASK_TYPES.map(({ value, icon: Icon, labelKey, hintKey, active, iconActive }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTaskType(value)}
                    className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-xs font-semibold transition-all ${
                      taskType === value
                        ? active
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 mb-0.5 ${
                        taskType === value ? iconActive : "text-gray-400"
                      }`}
                    />
                    <span>{t(labelKey)}</span>
                    <span className="text-[10px] font-normal opacity-60 leading-tight">{t(hintKey)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                {t("workspace.taskForm.title")}
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder={
                  taskType === "exam"
                    ? t("workspace.taskForm.titlePhExam")
                    : taskType === "resource"
                    ? t("workspace.taskForm.titlePhResource")
                    : t("workspace.taskForm.titlePhAssignment")
                }
                className={inputClass}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                {taskType === "resource" ? t("workspace.taskForm.descOptional") : t("workspace.taskForm.instructions")}
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder={
                  taskType === "resource"
                    ? t("workspace.taskForm.descPhResource")
                    : t("workspace.taskForm.descPhTask")
                }
                rows={3}
                className={`${inputClass} h-auto py-2 leading-relaxed`}
              />
            </div>

            {/* ── Assignment: due date ── */}
            {taskType === "assignment" && (
              <div className="p-4 rounded-xl border border-brand-200 dark:border-brand-800/50 bg-brand-50/30 dark:bg-brand-950/10">
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  <Calendar className="w-3.5 h-3.5" /> {t("workspace.taskForm.submissionDeadline")}
                </label>
                <input
                  type="datetime-local"
                  name="dueDate"
                  value={form.dueDate}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>
            )}

            {/* ── Exam: start / end ── */}
            {taskType === "exam" && (
              <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/30 dark:bg-amber-950/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    {t("workspace.taskForm.startTime")}
                  </label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    value={form.startTime}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    {t("workspace.taskForm.endTime")}
                  </label>
                  <input
                    type="datetime-local"
                    name="endTime"
                    value={form.endTime}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </div>
              </div>
            )}

            {/* ── Resource: drag-drop upload or URL ── */}
            {taskType === "resource" && (
              <div className="space-y-4 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/30 dark:bg-emerald-950/10">
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                  {t("workspace.taskForm.resourceIntro")}
                </p>

                {resourceFile ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-700">
                    <FileUp className="w-8 h-8 text-emerald-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                        {resourceFile.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {(resourceFile.size / 1024 / 1024).toFixed(1)} MB
                        {isUploadingResource &&
                          ` · ${t("workspace.taskForm.uploadingPct", { pct: Math.round(resourceProgress * 100) })}`}
                        {!isUploadingResource && resourceProgress === 1 && (
                          <span className="text-emerald-600 dark:text-emerald-400"> · {t("workspace.taskForm.ready")}</span>
                        )}
                      </p>
                      {isUploadingResource && (
                        <div className="mt-1.5 h-1 w-full rounded-full bg-emerald-100 dark:bg-emerald-900/40 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-[width] duration-200 rounded-full"
                            style={{ width: `${Math.round(resourceProgress * 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setResourceFile(null);
                        setResourceProgress(0);
                        if (resourceFileRef.current) resourceFileRef.current.value = "";
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        resourceFileRef.current?.click();
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setResourceDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setResourceDragging(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setResourceDragging(false);
                      const f = e.dataTransfer.files?.[0];
                      if (f) {
                        setResourceFile(f);
                        setForm((prev) => ({ ...prev, resourceFileName: f.name }));
                      }
                    }}
                    onClick={() => resourceFileRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-2.5 w-full h-28 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
                      resourceDragging
                        ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                        : "border-emerald-200 dark:border-emerald-800/50 hover:border-emerald-400 hover:bg-emerald-50/60 dark:hover:bg-emerald-900/10"
                    }`}
                  >
                    <FileUp
                      className={`w-7 h-7 ${
                        resourceDragging ? "text-emerald-500" : "text-emerald-400"
                      }`}
                    />
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      {resourceDragging ? t("workspace.taskForm.dropToAdd") : t("workspace.taskForm.clickOrDrag")}
                    </p>
                    <span className="text-[10px] text-emerald-500/70 uppercase tracking-wider">
                      {t("workspace.taskForm.fileTypes")}
                    </span>
                  </div>
                )}
                <input
                  ref={resourceFileRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setResourceFile(f);
                      setForm((prev) => ({ ...prev, resourceFileName: f.name }));
                    }
                  }}
                />

                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-emerald-100 dark:bg-emerald-900/40" />
                  <span className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-wider">
                    {t("workspace.taskForm.orPasteUrl")}
                  </span>
                  <div className="flex-1 h-px bg-emerald-100 dark:bg-emerald-900/40" />
                </div>

                <input
                  type="url"
                  name="resourceUrl"
                  value={form.resourceUrl}
                  onChange={(e) => {
                    setResourceFile(null);
                    handleChange(e);
                  }}
                  placeholder={t("workspace.taskForm.resourceUrlPh")}
                  className={inputClass}
                />

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    {t("workspace.taskForm.displayName")}
                  </label>
                  <input
                    type="text"
                    name="resourceFileName"
                    value={form.resourceFileName}
                    onChange={handleChange}
                    placeholder={t("workspace.taskForm.displayNamePh")}
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {/* ── Reference link (assignment + exam only) ── */}
            {taskType !== "resource" && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setRefLinkOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                    <Link2 className="w-4 h-4 text-gray-400" />
                    {t("workspace.taskForm.attachLink")}
                    {refLink.url && (
                      <span className="text-[10px] font-bold bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 px-1.5 py-0.5 rounded">
                        1
                      </span>
                    )}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                      refLinkOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {refLinkOpen && (
                  <div className="px-4 pb-4 pt-2 space-y-3 border-t border-gray-100 dark:border-gray-800 bg-sky-50/20 dark:bg-sky-950/10">
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
                      {t("workspace.taskForm.refLinkIntro")}
                    </p>

                    {/* Quick shortcuts */}
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { labelKey: "workspace.taskForm.shortcutZoom", prefix: "https://zoom.us/j/", defaultLabelKey: "workspace.taskForm.shortcutZoomDefault" },
                        { labelKey: "workspace.taskForm.shortcutForm", prefix: "https://forms.google.com/", defaultLabelKey: "workspace.taskForm.shortcutFormDefault" },
                        { labelKey: "workspace.taskForm.shortcutDoc", prefix: "https://docs.google.com/", defaultLabelKey: "workspace.taskForm.shortcutDocDefault" },
                        { labelKey: "workspace.taskForm.shortcutOther", prefix: "https://", defaultLabelKey: "workspace.taskForm.shortcutOtherDefault" },
                      ].map(({ labelKey, prefix, defaultLabelKey }) => (
                        <button
                          key={labelKey}
                          type="button"
                          onClick={() =>
                            setRefLink((prev) => ({
                              url: prefix,
                              label: prev.label || t(defaultLabelKey),
                            }))
                          }
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-sky-200 dark:border-sky-700 bg-white dark:bg-gray-900 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors"
                        >
                          {t(labelKey)}
                        </button>
                      ))}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                        {t("workspace.taskForm.url")}
                      </label>
                      <input
                        type="url"
                        value={refLink.url}
                        onChange={(e) =>
                          setRefLink((prev) => ({ ...prev, url: e.target.value }))
                        }
                        placeholder={t("workspace.taskForm.urlPh")}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                        {t("workspace.taskForm.buttonLabel")}
                      </label>
                      <input
                        type="text"
                        value={refLink.label}
                        onChange={(e) =>
                          setRefLink((prev) => ({ ...prev, label: e.target.value }))
                        }
                        placeholder={t("workspace.taskForm.buttonLabelPh")}
                        className={inputClass}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {t("workspace.taskForm.cancel")}
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUploadingResource
                  ? t("workspace.taskForm.uploadingPct", { pct: Math.round(resourceProgress * 100) })
                  : isCreating || isUpdating
                  ? t("workspace.taskForm.saving")
                  : mode === "update"
                  ? t("workspace.taskForm.saveChanges")
                  : t("workspace.taskForm.createTask")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
