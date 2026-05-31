const cloudinary = require('cloudinary').v2;
const { config } = require('./env');

cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
});

// ─── Signed upload params (client-side direct upload) ─────────────────────────

/**
 * Generate signed upload parameters for client-side direct upload to Cloudinary.
 * The frontend uses these params to upload directly to Cloudinary, then sends
 * back the resulting URL to our API. We never handle the file buffer server-side.
 *
 * @param {object} options
 * @param {string} options.folder - Cloudinary folder path
 * @param {string[]} options.allowedFormats - e.g. ['jpg','png','webp']
 * @param {number} options.maxFileSize - bytes
 * @param {string} options.publicId - optional fixed public_id
 * @param {string} options.resourceType - 'image' | 'raw' (for documents)
 */
const generateSignedUploadParams = (options = {}) => {
  const {
    folder = 'varanda',
    allowedFormats = ['jpg', 'jpeg', 'png', 'webp'],
    maxFileSize = 5 * 1024 * 1024,
    publicId,
    resourceType = 'image',
  } = options;

  const timestamp = Math.round(Date.now() / 1000);

  // Only include params that Cloudinary actually signs server-side.
  // max_file_size is NOT a signable param — including it breaks the signature.
  const paramsToSign = {
    timestamp,
    folder,
    allowed_formats: allowedFormats.join(','),
  };

  if (publicId) paramsToSign.public_id = publicId;

  const signature = cloudinary.utils.api_sign_request(paramsToSign, config.cloudinaryApiSecret);

  return {
    ...paramsToSign,
    // max_file_size is returned for the frontend to use as a client-side guard only
    max_file_size: maxFileSize,
    signature,
    api_key: config.cloudinaryApiKey,
    cloud_name: config.cloudinaryCloudName,
    resource_type: resourceType,
    upload_url: `https://api.cloudinary.com/v1_1/${config.cloudinaryCloudName}/${resourceType}/upload`,
  };
};

/** Signed params for business logo/favicon/product images */
const generateImageUploadParams = (folder, publicId) =>
  generateSignedUploadParams({
    folder,
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
    maxFileSize: 5 * 1024 * 1024,
    publicId,
    resourceType: 'image',
  });

/** Signed params for KYC / business documents (images + PDF) */
const generateDocumentUploadParams = (folder, publicId) =>
  generateSignedUploadParams({
    folder,
    allowedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
    maxFileSize: 10 * 1024 * 1024,
    publicId,
    resourceType: 'raw',
  });

// ─── Server-side upload helpers (kept for internal use / seeds) ───────────────

const uploadImage = (buffer, folder, options = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', format: 'webp', quality: 'auto', ...options },
      (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });

const uploadPrivateDocument = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'raw', type: 'private' },
      (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });

const deleteImage = async (publicId) => {
  await cloudinary.uploader.destroy(publicId);
};

const getSignedUrl = (publicId, expiresIn = 3600) =>
  cloudinary.utils.private_download_url(publicId, 'pdf', {
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
  });

module.exports = {
  generateSignedUploadParams,
  generateImageUploadParams,
  generateDocumentUploadParams,
  uploadImage,
  uploadPrivateDocument,
  deleteImage,
  getSignedUrl,
};
