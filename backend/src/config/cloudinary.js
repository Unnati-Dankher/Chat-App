import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const isCloudinaryConfigured = () => {
  return (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name' &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_KEY !== 'your_cloudinary_api_key' &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_API_SECRET !== 'your_cloudinary_api_secret'
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Uploads a local file to Cloudinary.
 * If Cloudinary properties are missing or empty, returns null.
 * @param {string} filePath - Absolute or relative path to the local file
 * @returns {Promise<string|null>} - Secure URL from Cloudinary of the asset, or null if fallback to local is required.
 */
export const uploadToCloudinary = async (filePath) => {
  try {
    if (!isCloudinaryConfigured()) {
      return null;
    }
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'chat_app_assets',
      resource_type: 'auto',
    });
    
    // Remove local temp file after it's safely in Cloudinary
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload failure:', error.message);
    return null;
  }
};
