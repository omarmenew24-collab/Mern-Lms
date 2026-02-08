import cloudinary from './config.js';
import fs from 'fs';

export const uploadFile = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath,
       { resource_type: 'raw', use_filename: true,     // keeps the original file name
  unique_filename: false,});
    // Delete local file after upload
    fs.unlinkSync(filePath);
    return result.url; // Return the Cloudinary URL
  } catch (error) {
    throw error;
  }
};
