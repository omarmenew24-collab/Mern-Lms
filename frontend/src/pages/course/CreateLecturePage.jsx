import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Upload, Video, X, ArrowLeft, Film, FileText, Link2, Type, ChevronDown, Plus, Trash2, Paperclip, FileUp, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  useCreateLecture,
  useUpdateLecture,
  getVimeoUploadStatus,
  initVimeoLectureUpload,
} from "../../api/lecture";
import { getCloudinaryVideoConfig, uploadVideoToCloudinary, uploadRawFileToCloudinary } from "../../lib/cloudinaryClientUpload";
import { uploadFileToVimeoTus } from "../../lib/vimeoTusUpload";
import { safeHttpUrl } from "../../lib/safeHttpUrl";

function extractVimeoIdFromPageUrl(s) {
  try {
    const u = new URL(s);
    if (!u.hostname.includes("vimeo.com") || u.hostname.startsWith("player.")) return "";
    const id = u.pathname.split("/").filter(Boolean).find((p) => /^\d+$/.test(p));
    return id || "";
  } catch {
    return "";
  }
}

export default function LectureForm() {
  const { t } = useTranslation();
  const { courseId, lectureId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const existingLecture = location.state?.lecture || null;
  const prefillLevel = location.state?.prefillLevel;
  const prefillLevelTitle = location.state?.prefillLevelTitle;
  const prefillOrder = location.state?.prefillOrder;
  const prefillContentType = location.state?.prefillContentType;
  const isEditMode = !!lectureId && !!existingLecture;

  const { createMyLecture, isPending: isCreating } = useCreateLecture(courseId);
  const { saveLecture, isPending: isUpdating } = useUpdateLecture(courseId);
  const isApiPending = isCreating || isUpdating;
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [cloudinaryProgress, setCloudinaryProgress] = useState(0);
  const [vimeoServerReady, setVimeoServerReady] = useState(false);
  const [vimeoStatusLoaded, setVimeoStatusLoaded] = useState(false);
  const [uploadSource, setUploadSource] = useState(/** @type {"vimeo" | "cloudinary"} */ ("vimeo"));
  const [videoInputMode, setVideoInputMode] = useState(/** @type {"file" | "link"} */ ("file"));
  const [pastedUrl, setPastedUrl] = useState("");

  const { isConfigured: cloudinaryConfigured } = getCloudinaryVideoConfig();

  const [contentType, setContentType] = useState(prefillContentType || "video");
  const [form, setForm] = useState({
    title: "",
    description: "",
    levelNumber: prefillLevel || 1,
    levelTitle: prefillLevelTitle || "Beginner",
    duration: "",
    order: prefillOrder ?? 0,
    isFreePreview: false,
    fileUrl: "",
    fileName: "",
    linkUrl: "",
    linkLabel: "",
    textContent: "",
  });
  const [attachments, setAttachments] = useState([]);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  // Raw file upload state (for "file" content type)
  const [rawFile, setRawFile] = useState(null);
  const [rawFileProgress, setRawFileProgress] = useState(0);
  const [isUploadingRaw, setIsUploadingRaw] = useState(false);
  const [rawFileDragging, setRawFileDragging] = useState(false);
  const rawFileInputRef = useRef(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const blobUrlRef = useRef(null);
  const cloudinaryAbortRef = useRef(null);

  const revokeBlob = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  };

  useEffect(() => {
    if (isEditMode && existingLecture) {
      const ct = existingLecture.contentType || "video";
      setContentType(ct);
      setForm({
        title: existingLecture.title || "",
        description: existingLecture.description || "",
        levelNumber: existingLecture.level?.number || 1,
        levelTitle: existingLecture.level?.title || "Beginner",
        duration: existingLecture.duration != null && existingLecture.duration !== "" ? String(existingLecture.duration) : "",
        order: existingLecture.order ?? 0,
        isFreePreview: Boolean(existingLecture.isFreePreview),
        fileUrl: existingLecture.fileUrl || "",
        fileName: existingLecture.fileName || "",
        linkUrl: existingLecture.linkUrl || "",
        linkLabel: existingLecture.linkLabel || "",
        textContent: existingLecture.textContent || "",
      });
      if (existingLecture.attachments?.length) {
        setAttachments(existingLecture.attachments.map((a) => ({ url: a.url || "", fileName: a.fileName || "" })));
        setAttachmentsOpen(true);
      }
      if (ct === "video" && existingLecture.videoUrl) {
        setVideoPreview(existingLecture.videoUrl);
        setPastedUrl(existingLecture.videoUrl);
        setVideoInputMode("link");
      }
    }
  }, [isEditMode, existingLecture]);

  useEffect(() => {
    if (!courseId) return;
    let cancel = false;
    (async () => {
      try {
        const { configured } = await getVimeoUploadStatus(courseId);
        if (cancel) return;
        setVimeoServerReady(!!configured);
        if (!configured) setUploadSource("cloudinary");
      } catch {
        if (!cancel) {
          setVimeoServerReady(false);
          setUploadSource("cloudinary");
        }
      } finally {
        if (!cancel) setVimeoStatusLoaded(true);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [courseId]);

  useEffect(() => {
    return () => {
      // Ensure in-flight Cloudinary upload stops when leaving this page.
      if (cloudinaryAbortRef.current) {
        cloudinaryAbortRef.current.abort();
        cloudinaryAbortRef.current = null;
      }
    };
  }, []);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleVideoSelect = useCallback(
    (file) => {
      if (!file || !file.type.startsWith("video/")) return;
      setVideoInputMode("file");
      setVideoFile(file);
      revokeBlob();
      const url = URL.createObjectURL(file);
      blobUrlRef.current = url;
      setVideoPreview(url);
    },
    [],
  );

  const handleFileInputChange = (e) => handleVideoSelect(e.target.files?.[0]);
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      handleVideoSelect(e.dataTransfer.files?.[0]);
    },
    [handleVideoSelect],
  );

  const clearVideo = () => {
    revokeBlob();
    setVideoFile(null);
    setPastedUrl(isEditMode ? existingLecture?.videoUrl || "" : "");
    setVideoPreview(isEditMode ? existingLecture?.videoUrl || "" : "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCancel = () => {
    if (cloudinaryAbortRef.current) {
      cloudinaryAbortRef.current.abort();
      cloudinaryAbortRef.current = null;
    }
    navigate(-1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const level = { number: Number(form.levelNumber), title: form.levelTitle };
    const order = Number(form.order);
    let durationVal =
      form.duration !== "" && form.duration != null
        ? Number(form.duration)
        : undefined;
    if (Number.isNaN(durationVal)) durationVal = undefined;

    const basePayload = {
      title: form.title,
      description: form.description,
      contentType,
      level,
      order,
      isFreePreview: Boolean(form.isFreePreview),
    };
    if (durationVal !== undefined) basePayload.duration = durationVal;
    if (contentType === "file") {
      basePayload.fileUrl = form.fileUrl;
      basePayload.fileName = form.fileName;
    }
    if (contentType === "link") {
      basePayload.linkUrl = form.linkUrl;
      basePayload.linkLabel = form.linkLabel;
    }
    if (contentType === "text") {
      basePayload.textContent = form.textContent;
    }
    const validAttachments = attachments.filter((a) => a.url.trim());
    if (validAttachments.length > 0) {
      basePayload.attachments = validAttachments;
    } else {
      basePayload.attachments = [];
    }

    // Non-video types: save directly without video upload logic
    if (contentType !== "video") {
      if (contentType === "link" && !form.linkUrl.trim()) {
        toast.error(t("workspace.lectureForm.provideUrl"));
        return;
      }

      // For "file" type: if user picked a local file, upload it first
      if (contentType === "file" && rawFile) {
        setIsUploadingRaw(true);
        try {
          const result = await uploadRawFileToCloudinary(rawFile, {
            onProgress: setRawFileProgress,
          });
          basePayload.fileUrl = result.secureUrl;
          if (!basePayload.fileName) {
            basePayload.fileName = result.originalFilename || rawFile.name;
          }
        } catch (err) {
          toast.error(err.message || t("workspace.lectureForm.fileUploadFailed"));
          setIsUploadingRaw(false);
          return;
        } finally {
          setIsUploadingRaw(false);
        }
      }

      if (contentType === "file" && !basePayload.fileUrl) {
        toast.error(t("workspace.taskForm.addFile"));
        return;
      }

      try {
        if (isEditMode) {
          await saveLecture({ lectureId, ...basePayload });
        } else {
          await createMyLecture(basePayload);
        }
        navigate(-1);
      } catch {
        /* toast in hook */
      }
      return;
    }

    const safeLink = videoInputMode === "link" ? safeHttpUrl(pastedUrl) : null;

    if (videoInputMode === "link" && safeLink && !videoFile) {
      const vimeoId = extractVimeoIdFromPageUrl(safeLink);
      if (isEditMode && !videoFile) {
        try {
          await saveLecture({
            lectureId,
            ...basePayload,
            videoUrl: safeLink,
            vimeoVideoId: vimeoId || "",
          });
          navigate(-1);
        } catch {
          /* toast in hook */
        }
        return;
      }
      if (!isEditMode) {
        try {
          await createMyLecture({
            ...basePayload,
            videoUrl: safeLink,
            ...(vimeoId ? { vimeoVideoId: vimeoId } : {}),
          });
          navigate(-1);
        } catch {
          /* toast in hook */
        }
        return;
      }
    }

    if (isEditMode && !videoFile) {
      if (videoInputMode === "link" && !safeLink) {
        if (pastedUrl.trim()) {
          toast.error(t("workspace.lectureForm.validVideoUrl"));
          return;
        }
        if (!existingLecture?.videoUrl && !existingLecture?.vimeoVideoId) {
          toast.error(t("workspace.lectureForm.addFileOrLink"));
        } else {
          try {
            await saveLecture({ lectureId, ...basePayload });
            navigate(-1);
          } catch {
            /* */
          }
        }
        return;
      }
      if (videoInputMode === "file") {
        if (!existingLecture?.videoUrl && !existingLecture?.vimeoVideoId) {
          toast.error(t("workspace.lectureForm.noVideoSelect"));
          return;
        }
        try {
          await saveLecture({ lectureId, ...basePayload });
          navigate(-1);
        } catch {
          /* toast in hook */
        }
        return;
      }
    }

    if (!isEditMode && videoInputMode === "link" && !safeLink) {
      toast.error(t("workspace.lectureForm.pasteValidLink"));
      return;
    }

    if (!isEditMode && videoInputMode === "file" && !videoFile) {
      toast.error(t("workspace.lectureForm.chooseVideoOrLink"));
      return;
    }

    if (uploadSource === "vimeo") {
      if (!vimeoServerReady) {
        toast.error(t("workspace.lectureForm.vimeoNotConfigured"));
        return;
      }
    } else if (videoFile && !cloudinaryConfigured) {
      toast.error(t("workspace.lectureForm.cloudinaryNotConfigured"));
      return;
    }

    if (!videoFile) return;

    setIsUploadingVideo(true);
    setCloudinaryProgress(0);

    try {
      if (uploadSource === "vimeo") {
        const { videoId, uploadLink } = await initVimeoLectureUpload(courseId, {
          fileName: videoFile.name,
          fileSize: videoFile.size,
        });
        if (!uploadLink) {
          throw new Error(t("workspace.lectureForm.vimeoNoLink"));
        }
        await uploadFileToVimeoTus(videoFile, uploadLink, {
          onProgress: (r) => setCloudinaryProgress(r),
        });
        if (isEditMode) {
          await saveLecture({ lectureId, ...basePayload, vimeoVideoId: videoId });
        } else {
          await createMyLecture({ ...basePayload, vimeoVideoId: videoId });
        }
      } else {
        const controller = new AbortController();
        cloudinaryAbortRef.current = controller;
        const { secureUrl, duration: cloudinaryDuration } = await uploadVideoToCloudinary(videoFile, {
          onProgress: (r) => setCloudinaryProgress(r),
          signal: controller.signal,
        });
        cloudinaryAbortRef.current = null;
        let d = durationVal;
        if (cloudinaryDuration != null && (d === undefined || form.duration === "")) {
          d = cloudinaryDuration;
        }
        const withDur = d !== undefined ? { ...basePayload, duration: d } : basePayload;
        if (isEditMode) {
          await saveLecture({ lectureId, ...withDur, videoUrl: secureUrl, vimeoVideoId: "" });
        } else {
          await createMyLecture({ ...withDur, videoUrl: secureUrl });
        }
      }
      navigate(-1);
    } catch (err) {
      cloudinaryAbortRef.current = null;
      if (err?.message === "Upload cancelled" || err?.message === "Upload aborted") return;
      toast.error(err?.message || t("workspace.lectureForm.uploadFailed"));
    } finally {
      setIsUploadingVideo(false);
      setCloudinaryProgress(0);
    }
  };

  const safeLinkForUi = videoInputMode === "link" ? safeHttpUrl(pastedUrl) : null;
  const hasVideo =
    !!videoFile ||
    (videoInputMode === "link" && !!safeLinkForUi) ||
    (isEditMode && !!(existingLecture?.videoUrl || existingLecture?.vimeoVideoId));
  const canSubmitNew =
    contentType !== "video" ||
    (videoInputMode === "file" && !!videoFile) ||
    (videoInputMode === "link" && !!safeLinkForUi);
  const busy = isApiPending || isUploadingVideo || isUploadingRaw;
  const uploadLabel =
    uploadSource === "vimeo" ? t("workspace.lectureForm.uploadLabelVimeo") : t("workspace.lectureForm.uploadLabelCloudinary");
  const inputClass =
    "w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          type="button"
          onClick={handleCancel}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 rtl-flip" /> {t("workspace.lectureForm.backToCourse")}
        </button>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
            <Film className="w-5 h-5 text-brand-500" />
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {isEditMode ? t("workspace.lectureForm.editLecture") : t("workspace.lectureForm.newLecture")}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <strong>{t("workspace.lectureForm.headerVimeoBold")}</strong>{t("workspace.lectureForm.headerVimeoText")}
                <strong>{t("workspace.lectureForm.headerCloudinaryBold")}</strong>{t("workspace.lectureForm.headerCloudinaryText")}
              </p>
            </div>
          </div>

          {vimeoStatusLoaded && videoInputMode === "file" && (
            <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-800 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!vimeoServerReady}
                onClick={() => setUploadSource("vimeo")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  uploadSource === "vimeo"
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                Vimeo
              </button>
              <button
                type="button"
                onClick={() => setUploadSource("cloudinary")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  uploadSource === "cloudinary"
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                }`}
              >
                Cloudinary
              </button>
              {uploadSource === "vimeo" && !vimeoServerReady && (
                <p className="w-full text-[10px] text-amber-700 dark:text-amber-300 text-start">
                  {t("workspace.lectureForm.vimeoNote1")}<code className="font-mono">VIMEO_ACCESS_TOKEN</code>{t("workspace.lectureForm.vimeoNote2")}<code className="font-mono">.env</code>{t("workspace.lectureForm.vimeoNote3")}
                </p>
              )}
            </div>
          )}

          {uploadSource === "cloudinary" && videoInputMode === "file" && videoFile && !cloudinaryConfigured && (
            <div className="px-6 py-3 text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-100 dark:border-amber-900">
              {t("workspace.lectureForm.cloudSet")}<code className="font-mono">VITE_CLOUDINARY_CLOUD_NAME</code>{t("workspace.lectureForm.cloudAnd")}
              <code className="font-mono">VITE_CLOUDINARY_VIDEO_UPLOAD_PRESET</code>{t("workspace.lectureForm.cloudIn")}<code className="font-mono">frontend/.env</code>{t("workspace.lectureForm.cloudPreset")}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Content type selector */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">{t("workspace.lectureForm.contentType")}</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { value: "video", icon: Video, label: t("workspace.lectureForm.typeVideo"), active: "border-brand-400 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300" },
                  { value: "file", icon: FileUp, label: t("workspace.lectureForm.typeFile"), active: "border-amber-400 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300" },
                  { value: "link", icon: Link2, label: t("workspace.lectureForm.typeLink"), active: "border-sky-400 bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-300" },
                  { value: "text", icon: Type, label: t("workspace.lectureForm.typeText"), active: "border-violet-400 bg-violet-50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-300" },
                ].map(({ value, icon: Icon, label, active }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setContentType(value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      contentType === value
                        ? active
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* File-type fields */}
            {contentType === "file" && (
              <div className="space-y-4 p-4 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/30 dark:bg-amber-950/10">
                <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                  {t("workspace.lectureForm.fileIntro")}
                </p>

                {/* File picker / upload zone */}
                {rawFile ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-800/50">
                    <FileUp className="w-8 h-8 text-amber-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{rawFile.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {(rawFile.size / 1024 / 1024).toFixed(1)} MB
                        {isUploadingRaw && ` · ${t("workspace.taskForm.uploadingPct", { pct: Math.round(rawFileProgress * 100) })}`}
                        {!isUploadingRaw && rawFileProgress === 1 && (
                          <span className="text-emerald-600 dark:text-emerald-400"> · {t("workspace.lectureForm.readyToSave")}</span>
                        )}
                      </p>
                      {isUploadingRaw && (
                        <div className="mt-1.5 h-1 w-full rounded-full bg-amber-100 dark:bg-amber-900/40 overflow-hidden">
                          <div
                            className="h-full bg-amber-500 transition-[width] duration-200 rounded-full"
                            style={{ width: `${Math.round(rawFileProgress * 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => { setRawFile(null); setRawFileProgress(0); if (rawFileInputRef.current) rawFileInputRef.current.value = ""; }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") rawFileInputRef.current?.click(); }}
                    onDragOver={(e) => { e.preventDefault(); setRawFileDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setRawFileDragging(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setRawFileDragging(false);
                      const f = e.dataTransfer.files?.[0];
                      if (f) { setRawFile(f); setForm((prev) => ({ ...prev, fileUrl: "", fileName: f.name })); }
                    }}
                    onClick={() => rawFileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-2.5 w-full h-32 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
                      rawFileDragging
                        ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20"
                        : "border-amber-200 dark:border-amber-800/50 hover:border-amber-400 hover:bg-amber-50/60 dark:hover:bg-amber-900/10"
                    }`}
                  >
                    <FileUp className={`w-7 h-7 ${rawFileDragging ? "text-amber-500" : "text-amber-400"}`} />
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                      {rawFileDragging ? t("workspace.taskForm.dropToAdd") : t("workspace.taskForm.clickOrDrag")}
                    </p>
                    <span className="text-[10px] text-amber-500/70 uppercase tracking-wider">{t("workspace.taskForm.fileTypes")}</span>
                  </div>
                )}
                <input
                  ref={rawFileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { setRawFile(f); setForm((prev) => ({ ...prev, fileName: f.name })); }
                  }}
                />

                {/* OR paste a URL */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-amber-100 dark:bg-amber-900/40" />
                  <span className="text-[10px] font-bold text-amber-500/60 uppercase tracking-wider">{t("workspace.taskForm.orPasteUrl")}</span>
                  <div className="flex-1 h-px bg-amber-100 dark:bg-amber-900/40" />
                </div>
                <input
                  type="url"
                  name="fileUrl"
                  value={form.fileUrl}
                  onChange={(e) => { setRawFile(null); handleChange(e); }}
                  placeholder={t("workspace.lectureForm.fileUrlPlaceholder")}
                  className={inputClass}
                />

                {/* Display name */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t("workspace.lectureForm.displayName")}</label>
                  <input
                    type="text"
                    name="fileName"
                    value={form.fileName}
                    onChange={handleChange}
                    placeholder={t("workspace.lectureForm.fileNamePlaceholder")}
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {/* Link-type fields */}
            {contentType === "link" && (
              <div className="space-y-3.5 p-4 rounded-xl border border-sky-200 dark:border-sky-800/50 bg-sky-50/30 dark:bg-sky-950/10">
                {/* Quick-select shortcuts */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-2">{t("workspace.lectureForm.quickStart")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { labelKey: "workspace.lectureForm.scZoom", prefix: "https://zoom.us/j/", defaultLabelKey: "workspace.lectureForm.scZoomDefault" },
                      { labelKey: "workspace.lectureForm.scMeet", prefix: "https://meet.google.com/", defaultLabelKey: "workspace.lectureForm.scMeetDefault" },
                      { labelKey: "workspace.lectureForm.scTeams", prefix: "https://teams.microsoft.com/l/meetup-join/", defaultLabelKey: "workspace.lectureForm.scTeamsDefault" },
                      { labelKey: "workspace.lectureForm.scOther", prefix: "https://", defaultLabelKey: "workspace.lectureForm.scOtherDefault" },
                    ].map(({ labelKey, prefix, defaultLabelKey }) => (
                      <button
                        key={labelKey}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, linkUrl: prefix, linkLabel: prev.linkLabel || t(defaultLabelKey) }))}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-sky-200 dark:border-sky-700 bg-white dark:bg-gray-900 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors"
                      >
                        {t(labelKey)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t("workspace.lectureForm.linkUrl")}</label>
                  <input
                    type="url"
                    name="linkUrl"
                    value={form.linkUrl}
                    onChange={handleChange}
                    placeholder={t("workspace.lectureForm.linkUrlPlaceholder")}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t("workspace.lectureForm.buttonLabel")}</label>
                  <input
                    type="text"
                    name="linkLabel"
                    value={form.linkLabel}
                    onChange={handleChange}
                    placeholder={t("workspace.lectureForm.buttonLabelPlaceholder")}
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {/* Text-type fields */}
            {contentType === "text" && (
              <div className="space-y-3 p-4 rounded-xl border border-violet-200 dark:border-violet-800/50 bg-violet-50/20 dark:bg-violet-950/10">
                <p className="text-[11px] text-violet-700 dark:text-violet-300 font-medium">
                  {t("workspace.lectureForm.textIntro")}
                </p>
                <textarea
                  name="textContent"
                  value={form.textContent}
                  onChange={handleChange}
                  rows={10}
                  placeholder={t("workspace.lectureForm.textPlaceholder")}
                  className={`${inputClass} h-auto py-2.5 leading-relaxed`}
                />
              </div>
            )}

            {/* Video upload section — only shown for video content type */}
            {contentType === "video" && (
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setVideoInputMode("file");
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                    videoInputMode === "file"
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {t("workspace.lectureForm.uploadFile")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVideoInputMode("link");
                    revokeBlob();
                    setVideoFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                    const fromCourse = isEditMode && existingLecture?.videoUrl ? existingLecture.videoUrl : "";
                    setPastedUrl(fromCourse);
                    setVideoPreview(fromCourse);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                    videoInputMode === "link"
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {t("workspace.lectureForm.pasteLink")}
                </button>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2">
                <strong>{t("workspace.lectureForm.pasteLinkBold")}</strong>{t("workspace.lectureForm.pasteLinkText")}<span className="font-mono">https://vimeo.com/123456789</span>{t("workspace.lectureForm.pasteLinkText2")}<strong>{t("workspace.lectureForm.uploadFileBold")}</strong>{t("workspace.lectureForm.uploadFileText")}
              </p>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">{t("workspace.lectureForm.lectureVideo")}</label>
              {videoInputMode === "link" ? (
                <div>
                  <input
                    type="url"
                    value={pastedUrl}
                    onChange={(e) => {
                      setPastedUrl(e.target.value);
                      setVideoPreview(safeHttpUrl(e.target.value) || "");
                    }}
                    placeholder={t("workspace.lectureForm.videoLinkPlaceholder")}
                    className={inputClass}
                  />
                </div>
              ) : hasVideo ? (
                <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-black">
                  {videoFile ? (
                    <video src={videoPreview} controls className="w-full max-h-56 object-contain" />
                  ) : videoPreview ? (
                    <div className="flex items-center justify-center h-36 bg-gray-900">
                      <Video className="w-8 h-8 text-white/50" />
                      <span className="ms-3 text-sm text-white/50">{t("workspace.lectureForm.currentVideo")}</span>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={clearVideo}
                    className="absolute top-2 end-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition"
                    title={t("workspace.lectureForm.removeRevert")}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter" || ev.key === " ") {
                      ev.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-3 w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                    isDragging ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20" : "border-gray-300 dark:border-gray-700 hover:border-brand-400"
                  }`}
                >
                  <Upload className={`w-8 h-8 ${isDragging ? "text-brand-500" : "text-gray-400"}`} />
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">{t("workspace.lectureForm.dragDrop")}</p>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">{t("workspace.lectureForm.videoFormats")}</span>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileInputChange} className="hidden" />
              {isUploadingVideo && (
                <div className="mt-2">
                  <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className="h-full bg-brand-500 transition-[width] duration-200"
                      style={{ width: `${Math.round(cloudinaryProgress * 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    {uploadLabel} {Math.round(cloudinaryProgress * 100)}%
                  </p>
                </div>
              )}
            </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5" htmlFor="lecture-title">
                {t("workspace.courseEdit.title")}
              </label>
              <input
                id="lecture-title"
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder={t("workspace.lectureForm.titlePlaceholder")}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5" htmlFor="lecture-desc">
                {t("workspace.courseEdit.description")}
              </label>
              <textarea
                id="lecture-desc"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={2}
                placeholder={t("workspace.lectureForm.descPlaceholder")}
                className={`${inputClass} h-auto py-2`}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t("workspace.lectureForm.levelNumber")}</label>
                <input
                  type="number"
                  name="levelNumber"
                  value={form.levelNumber}
                  onChange={handleChange}
                  min={1}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t("workspace.lectureForm.levelTitle")}</label>
                <input
                  type="text"
                  name="levelTitle"
                  value={form.levelTitle}
                  onChange={handleChange}
                  placeholder={t("workspace.lectureForm.levelTitlePlaceholder")}
                  className={inputClass}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t("workspace.lectureForm.duration")}</label>
                <input
                  type="number"
                  name="duration"
                  value={form.duration}
                  onChange={handleChange}
                  min={0}
                  placeholder={t("workspace.lectureForm.durationPlaceholder")}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t("workspace.lectureForm.order")}</label>
                <input
                  type="number"
                  name="order"
                  value={form.order}
                  onChange={handleChange}
                  min={0}
                  className={inputClass}
                />
              </div>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40 p-3.5">
              <input
                type="checkbox"
                name="isFreePreview"
                checked={form.isFreePreview}
                onChange={(e) => setForm((prev) => ({ ...prev, isFreePreview: e.target.checked }))}
                className="mt-0.5 rounded border-gray-300"
              />
              <span>
                <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                  {t("workspace.lectureForm.freePreview")}
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                  {t("workspace.lectureForm.freePreviewDesc")}
                </span>
              </span>
            </label>

            {/* Attachments section */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                type="button"
                onClick={() => setAttachmentsOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                  <Paperclip className="w-4 h-4 text-gray-400" />
                  {t("workspace.lectureForm.attachments")}
                  {attachments.length > 0 && (
                    <span className="text-[10px] font-bold bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 px-1.5 py-0.5 rounded">
                      {attachments.length}
                    </span>
                  )}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${attachmentsOpen ? "rotate-180" : ""}`} />
              </button>
              {attachmentsOpen && (
                <div className="px-4 pb-4 pt-1 space-y-2 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">
                    {t("workspace.lectureForm.attachmentsNote")}
                  </p>
                  {attachments.map((att, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="url"
                        placeholder="https://…"
                        value={att.url}
                        onChange={(e) => {
                          const next = [...attachments];
                          next[idx] = { ...next[idx], url: e.target.value };
                          setAttachments(next);
                        }}
                        className={`${inputClass} flex-1`}
                      />
                      <input
                        type="text"
                        placeholder={t("workspace.lectureForm.fileNameShort")}
                        value={att.fileName}
                        onChange={(e) => {
                          const next = [...attachments];
                          next[idx] = { ...next[idx], fileName: e.target.value };
                          setAttachments(next);
                        }}
                        className={`${inputClass} w-36`}
                      />
                      <button
                        type="button"
                        onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {attachments.length < 5 && (
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => [...prev, { url: "", fileName: "" }])}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors pt-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t("workspace.lectureForm.addAttachment")}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {t("workspace.taskForm.cancel")}
              </button>
              <button
                type="submit"
                disabled={busy || (!isEditMode && !canSubmitNew)}
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUploadingVideo
                  ? uploadSource === "vimeo"
                    ? t("workspace.lectureForm.uploadingToVimeo")
                    : t("workspace.lectureForm.uploadingToCloudinary")
                  : isApiPending
                    ? t("workspace.taskForm.saving")
                    : isEditMode
                      ? t("workspace.taskForm.saveChanges")
                      : t("workspace.quickActions.addLecture")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
