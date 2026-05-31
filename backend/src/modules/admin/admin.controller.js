const asyncHandler = require('../../middleware/asyncHandler');
const AppError = require('../../utils/AppError');
const { sql } = require('../../config/database');
const { getPaginationMeta, getPaginationParams } = require('../../utils/paginate');
const { listUsers: listUsersQuery, banUser: banUserQuery, updateUser } = require('../../db/queries/users.queries');
const { approveDeveloper, suspendDeveloper, listDevelopers } = require('../../db/queries/developerProfiles.queries');
const { verifySupplier: verifySupplierQuery, listSuppliers } = require('../../db/queries/supplierProfiles.queries');
const { listOpenDisputes, updateDispute } = require('../../db/queries/dropshipOrders.queries');
const escrowService = require('../../services/escrow.service');
const emailConfig = require('../../config/email');
const { config } = require('../../config/env');

// GET /api/v1/admin/users
const listUsers = asyncHandler(async (req, res) => {
  const { page, perPage } = getPaginationParams(req.query);
  const { role, status, search } = req.query;
  const result = await listUsersQuery({ role, status, search, page, perPage });
  res.json({ success: true, data: { users: result.rows }, meta: getPaginationMeta(result.total, page, perPage) });
});

// GET /api/v1/admin/users/:userId
const getUser = asyncHandler(async (req, res) => {
  const [user] = await sql`SELECT * FROM users WHERE id = ${req.params.userId}`;
  if (!user) throw new AppError('User not found.', 404, 'NOT_FOUND');
  res.json({ success: true, data: { user } });
});

// PUT /api/v1/admin/users/:userId/suspend
const suspendUser = asyncHandler(async (req, res) => {
  await updateUser(req.params.userId, { is_active: false });
  res.json({ success: true, data: { message: 'User suspended.' } });
});

// PUT /api/v1/admin/users/:userId/unsuspend
const unsuspendUser = asyncHandler(async (req, res) => {
  await updateUser(req.params.userId, { is_active: true });
  res.json({ success: true, data: { message: 'User unsuspended.' } });
});

// DELETE /api/v1/admin/users/:userId/ban
const banUser = asyncHandler(async (req, res) => {
  await banUserQuery(req.params.userId);
  res.json({ success: true, data: { message: 'User permanently banned.' } });
});

// GET /api/v1/admin/businesses
const listBusinesses = asyncHandler(async (req, res) => {
  const { page, perPage, offset } = getPaginationParams(req.query);
  const rows = await sql`
    SELECT b.*, u.email AS owner_email FROM businesses b
    JOIN users u ON u.id = b.owner_id
    ORDER BY b.created_at DESC LIMIT ${perPage} OFFSET ${offset}
  `;
  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM businesses`;
  res.json({ success: true, data: { businesses: rows }, meta: getPaginationMeta(count, page, perPage) });
});

// GET /api/v1/admin/businesses/:id
const getBusiness = asyncHandler(async (req, res) => {
  const [business] = await sql`SELECT * FROM businesses WHERE id = ${req.params.id}`;
  if (!business) throw new AppError('Business not found.', 404, 'NOT_FOUND');
  res.json({ success: true, data: { business } });
});

// PUT /api/v1/admin/businesses/:id/status
const updateBusinessStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const [business] = await sql`
    UPDATE businesses SET status = ${status}, updated_at = NOW()
    WHERE id = ${req.params.id} RETURNING *
  `;
  res.json({ success: true, data: { business } });
});

// GET /api/v1/admin/documents
const listDocuments = asyncHandler(async (req, res) => {
  const { status = 'PENDING' } = req.query;
  const { page, perPage, offset } = getPaginationParams(req.query);
  const rows = await sql`
    SELECT bd.*, b.name AS business_name FROM business_documents bd
    JOIN businesses b ON b.id = bd.business_id
    WHERE bd.status = ${status}
    ORDER BY bd.created_at ASC LIMIT ${perPage} OFFSET ${offset}
  `;
  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM business_documents WHERE status = ${status}`;
  res.json({ success: true, data: { documents: rows }, meta: getPaginationMeta(count, page, perPage) });
});

