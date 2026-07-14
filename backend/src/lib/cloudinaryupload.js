import cloudinary from './config.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

export const uploadFile = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'raw',
      use_filename: true,
      unique_filename: false,
    });
    fs.unlinkSync(filePath);
    return result.url;
  } catch (error) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    throw error;
  }
};

export const uploadImage = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "course-platform",
      resource_type: "image",
    });
    fs.unlinkSync(filePath);
    return result.secure_url || result.url;
  } catch (error) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    throw error;
  }
};

/** Receipt image or PDF for manual payment verification (private folder on Cloudinary). */
export const uploadManualReceipt = async (filePath, mimetype) => {
  try {
    const isPdf = mimetype === "application/pdf";
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "course-platform/manual-receipts",
      resource_type: isPdf ? "raw" : "image",
    });
    fs.unlinkSync(filePath);
    return {
      url: result.secure_url || result.url,
      resourceType: isPdf ? "raw" : "image",
    };
  } catch (error) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    throw error;
  }
};

/** Upload a generated certificate PDF (raw) and return HTTPS URL. */
export const uploadCertificatePdfBuffer = async (buffer) => {
  const tmp = path.join(os.tmpdir(), `cert-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`);
  try {
    fs.writeFileSync(tmp, buffer);
    const result = await cloudinary.uploader.upload(tmp, {
      folder: "course-platform/certificates",
      resource_type: "raw",
    });
    fs.unlinkSync(tmp);
    return result.secure_url || result.url;
  } catch (error) {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    throw error;
  }
};

export const uploadVideo = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "course-platform/lectures",
      resource_type: "video",
    });
    fs.unlinkSync(filePath);
    return {
      url: result.secure_url || result.url,
      publicId: result.public_id,
      duration: result.duration ? Math.round(result.duration) : null,
    };
  } catch (error) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    throw error;
  }
};
