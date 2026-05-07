/**
 * Direct browser → Cloudinary upload (bypasses your API for the heavy bytes).
 *
 * Setup in Cloudinary Dashboard → Settings → Upload → Upload Presets:
 *   - Video preset (unsigned):  VITE_CLOUDINARY_VIDEO_UPLOAD_PRESET
 *   - Image preset (unsigned):  VITE_CLOUDINARY_IMAGE_UPLOAD_PRESET
 *   - Files (PDF/Word/etc.) reuse the image preset via the /auto/upload endpoint.
 *
 * Put your cloud name in VITE_CLOUDINARY_CLOUD_NAME (matches backend CLOUD_NAME).
 */

export function getCloudinaryVideoConfig() {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_VIDEO_UPLOAD_PRESET;
  return { cloudName, uploadPreset, isConfigured: Boolean(cloudName && uploadPreset) };
}

/** Unsigned image preset (About page, course images, etc.). Set VITE_CLOUDINARY_IMAGE_UPLOAD_PRESET. */
export function getCloudinaryImageConfig() {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_IMAGE_UPLOAD_PRESET;
  return { cloudName, uploadPreset, isConfigured: Boolean(cloudName && uploadPreset) };
}

/**
 * @param {File} file
 * @param {{ onProgress?: (ratio: number) => void }} [opts]
 * @returns {Promise<{ secureUrl: string, publicId: string }>}
 */
export function uploadImageToCloudinary(file, opts = {}) {
  const { onProgress } = opts;
  const { cloudName, uploadPreset, isConfigured } = getCloudinaryImageConfig();
  if (!isConfigured) {
    return Promise.reject(
      new Error(
        "Image upload is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_IMAGE_UPLOAD_PRESET to the frontend .env and restart the dev server.",
      ),
    );
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.min(0.99, e.loaded / e.total));
      }
    });
    xhr.addEventListener("load", () => {
      if (onProgress) onProgress(1);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText || "{}");
          const secureUrl = data.secure_url || data.url;
          if (!secureUrl) {
            reject(new Error("Cloudinary did not return an image URL"));
            return;
          }
          resolve({ secureUrl, publicId: data.public_id || "" });
        } catch {
          reject(new Error("Invalid response from Cloudinary"));
        }
      } else {
        let msg = xhr.statusText || "Upload failed";
        try {
          const err = JSON.parse(xhr.responseText || "{}");
          msg = err.error?.message || err.message || msg;
        } catch { /* use msg */ }
        reject(new Error(msg));
      }
    });
    xhr.addEventListener("error", () => reject(new Error("Network error while uploading to Cloudinary")));
    xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));
    xhr.send(formData);
  });
}

/**
 * @param {File} file
 * @param {{ onProgress?: (ratio: number) => void, signal?: AbortSignal }} [opts]
 * @returns {Promise<{ secureUrl: string, duration: number | null, publicId: string }>}
 */
export function uploadVideoToCloudinary(file, opts = {}) {
  const { onProgress, signal } = opts;
  const { cloudName, uploadPreset, isConfigured } = getCloudinaryVideoConfig();
  if (!isConfigured) {
    return Promise.reject(
      new Error(
        "Video upload is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_VIDEO_UPLOAD_PRESET to the frontend .env and restart the dev server.",
      ),
    );
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let aborted = false;
    const onAbort = () => {
      aborted = true;
      try {
        xhr.abort();
      } catch {
        /* noop */
      }
    };

    if (signal) {
      if (signal.aborted) {
        reject(new Error("Upload cancelled"));
        return;
      }
      signal.addEventListener("abort", onAbort, { once: true });
    }

    xhr.open("POST", url);
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.min(0.99, e.loaded / e.total));
      }
    });
    xhr.addEventListener("load", () => {
      if (signal) signal.removeEventListener("abort", onAbort);
      if (onProgress) onProgress(1);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText || "{}");
          const secureUrl = data.secure_url || data.url;
          if (!secureUrl) {
            reject(new Error("Cloudinary did not return a video URL"));
            return;
          }
          const rawDur = data.duration;
          const duration =
            rawDur != null && !Number.isNaN(Number(rawDur)) ? Math.round(Number(rawDur)) : null;
          resolve({ secureUrl, duration, publicId: data.public_id || "" });
        } catch {
          reject(new Error("Invalid response from Cloudinary"));
        }
      } else {
        let msg = xhr.statusText || "Upload failed";
        try {
          const err = JSON.parse(xhr.responseText || "{}");
          msg = err.error?.message || err.message || msg;
        } catch { /* use msg */ }
        reject(new Error(msg));
      }
    });
    xhr.addEventListener("error", () => {
      if (signal) signal.removeEventListener("abort", onAbort);
      reject(new Error("Network error while uploading to Cloudinary"));
    });
    xhr.addEventListener("abort", () => {
      if (signal) signal.removeEventListener("abort", onAbort);
      reject(new Error(aborted ? "Upload cancelled" : "Upload aborted"));
    });
    xhr.send(formData);
  });
}

/**
 * Upload any file type (PDF, Word, Excel, PowerPoint, ZIP, etc.) to Cloudinary.
 * Uses the /auto/upload endpoint — Cloudinary detects resource type automatically.
 * Reuses VITE_CLOUDINARY_IMAGE_UPLOAD_PRESET (no extra preset needed, but the
 * preset must allow resource_type: "auto" or "raw"). If you get a 400, create a
 * separate unsigned preset with resource_type set to "auto" in the Cloudinary Dashboard
 * and point VITE_CLOUDINARY_RAW_UPLOAD_PRESET to it.
 *
 * @param {File} file
 * @param {{ onProgress?: (ratio: number) => void }} [opts]
 * @returns {Promise<{ secureUrl: string, publicId: string, originalFilename: string, bytes: number, format: string }>}
 */
export function uploadRawFileToCloudinary(file, opts = {}) {
  const { onProgress } = opts;
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset =
    import.meta.env.VITE_CLOUDINARY_RAW_UPLOAD_PRESET ||
    import.meta.env.VITE_CLOUDINARY_IMAGE_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    return Promise.reject(
      new Error(
        "File upload is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_IMAGE_UPLOAD_PRESET to frontend/.env, then restart Vite.",
      ),
    );
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.min(0.99, e.loaded / e.total));
      }
    });
    xhr.addEventListener("load", () => {
      if (onProgress) onProgress(1);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText || "{}");
          const secureUrl = data.secure_url || data.url;
          if (!secureUrl) {
            reject(new Error("Cloudinary did not return a file URL"));
            return;
          }
          resolve({
            secureUrl,
            publicId: data.public_id || "",
            originalFilename: data.original_filename || file.name || "",
            bytes: data.bytes || 0,
            format: data.format || "",
          });
        } catch {
          reject(new Error("Invalid response from Cloudinary"));
        }
      } else {
        let msg = xhr.statusText || "Upload failed";
        try {
          const err = JSON.parse(xhr.responseText || "{}");
          msg = err.error?.message || err.message || msg;
        } catch { /* use msg */ }
        reject(new Error(msg));
      }
    });
    xhr.addEventListener("error", () => reject(new Error("Network error during file upload")));
    xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));
    xhr.send(formData);
  });
}
