import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { X, PlayCircle, ExternalLink } from "lucide-react";
import { getVideoPlaybackInfo } from "../../lib/lectureVideoEmbed";

/**
 * Minimal instructor-only modal: verify uploaded / linked video without leaving workspace.
 */
export default function LectureVideoPreviewModal({ lecture, onClose }) {
  const { t } = useTranslation();
  const panelRef = useRef(null);
  const videoRef = useRef(null);
  const open = Boolean(lecture);

  const { safeVideoUrl, isFileVideo, embedUrl } = lecture ? getVideoPlaybackInfo(lecture) : {};

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const focusTimer = window.setTimeout(() => panelRef.current?.focus(), 0);
    return () => window.clearTimeout(focusTimer);
  }, [open]);

  if (!lecture) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lecture-preview-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"
        aria-label={t("workspace.previewModal.closePreview")}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative w-full max-w-3xl rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden outline-none"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <h2 id="lecture-preview-title" className="text-sm font-bold text-gray-900 dark:text-white truncate pe-2">
            {t("workspace.previewModal.previewTitle", { title: lecture.title || t("workspace.lecturePlayer.untitled") })}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
            aria-label={t("workspace.previewModal.close")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="aspect-video bg-black">
          {isFileVideo && safeVideoUrl ? (
            <video ref={videoRef} src={safeVideoUrl} controls className="h-full w-full" preload="metadata" />
          ) : embedUrl ? (
            <iframe
              src={embedUrl}
              title={lecture.title || t("workspace.previewModal.preview")}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center gap-3 px-6 text-center">
              <PlayCircle className="w-12 h-12 text-white/75" />
              <p className="text-sm text-white/85">
                {safeVideoUrl
                  ? t("workspace.previewModal.cannotEmbedHere")
                  : t("workspace.previewModal.noPlayableUrl")}
              </p>
              {safeVideoUrl ? (
                <a
                  href={safeVideoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  {t("workspace.lecturePlayer.openVideo")}
                </a>
              ) : null}
            </div>
          )}
        </div>

        <p className="px-4 py-2.5 text-[11px] text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800">
          {t("workspace.previewModal.footerNote")}
        </p>
      </div>
    </div>
  );
}
