import { useCallback, useEffect, useRef, useState } from "react";
import { axiosInstance } from "../../lib/axios";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useFormatter } from "../../lib/i18nFormatters";
import { useMarkTask } from "../../api/task";
import { toast } from "react-hot-toast";
import { confirmAction } from "../../lib/confirmToast.jsx";
import { paths } from "../../config/paths";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  X,
  RefreshCw,
  Loader2,
  Trash2,
  Lock,
  Calendar,
} from "lucide-react";

export default function FileUploadForm() {
  const { t } = useTranslation();
  const { dateTime } = useFormatter();
  const { courseId, taskId } = useParams();
  const { markTask } = useMarkTask(courseId);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [existingSubmission, setExistingSubmission] = useState(null);
  const [taskInfo, setTaskInfo] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!taskId) return;
    setLoadingExisting(true);
    axiosInstance
      .get(`/submissions/me/${taskId}`)
      .then(({ data }) => {
        setTaskInfo(data.task || null);
        setIsLocked(Boolean(data.isLocked));
        if (data.submission) {
          setExistingSubmission(data.submission);
          setUploadedUrl(data.submission.fileUrl || "");
        }
      })
      .catch(() => {})
      .finally(() => setLoadingExisting(false));
  }, [taskId]);

  const handleFileSelect = useCallback((f) => {
    if (!f) return;
    setFile(f);
    setStatus("");
    setPreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : "");
  }, []);

  const handleInputChange = (e) => handleFileSelect(e.target.files?.[0]);
  const handleDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e) => { e.preventDefault(); setIsDragging(false); handleFileSelect(e.dataTransfer.files?.[0]); }, [handleFileSelect]);

  const clearFile = () => { setFile(null); setPreview(""); setStatus(""); if (fileInputRef.current) fileInputRef.current.value = ""; };

  const handleDeleteSubmission = async () => {
    if (!existingSubmission || isLocked) return;
    const ok = await confirmAction(
      "Delete your submission? You can upload again before the deadline.",
      { destructive: true, confirmLabel: "Delete" },
    );
    if (!ok) return;
    setDeleting(true);
    setStatus("");
    try {
      await axiosInstance.delete(`/submissions/me/${courseId}/${taskId}`);
      setExistingSubmission(null);
      setUploadedUrl("");
      setFile(null);
      setPreview("");
      toast.success("Submission deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    } finally { setDeleting(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) { setStatus("error:Task is closed."); return; }
    if (!file) { setStatus("error:Select a file first."); return; }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("taskId", taskId);
    formData.append("courseId", courseId);
    setLoading(true);
    setStatus("");
    try {
      const { data } = await axiosInstance.post("/upload", formData, { withCredentials: true });
      await markTask(taskId);
      setUploadedUrl(data.url);
      setExistingSubmission(data.submission);
      setFile(null);
      setPreview("");
      setStatus("success:File uploaded!");
    } catch (err) {
      setStatus(`error:${err.response?.data?.message || "Upload failed"}`);
    } finally { setLoading(false); }
  };

  const isSuccess = status.startsWith("success:");
  const isError = status.startsWith("error:");
  const statusMsg = status.replace(/^(success|error):/, "");
  const isResubmit = !!existingSubmission;
  const dueLabel = taskInfo?.dueDate ? dateTime(taskInfo.dueDate) : null;

  if (loadingExisting) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="w-7 h-7 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 px-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <Link
            to={paths.courseWorkspace(courseId)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-2"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Back to course
          </Link>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-500" />
            {isResubmit ? "Manage submission" : "Upload solution"}
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            One submission per assignment. Replace or delete until the deadline.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {dueLabel && (
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                <Calendar className="w-3 h-3" /> Due: {dueLabel}
              </span>
            )}
            <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold ${isLocked ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"}`}>
              {isLocked ? <Lock className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
              {isLocked ? "Closed" : "Open"}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isResubmit && !file && (
            <div className="flex items-center gap-3 rounded-lg bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800/30 px-4 py-3">
              <CheckCircle className="w-5 h-5 text-brand-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-brand-700 dark:text-brand-300">Previous submission</p>
                <p className="text-xs text-brand-500 dark:text-brand-400 truncate">
                  {existingSubmission.submittedAt ? dateTime(existingSubmission.submittedAt) : ""}
                </p>
              </div>
              {uploadedUrl && (
                <a href={uploadedUrl} target="_blank" rel="noreferrer" className="text-brand-600 dark:text-brand-400 hover:text-brand-800" title="View file">
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          )}

          {isResubmit && !file && (
            <div className="grid grid-cols-2 gap-3">
              <button type="button" disabled={isLocked} onClick={() => fileInputRef.current?.click()}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${isLocked ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed" : "bg-brand-600 text-white hover:bg-brand-700"}`}
              >
                <RefreshCw className="w-3.5 h-3.5" /> Update file
              </button>
              <button type="button" disabled={isLocked || deleting} onClick={handleDeleteSubmission}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${isLocked || deleting ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed" : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40"}`}
              >
                <Trash2 className="w-3.5 h-3.5" /> {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          )}

          {/* Drop zone / file preview */}
          {file ? (
            <div className="relative rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 p-4">
              <button type="button" onClick={clearFile} className="absolute top-2 end-2 p-1 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                <X className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
              </button>
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-36 object-cover rounded-lg" />
              ) : (
                <div className="flex items-center gap-3">
                  <FileText className="w-7 h-7 text-brand-400" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{file.name}</p>
                    <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
              onClick={() => !isLocked && fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-3 w-full h-36 border-2 border-dashed rounded-lg transition-all ${
                isLocked ? "border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 cursor-not-allowed opacity-60"
                : isDragging ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                : "border-gray-300 dark:border-gray-700 hover:border-brand-400 cursor-pointer"
              }`}
            >
              <Upload className={`w-7 h-7 ${isDragging ? "text-brand-500" : "text-gray-400"}`} />
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {isLocked ? "Task deadline passed" : "Drag and drop or click to browse"}
              </p>
            </div>
          )}

          <input ref={fileInputRef} type="file" onChange={handleInputChange} className="hidden" />

          <button type="submit" disabled={loading || !file || isLocked}
            className="w-full h-10 flex items-center justify-center gap-2 rounded-lg text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : isResubmit ? <><RefreshCw className="w-4 h-4" /> Re-submit</> : <><Upload className="w-4 h-4" /> Upload</>}
          </button>

          {statusMsg && (
            <div className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2.5 ${isSuccess ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"}`}>
              {isSuccess ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              <span>{statusMsg}</span>
            </div>
          )}

          {uploadedUrl && isSuccess && (
            <a href={uploadedUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 hover:underline">
              <ExternalLink className="w-3 h-3" /> View uploaded file
            </a>
          )}
        </form>
      </div>
    </div>
  );
}
