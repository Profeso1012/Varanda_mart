const asyncHandler = require('../../middleware/asyncHandler');
const AppError = require('../../utils/AppError');
const cloudinaryService = require('../../services/cloudinary.service');

/**
 * GET /api/v1/cloudinary/sign
 *
 * Returns signed Cloudinary upload parameters for client-side direct upload.
 * The frontend uses these to upload directly to Cloudinary, then sends the
 * resulting secure_url back to the relevant POST/PUT endpoint.
 *
 * Query params:
 *   type     - 'logo' | 'favicon' | 'product' | 'supplier_product' | 'document' | 'avatar'
 *   context  - optional: e.g. productId, supplierId — used to scope the folder path
 *
 * Response:
 *   {
 *     timestamp, folder, allowed_formats, max_file_size,
 *     signature, api_key, cloud_name, resource_type, upload_url
 *   }
 */
const getUploadSignature = asyncHandler(async (req, res) => {
  const { type, context } = req.query;

  const userId = req.userId;
  const businessId = req.businessId || userId;

  let params;

  switch (type) {
    case 'logo':
      params = cloudinaryService.getImageUploadSignature(
        `varanda/businesses/${businessId}/logo`
      );
      break;

    case 'favicon':
      params = cloudinaryService.getImageUploadSignature(
        `varanda/businesses/${businessId}/favicon`
      );
      break;

    case 'product':
      params = cloudinaryService.getImageUploadSignature(
        `varanda/businesses/${businessId}/products${context ? '/' + context : ''}`
      );
      break;

    case 'supplier_product':
      params = cloudinaryService.getImageUploadSignature(
        `varanda/suppliers/${userId}/products${context ? '/' + context : ''}`
      );
      break;

    case 'document':
      // KYC / business verification documents — private, PDF + images
      params = cloudinaryService.getDocumentUploadSignature(
        `varanda/businesses/${businessId}/documents`,
        context ? `${context}_${Date.now()}` : undefined
      );
      break;

    case 'avatar':
      params = cloudinaryService.getImageUploadSignature(
        `varanda/users/${userId}/avatar`
      );
      break;

    case 'category':
      params = cloudinaryService.getImageUploadSignature(
        `varanda/businesses/${businessId}/categories`
      );
      break;

    case 'bundle':
      params = cloudinaryService.getImageUploadSignature(
        `varanda/businesses/${businessId}/bundles`
      );
      break;

    default:
      throw new AppError(
        'Invalid upload type. Must be: logo, favicon, product, supplier_product, document, avatar, category, bundle.',
        422,
        'VALIDATION_ERROR'
      );
  }

  res.json({ success: true, data: params });
});

module.exports = { getUploadSignature };
