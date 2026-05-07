import { Upload } from "tus-js-client";

/**
 * Resumable upload to Vimeo (TUS). `uploadLink` is `upload.upload_link` from `POST /me/videos`.
 * @param {File} file
 * @param {string} uploadLink
 * @param {{ onProgress?: (ratio: number) => void }} [opts]
 * @returns {Promise<void>}
 */
export function uploadFileToVimeoTus(file, uploadLink, opts = {}) {
  const { onProgress } = opts;
  if (!file?.size || !uploadLink) {
    return Promise.reject(new Error("Invalid file or upload link"));
  }

  return new Promise((resolve, reject) => {
    const upload = new Upload(file, {
      uploadUrl: uploadLink,
      storeFingerprintForResuming: false,
      removeFingerprintOnSuccess: true,
      uploadSize: file.size,
      retryDelays: [0, 2000, 5000, 10000],
      onError: (err) => {
        reject(err instanceof Error ? err : new Error(String(err?.message || err)));
      },
      onProgress: (bytesSent, bytesTotal) => {
        if (onProgress && bytesTotal > 0) onProgress(Math.min(0.99, bytesSent / bytesTotal));
      },
      onSuccess: () => {
        onProgress?.(1);
        resolve();
      },
    });
    upload.start();
  });
}
