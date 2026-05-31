const multer = require('multer');
const AppError = require('../utils/AppError');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const ALLOWED_DOC_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf'];

const imageFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) return cb(null, true);
  cb(new AppError('Only JPEG, PNG, WebP, and SVG images are allowed.', 400, 'INVALID_FILE'));
};

const documentFilter = (req, file, cb) => {
  if (ALLOWED_DOC_TYPES.includes(file.mimetype)) return cb(null, true);
  cb(new AppError('Only images and PDF files are allowed.', 400, 'INVALID_FILE'));
};

const uploadSingle = (fieldName, maxSizeMb = 5, isDocument = false) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSizeMb * 1024 * 1024 },
    fileFilter: isDocument ? documentFilter : imageFilter,
  }).single(fieldName);

const uploadMultiple = (fieldName, maxCount = 10, maxSizeMb = 5) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSizeMb * 1024 * 1024 },
    fileFilter: imageFilter,
  }).array(fieldName, maxCount);

module.exports = { uploadSingle, uploadMultiple };
