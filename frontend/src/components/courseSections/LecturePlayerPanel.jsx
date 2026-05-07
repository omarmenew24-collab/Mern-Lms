import { useEffect, useRef } from "react";
import {
  CheckCircle,
  ExternalLink,
  PlayCircle,
  Video,
  FileText,
  Link2,
  SkipForward,
  Download,
  Paperclip,
} from "lucide-react";
import { safeHttpUrl } from "../../lib/safeHttpUrl";

function getYouTubeEmbedUrl(urlString) {
  try {
    const url = new URL(urlString);
    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (url.hostname.includes("youtube.com")) {
      const id = url.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;

      const parts = url.pathname.split("/").filter(Boolean);
      const embedIndex = parts.indexOf("embed");
      if (embedIndex !== -1 && parts[embedIndex + 1]) {
        return `https://www.youtube.com/embed/${parts[embedIndex + 1]}`;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function getVimeoEmbedUrl(urlString) {
  try {
    const url = new URL(urlString);
    if (!url.hostname.includes("vimeo.com")) return null;

    const parts = url.pathname.split("/").filter(Boolean);
    const numericPart = parts.find((part) => /^\d+$/.test(part));
    return numericPart ? `https://player.vimeo.com/video/${numericPart}` : null;
  } catch {
    return null;
  }
}

function isDirectVideoFile(urlString) {
  try {
    const pathname = new URL(urlString).pathname.toLowerCase();
    return [".mp4", ".webm", ".ogg", ".mov", ".m4v"].some((ext) =>
      pathname.endsWith(ext),
    );
  } catch {
    return false;
  }
}

export default function LecturePlayerPanel({
  lecture,
  title = "Lecture player",
  resumeStorageKey,
  showMarkWatched = false,
  isLectureCompleted = false,
  onMarkWatched,
  nextLecture,
  onNextLecture,
}) {
  const videoRef = useRef(null);
  const contentType = lecture?.contentType || "video";
  const safeVideoUrl = lecture?.videoUrl ? safeHttpUrl(lecture.videoUrl) : null;
  const vimeoId =
    typeof lecture?.vimeoVideoId === "string" && /^\d{3,20}$/.test(lecture.vimeoVideoId.trim())
      ? lecture.vimeoVideoId.trim()
      : null;
  const youtubeEmbedUrl = safeVideoUrl
    ? getYouTubeEmbedUrl(safeVideoUrl)
    : null;
  const vimeoEmbedUrl = vimeoId
    ? `https://player.vimeo.com/video/${vimeoId}`
    : safeVideoUrl
      ? getVimeoEmbedUrl(safeVideoUrl)
      : null;
  const isFileVideo = safeVideoUrl ? isDirectVideoFile(safeVideoUrl) : false;
  const embedUrl = youtubeEmbedUrl || vimeoEmbedUrl;

  useEffect(() => {
    if (!lecture || contentType !== "video" || !isFileVideo || !resumeStorageKey || !videoRef.current) return;
    let initialSeekDone = false;
    const el = videoRef.current;

    const handleLoadedMetadata = () => {
      if (initialSeekDone) return;
      initialSeekDone = true;
      try {
        const raw = localStorage.getItem(resumeStorageKey);
        const saved = Number(raw);
        if (!Number.isFinite(saved) || saved <= 0 || !Number.isFinite(el.duration)) return;
        const clamped = Math.min(saved, Math.max(0, el.duration - 1));
        if (clamped > 0) {
          el.currentTime = clamped;
        }
      } catch {
        /* ignore storage errors */
      }
    };

    const persist = () => {
      try {
        if (Number.isFinite(el.currentTime) && el.currentTime > 0) {
          localStorage.setItem(resumeStorageKey, String(el.currentTime));
        }
      } catch {
        /* ignore storage errors */
      }
    };

    const handleEnded = () => {
      try {
        localStorage.removeItem(resumeStorageKey);
      } catch {
        /* ignore */
      }
    };

    el.addEventListener("loadedmetadata", handleLoadedMetadata);
    el.addEventListener("timeupdate", persist);
    el.addEventListener("pause", persist);
    el.addEventListener("ended", handleEnded);

    return () => {
      el.removeEventListener("loadedmetadata", handleLoadedMetadata);
      el.removeEventListener("timeupdate", persist);
      el.removeEventListener("pause", persist);
      el.removeEventListener("ended", handleEnded);
    };
  }, [contentType, isFileVideo, resumeStorageKey, lecture?._id]);

  if (!lecture) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <div className="px-5 py-12 text-center">
          <Video className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Select a lecture to start watching.
          </p>
        </div>
      </div>
    );
  }

  // ─── FILE CONTENT TYPE ────────────────────────────────────────────────────
  if (contentType === "file") {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="px-6 py-8 text-center">
          <FileText className="w-12 h-12 text-brand-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {lecture.title || "File resource"}
          </h3>
          {lecture.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 max-w-md mx-auto">
              {lecture.description}
            </p>
          )}
          {lecture.fileUrl && (
            <a
              href={lecture.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              {lecture.fileName || "Download file"}
            </a>
          )}
        </div>
        <LectureFooter
          lecture={lecture}
          showMarkWatched={showMarkWatched}
          isLectureCompleted={isLectureCompleted}
          onMarkWatched={onMarkWatched}
          nextLecture={nextLecture}
          onNextLecture={onNextLecture}
        />
        <LectureAttachments attachments={lecture.attachments} />
      </div>
    );
  }

  // ─── LINK CONTENT TYPE ────────────────────────────────────────────────────
  if (contentType === "link") {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="px-6 py-8 text-center">
          <Link2 className="w-12 h-12 text-blue-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {lecture.title || "External link"}
          </h3>
          {lecture.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 max-w-md mx-auto">
              {lecture.description}
            </p>
          )}
          {lecture.linkUrl && (
            <a
              href={lecture.linkUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              {lecture.linkLabel || "Open link"}
            </a>
          )}
        </div>
        <LectureFooter
          lecture={lecture}
          showMarkWatched={showMarkWatched}
          isLectureCompleted={isLectureCompleted}
          onMarkWatched={onMarkWatched}
          nextLecture={nextLecture}
          onNextLecture={onNextLecture}
        />
        <LectureAttachments attachments={lecture.attachments} />
      </div>
    );
  }

  // ─── TEXT CONTENT TYPE ────────────────────────────────────────────────────
  if (contentType === "text") {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="px-6 py-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            {lecture.title || "Reading material"}
          </h3>
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-gray-700 dark:text-gray-200 leading-relaxed">
            {lecture.textContent || lecture.description || "No content available."}
          </div>
        </div>
        <LectureFooter
          lecture={lecture}
          showMarkWatched={showMarkWatched}
          isLectureCompleted={isLectureCompleted}
          onMarkWatched={onMarkWatched}
          nextLecture={nextLecture}
          onNextLecture={onNextLecture}
        />
        <LectureAttachments attachments={lecture.attachments} />
      </div>
    );
  }

  // ─── VIDEO CONTENT TYPE (default) ────────────────────────────────────────
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="aspect-video bg-black">
        {isFileVideo && safeVideoUrl ? (
          <video
            ref={videoRef}
            src={safeVideoUrl}
            controls
            preload="metadata"
            className="h-full w-full"
          />
        ) : embedUrl ? (
          <iframe
            src={embedUrl}
            title={lecture.title || "Lecture video"}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center gap-3 px-6 text-center">
            <PlayCircle className="w-14 h-14 text-white/80" />
            <p className="text-sm text-white/80">
              This video source can&apos;t be embedded directly.
            </p>
            {safeVideoUrl ? (
              <a
                href={safeVideoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 transition"
              >
                <ExternalLink className="w-4 h-4" />
                Open video
              </a>
            ) : lecture.videoUrl ? (
              <p className="text-xs text-amber-200/90 max-w-sm">
                This lecture&apos;s video URL is not allowed (only http/https links).
              </p>
            ) : null}
          </div>
        )}
      </div>

      <LectureFooter
        lecture={lecture}
        showMarkWatched={showMarkWatched}
        isLectureCompleted={isLectureCompleted}
        onMarkWatched={onMarkWatched}
        nextLecture={nextLecture}
        onNextLecture={onNextLecture}
        isFileVideo={isFileVideo}
      />
      <LectureAttachments attachments={lecture.attachments} />
    </div>
  );
}