// PUT /api/v1/admin/documents/:documentId/review
const reviewDocument = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;
  const [doc] = await sql`
    UPDATE business_documents
    SET status = ${status}, reviewed_by = ${req.userId}, reviewed_at = NOW(),
        rejection_reason = ${rejectionReason || null}, updated_at = NOW()
    WHERE id = ${req.params.documentId}
    RETURNING *
  `;
  if (!doc) throw new AppError('Document not found.', 404, 'NOT_FOUND');
  res.json({ success: true, data: { document: doc } });
});

// GET /api/v1/admin/marketplace/products
const listMarketplaceProducts = asyncHandler(async (req, res) => {
  const { status = 'PENDING_REVIEW' } = req.query;
  const { page, perPage, offset } = getPaginationParams(req.query);
  const rows = await sql`
    SELECT sp.*, sup.display_name AS supplier_name FROM supplier_products sp
    JOIN supplier_profiles sup ON sup.id = sp.supplier_id
    WHERE sp.status = ${status} AND sp.deleted_at IS NULL
    ORDER BY sp.created_at ASC LIMIT ${perPage} OFFSET ${offset}
  `;
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM supplier_products WHERE status = ${status} AND deleted_at IS NULL
  `;
  res.json({ success: true, data: { products: rows }, meta: getPaginationMeta(count, page, perPage) });
});

// PUT /api/v1/admin/marketplace/products/:productId/approve
const approveProduct = asyncHandler(async (req, res) => {
  const [product] = await sql`
    UPDATE supplier_products
    SET status = 'ACTIVE', reviewed_by = ${req.userId}, reviewed_at = NOW(), updated_at = NOW()
    WHERE id = ${req.params.productId}
    RETURNING *
  `;
  if (!product) throw new AppError('Product not found.', 404, 'NOT_FOUND');
  res.json({ success: true, data: { product } });
});

// PUT /api/v1/admin/marketplace/products/:productId/reject
const rejectProduct = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const [product] = await sql`
    UPDATE supplier_products
    SET status = 'REJECTED', rejection_reason = ${reason}, reviewed_by = ${req.userId},
        reviewed_at = NOW(), updated_at = NOW()
    WHERE id = ${req.params.productId}
    RETURNING *
  `;
  if (!product) throw new AppError('Product not found.', 404, 'NOT_FOUND');
  res.json({ success: true, data: { product } });
});

// GET /api/v1/admin/suppliers
const listSuppliersHandler = asyncHandler(async (req, res) => {
  const { page, perPage } = getPaginationParams(req.query);
  const result = await listSuppliers({ page, perPage });
  res.json({ success: true, data: { suppliers: result.rows }, meta: getPaginationMeta(result.total, page, perPage) });
});

// PUT /api/v1/admin/suppliers/:supplierId/verify
const verifySupplierHandler = asyncHandler(async (req, res) => {
  const supplier = await verifySupplierQuery(req.params.supplierId, req.userId);
  res.json({ success: true, data: { supplier } });
});

// GET /api/v1/admin/developers
const listDevelopersHandler = asyncHandler(async (req, res) => {
  const { page, perPage } = getPaginationParams(req.query);
  const { status } = req.query;
  const result = await listDevelopers({ status, page, perPage });
  res.json({ success: true, data: { developers: result.rows }, meta: getPaginationMeta(result.total, page, perPage) });
});

// PUT /api/v1/admin/developers/:developerId/approve
const approveDeveloperHandler = asyncHandler(async (req, res) => {
  const profile = await approveDeveloper(req.params.developerId, req.userId);
  const [user] = await sql`SELECT * FROM users WHERE id = ${profile.user_id}`;
  if (user) {
    emailConfig
      .sendDeveloperApproval(user.email, user.first_name || 'Developer', `${config.developerPortalUrl}/setup`)
      .catch(() => {});
  }
  res.json({ success: true, data: { developer: profile } });
});

// PUT /api/v1/admin/developers/:developerId/suspend
const suspendDeveloperHandler = asyncHandler(async (req, res) => {
  const profile = await suspendDeveloper(req.params.developerId);
  res.json({ success: true, data: { developer: profile } });
});

// GET /api/v1/admin/disputes
const listDisputes = asyncHandler(async (req, res) => {
  const { page, perPage } = getPaginationParams(req.query);
  const result = await listOpenDisputes({ page, perPage });
  res.json({ success: true, data: { disputes: result.rows }, meta: getPaginationMeta(result.total, page, perPage) });
});

// PUT /api/v1/admin/disputes/:disputeId/resolve
const resolveDispute = asyncHandler(async (req, res) => {
  const { resolution, action, banSupplierId, banSellerId } = req.body;

  if (action === 'RELEASE') {
    await escrowService.resolveDisputeRelease(req.params.disputeId, req.userId, resolution);
  } else if (action === 'REFUND') {
    await escrowService.resolveDisputeRefund(req.params.disputeId, req.userId, resolution);
  } else if (action === 'SPLIT') {
    // Custom split — Phase 4 full implementation
    await escrowService.resolveDisputeRefund(req.params.disputeId, req.userId, resolution);
  }

  if (banSupplierId) await banUserQuery(banSupplierId);
  if (banSellerId) await banUserQuery(banSellerId);

  const [dispute] = await sql`SELECT * FROM supplier_disputes WHERE id = ${req.params.disputeId}`;
  const escrow = dispute
    ? await sql`SELECT status FROM escrow_transactions WHERE dropship_order_id = ${dispute.dropship_order_id}`
    : [];

  res.json({
    success: true,
    data: {
      dispute: { status: 'RESOLVED', resolutionAction: action },
      escrow: { status: escrow[0]?.status || 'UNKNOWN' },
    },
  });
});

// GET /api/v1/admin/commissions
const listCommissions = asyncHandler(async (req, res) => {
  const { page, perPage, offset } = getPaginationParams(req.query);
  const rows = await sql`
    SELECT c.*, o.order_number, b.name AS business_name FROM commissions c
    JOIN orders o ON o.id = c.order_id
    JOIN businesses b ON b.id = c.business_id
    ORDER BY c.created_at DESC LIMIT ${perPage} OFFSET ${offset}
  `;
  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM commissions`;
  res.json({ success: true, data: { commissions: rows }, meta: getPaginationMeta(count, page, perPage) });
});

