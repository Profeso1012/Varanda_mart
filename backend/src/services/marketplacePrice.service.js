const { config } = require('../config/env');

/**
 * The single authoritative source for all marketplace price calculations.
 * No other file should compute markup manually — always use these functions.
 */

/**
 * Apply platform markup to a supplier price.
 * display_price = supplier_price * (1 + markupRate)
 */
const applyMarkup = (supplierPrice, markupRate) => {
  const rate = Number(markupRate !== undefined ? markupRate : config.platformMarkupRate);
  return Math.round(Number(supplierPrice) * (1 + rate) * 100) / 100;
};

/**
 * Compute seller margin given their retail price and the supplier's true price.
 * marginAmount = retailPrice - applyMarkup(supplierPrice)
 */
const computeSellerMargin = (retailPrice, supplierPrice, markupRate) => {
  const displayPrice = applyMarkup(supplierPrice, markupRate);
  const marginAmount = Number(retailPrice) - displayPrice;
  const marginPercent = Number(retailPrice) > 0 ? (marginAmount / Number(retailPrice)) * 100 : 0;
  return {
    marginAmount: Math.round(marginAmount * 100) / 100,
    marginPercent: Math.round(marginPercent * 100) / 100,
  };
};

/**
 * Compute Varanda's markup revenue on a supplier price.
 * markup_revenue = supplier_price * markupRate
 */
const computePlatformMarkupRevenue = (supplierPrice, markupRate) => {
  const rate = Number(markupRate !== undefined ? markupRate : config.platformMarkupRate);
  return Math.round(Number(supplierPrice) * rate * 100) / 100;
};

module.exports = { applyMarkup, computeSellerMargin, computePlatformMarkupRevenue };