function LectureFooter({
  lecture,
  showMarkWatched,
  isLectureCompleted,
  onMarkWatched,
  nextLecture,
  onNextLecture,
  isFileVideo,
}) {
  return (
    <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
        <PlayCircle className="w-3.5 h-3.5" />
        Now playing
      </div>
      <h3 className="mt-1.5 text-base font-bold text-gray-900 dark:text-white">
        {lecture.title || "Untitled lecture"}
      </h3>
      {lecture.description && lecture.contentType === "video" ? (
        <p className="mt-1.5 text-sm leading-relaxed text-gray-600 dark:text-gray-300 line-clamp-2">
          {lecture.description}
        </p>
      ) : null}
      <div className="mt-3 flex items-center gap-3 flex-wrap">
        {showMarkWatched && (
          <button
            type="button"
            onClick={onMarkWatched}
            disabled={isLectureCompleted}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              isLectureCompleted
                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 cursor-default"
                : "bg-brand-600 text-white hover:bg-brand-700"
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            {isLectureCompleted ? "Completed" : "Mark as done"}
          </button>
        )}
        {nextLecture && onNextLecture && (
          <button
            type="button"
            onClick={onNextLecture}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:border-brand-400 dark:hover:border-brand-500 transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" />
            Next: {nextLecture.title?.slice(0, 30) || "Untitled"}
            {nextLecture.title?.length > 30 ? "…" : ""}
          </button>
        )}
      </div>
      {isFileVideo === false && showMarkWatched && (
        <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
          Resume time is exact for direct video files; embedded players may vary.
        </p>
      )}
    </div>
  );
}

function LectureAttachments({ attachments }) {
  if (!attachments?.length) return null;
  return (
    <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
        <Paperclip className="w-3 h-3" />
        Resources ({attachments.length})
      </div>
      <div className="space-y-1.5">
        {attachments.map((att, idx) => (
          <a
            key={idx}
            href={att.url}
            target="_blank"
            rel="noreferrer"
            download
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/60 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{att.fileName || "Attachment"}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
