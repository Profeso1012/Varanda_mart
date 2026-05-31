const cloudinaryConfig = require('../config/cloudinary');

/**
 * Generate signed upload params for client-side direct upload.
 * Used by GET /api/v1/cloudinary/sign
 */
const getImageUploadSignature = (folder, publicId) =>
  cloudinaryConfig.generateImageUploadParams(folder, publicId);

const getDocumentUploadSignature = (folder, publicId) =>
  cloudinaryConfig.generateDocumentUploadParams(folder, publicId);

/**
 * Process and upload an image buffer to Cloudinary (server-side, for internal use).
 */
const processAndUploadImage = async (buffer, folder, options = {}) => {
  return cloudinaryConfig.uploadImage(buffer, folder, options);
};

/**
 * Upload a private document (PDF, image) to Cloudinary private folder.
 */
const uploadPrivate = async (buffer, folder) => {
  return cloudinaryConfig.uploadPrivateDocument(buffer, folder);
};

/**
 * Replace an existing image: delete old one (if exists) then upload new.
 */
const replaceImage = async (buffer, folder, oldPublicId) => {
  if (oldPublicId) {
    await cloudinaryConfig.deleteImage(oldPublicId).catch(() => {});
  }
  return cloudinaryConfig.uploadImage(buffer, folder);
};

/**
 * Delete an image by its public_id.
 */
const deleteImage = async (publicId) => {
  return cloudinaryConfig.deleteImage(publicId);
};

/**
 * Get a signed URL for a private document (1 hour expiry by default).
 */
const getDocumentUrl = (publicId) => {
  return cloudinaryConfig.getSignedUrl(publicId, 3600);
};

module.exports = {
  getImageUploadSignature,
  getDocumentUploadSignature,
  processAndUploadImage,
  uploadPrivate,
  replaceImage,
  deleteImage,
  getDocumentUrl,
};
