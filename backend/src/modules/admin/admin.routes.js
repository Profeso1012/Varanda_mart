const { Router } = require('express');
const c = require('./admin.controller');

const router = Router();

// Users
router.get('/users', c.listUsers);
router.get('/users/:userId', c.getUser);
router.put('/users/:userId/suspend', c.suspendUser);
router.put('/users/:userId/unsuspend', c.unsuspendUser);
router.delete('/users/:userId/ban', c.banUser);

// Businesses
router.get('/businesses', c.listBusinesses);
router.get('/businesses/:id', c.getBusiness);
router.put('/businesses/:id/status', c.updateBusinessStatus);

// Documents
router.get('/documents', c.listDocuments);
router.put('/documents/:documentId/review', c.reviewDocument);

// Marketplace products
router.get('/marketplace/products', c.listMarketplaceProducts);
router.put('/marketplace/products/:productId/approve', c.approveProduct);
router.put('/marketplace/products/:productId/reject', c.rejectProduct);

// Suppliers
router.get('/suppliers', c.listSuppliers);
router.put('/suppliers/:supplierId/verify', c.verifySupplier);

// Developers
router.get('/developers', c.listDevelopers);
router.put('/developers/:developerId/approve', c.approveDeveloper);
router.put('/developers/:developerId/suspend', c.suspendDeveloper);

// Disputes
router.get('/disputes', c.listDisputes);
router.put('/disputes/:disputeId/resolve', c.resolveDispute);

// Stats & commissions
router.get('/commissions', c.listCommissions);
router.get('/stats', c.getStats);

// Reviews
router.delete('/reviews/:reviewId', c.deleteReview);

module.exports = router;
