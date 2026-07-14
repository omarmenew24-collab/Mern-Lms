import { safeHttpUrl } from "./safeHttpUrl";

export function getYouTubeEmbedUrl(urlString) {
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

export function getVimeoEmbedUrl(urlString) {
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

export function isDirectVideoFile(urlString) {
  try {
    const pathname = new URL(urlString).pathname.toLowerCase();
    return [".mp4", ".webm", ".ogg", ".mov", ".m4v"].some((ext) => pathname.endsWith(ext));
  } catch {
    return false;
  }
}

/**
 * Resolved playback URLs for a video-type lecture (matches LecturePlayerPanel).
 */
export function getVideoPlaybackInfo(lecture) {
  const safeVideoUrl = lecture?.videoUrl ? safeHttpUrl(lecture.videoUrl) : null;
  const vimeoId =
    typeof lecture?.vimeoVideoId === "string" && /^\d{3,20}$/.test(lecture.vimeoVideoId.trim())
      ? lecture.vimeoVideoId.trim()
      : null;
  const youtubeEmbedUrl = safeVideoUrl ? getYouTubeEmbedUrl(safeVideoUrl) : null;
  const vimeoEmbedUrl = vimeoId
    ? `https://player.vimeo.com/video/${vimeoId}`
    : safeVideoUrl
      ? getVimeoEmbedUrl(safeVideoUrl)
      : null;
  const isFileVideo = safeVideoUrl ? isDirectVideoFile(safeVideoUrl) : false;
  const embedUrl = youtubeEmbedUrl || vimeoEmbedUrl;
  return { safeVideoUrl, isFileVideo, embedUrl };
}
