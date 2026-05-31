const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../utils/AppError');

/**
 * Returns a stub middleware that responds with 501 and the phase it belongs to.
 * Used for routes that are defined in the architecture but not yet implemented.
 */
const stub = (phase) =>
  asyncHandler(async (req, res) => {
    throw new AppError(
      `This endpoint is implemented in ${phase}. Check back when that phase is complete.`,
      501,
      'NOT_IMPLEMENTED'
    );
  });

module.exports = { stub };
