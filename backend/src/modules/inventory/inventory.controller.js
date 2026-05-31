const asyncHandler = require('../../middleware/asyncHandler');
const AppError = require('../../utils/AppError');
const { getPaginationMeta, getPaginationParams } = require('../../utils/paginate');
const { adjustStock, listMovements, getLowStockVariants } = require('../../db/queries/inventory.queries');

// GET /api/v1/inventory/movements
const listMovementsHandler = asyncHandler(async (req, res) => {
  const { page, perPage } = getPaginationParams(req.query);
  const { variantId, productId } = req.query;
  const result = await listMovements(req.businessId, { variantId, productId, page, perPage });
  res.json({ success: true, data: { movements: result.rows }, meta: getPaginationMeta(result.total, page, perPage) });
});

// POST /api/v1/inventory/adjust
const adjustStockHandler = asyncHandler(async (req, res) => {
  const { variantId, quantityChange, movementType, note } = req.body;
  try {
    const result = await adjustStock(req.businessId, variantId, quantityChange, movementType, note, req.userId);
    res.json({
      success: true,
      data: {
        movement: result.movement,
        stockBefore: result.stockBefore,
        stockAfter: result.stockAfter,
      },
    });
  } catch (err) {
    if (err.message === 'Stock cannot go below zero') {
      throw new AppError('Stock cannot go below zero. Reduce the quantity change.', 400, 'INVALID_STOCK');
    }
    if (err.message === 'Variant not found') {
      throw new AppError('Variant not found.', 404, 'NOT_FOUND');
    }
    throw err;
  }
});

// GET /api/v1/inventory/low-stock
const getLowStockHandler = asyncHandler(async (req, res) => {
  const threshold = parseInt(req.query.threshold) || 5;
  const variants = await getLowStockVariants(req.businessId, threshold);
  res.json({ success: true, data: { variants, threshold } });
});

module.exports = { listMovementsHandler, adjustStockHandler, getLowStockHandler };