// GET /api/v1/admin/stats
const getStats = asyncHandler(async (req, res) => {
  const [users] = await sql`SELECT COUNT(*)::int AS total FROM users`;
  const [businesses] = await sql`SELECT COUNT(*)::int AS total FROM businesses`;
  const [orders] = await sql`SELECT COUNT(*)::int AS total, COALESCE(SUM(total),0) AS revenue FROM orders WHERE payment_status = 'PAID'`;
  const [disputes] = await sql`SELECT COUNT(*)::int AS open FROM supplier_disputes WHERE status = 'OPEN'`;
  res.json({
    success: true,
    data: {
      totalUsers: users.total,
      totalBusinesses: businesses.total,
      totalOrders: orders.total,
      totalRevenue: orders.revenue,
      openDisputes: disputes.open,
    },
  });
});

// DELETE /api/v1/admin/reviews/:reviewId
const deleteReview = asyncHandler(async (req, res) => {
  await sql`DELETE FROM reviews WHERE id = ${req.params.reviewId}`;
  res.json({ success: true, data: { message: 'Review deleted.' } });
});

module.exports = {
  listUsers, getUser, suspendUser, unsuspendUser, banUser,
  listBusinesses, getBusiness, updateBusinessStatus,
  listDocuments, reviewDocument,
  listMarketplaceProducts, approveProduct, rejectProduct,
  listSuppliers: listSuppliersHandler, verifySupplier: verifySupplierHandler,
  listDevelopers: listDevelopersHandler, approveDeveloper: approveDeveloperHandler, suspendDeveloper: suspendDeveloperHandler,
  listDisputes, resolveDispute,
  listCommissions, getStats, deleteReview,
};
