/**
 * Invoice Service — Full implementation in Phase 9.
 * Generates PDFs via PDFKit, uploads to Cloudinary private folder, returns signed URLs.
 */

const pdfConfig = require('../config/pdf');
const cloudinaryService = require('./cloudinary.service');
const AppError = require('../utils/AppError');

const generateAndStoreInvoice = async (orderId, type, businessId, notes) => {
  // Phase 9 implementation
  throw new AppError('Invoice generation not yet implemented.', 501, 'NOT_IMPLEMENTED');
};

const generateManualInvoice = async (data, businessId) => {
  throw new AppError('Manual invoice not yet implemented.', 501, 'NOT_IMPLEMENTED');
};

const sendInvoiceByEmail = async (invoiceId, businessId) => {
  throw new AppError('Invoice email not yet implemented.', 501, 'NOT_IMPLEMENTED');
};

module.exports = { generateAndStoreInvoice, generateManualInvoice, sendInvoiceByEmail };
