const { sql } = require('../../config/database');

// ─── Shipping zones ───────────────────────────────────────────────────────────

const listShippingZones = async (businessId) => {
  const zones = await sql`
    SELECT sz.*,
      json_agg(DISTINCT jsonb_build_object('id', szr.id, 'regionType', szr.region_type, 'regionValue', szr.region_value))
        FILTER (WHERE szr.id IS NOT NULL) AS regions,
      json_agg(DISTINCT jsonb_build_object(
        'id', sr.id, 'name', sr.name, 'description', sr.description,
        'rateType', sr.rate_type, 'flatRate', sr.flat_rate, 'weightRate', sr.weight_rate,
        'minOrder', sr.min_order, 'estimatedDays', sr.estimated_days, 'isActive', sr.is_active
      )) FILTER (WHERE sr.id IS NOT NULL) AS rates
    FROM shipping_zones sz
    LEFT JOIN shipping_zone_regions szr ON szr.zone_id = sz.id
    LEFT JOIN shipping_rates sr ON sr.zone_id = sz.id
    WHERE sz.business_id = ${businessId}
    GROUP BY sz.id
    ORDER BY sz.is_default DESC, sz.created_at ASC
  `;
  return zones.map((z) => ({
    ...z,
    regions: z.regions || [],
    rates: z.rates || [],
  }));
};

const findShippingZoneById = async (id, businessId) => {
  const [zone] = await sql`
    SELECT * FROM shipping_zones WHERE id = ${id} AND business_id = ${businessId}
  `;
  return zone || null;
};

const createShippingZone = async (businessId, { name, isDefault }) => {
  // Only one default zone allowed
  if (isDefault) {
    await sql`UPDATE shipping_zones SET is_default = false WHERE business_id = ${businessId}`;
  }
  const [zone] = await sql`
    INSERT INTO shipping_zones (business_id, name, is_default)
    VALUES (${businessId}, ${name}, ${isDefault ?? false})
    RETURNING *
  `;
  return zone;
};

const updateShippingZone = async (id, businessId, { name, isDefault, isActive }) => {
  if (isDefault) {
    await sql`UPDATE shipping_zones SET is_default = false WHERE business_id = ${businessId}`;
  }
  const fields = {};
  if (name !== undefined) fields.name = name;
  if (isDefault !== undefined) fields.is_default = isDefault;
  if (isActive !== undefined) fields.is_active = isActive;
  const keys = Object.keys(fields);
  if (!keys.length) return null;
  const [zone] = await sql`
    UPDATE shipping_zones SET ${sql(fields, keys)}, updated_at = NOW()
    WHERE id = ${id} AND business_id = ${businessId}
    RETURNING *
  `;
  return zone;
};

const deleteShippingZone = async (id, businessId) => {
  await sql`DELETE FROM shipping_zones WHERE id = ${id} AND business_id = ${businessId}`;
};

// ─── Zone regions ─────────────────────────────────────────────────────────────

const addZoneRegion = async (zoneId, { regionType, regionValue }) => {
  const [region] = await sql`
    INSERT INTO shipping_zone_regions (zone_id, region_type, region_value)
    VALUES (${zoneId}, ${regionType}, ${regionValue})
    RETURNING *
  `;
  return region;
};

const deleteZoneRegion = async (regionId, zoneId) => {
  await sql`DELETE FROM shipping_zone_regions WHERE id = ${regionId} AND zone_id = ${zoneId}`;
};

// ─── Shipping rates ───────────────────────────────────────────────────────────

const createShippingRate = async (zoneId, data) => {
  const [rate] = await sql`
    INSERT INTO shipping_rates (
      zone_id, name, description, rate_type, flat_rate,
      min_weight, max_weight, weight_rate, min_order, estimated_days, is_active
    ) VALUES (
      ${zoneId}, ${data.name}, ${data.description || null},
      ${data.rateType || 'FLAT'}, ${data.flatRate || null},
      ${data.minWeight || null}, ${data.maxWeight || null}, ${data.weightRate || null},
      ${data.minOrder || null}, ${data.estimatedDays || null}, ${data.isActive ?? true}
    )
    RETURNING *
  `;
  return rate;
};

const updateShippingRate = async (rateId, data) => {
  const fieldMap = {
    name: data.name, description: data.description, rate_type: data.rateType,
    flat_rate: data.flatRate, min_weight: data.minWeight, max_weight: data.maxWeight,
    weight_rate: data.weightRate, min_order: data.minOrder,
    estimated_days: data.estimatedDays, is_active: data.isActive,
  };
  const fields = {};
  for (const [k, v] of Object.entries(fieldMap)) {
    if (v !== undefined) fields[k] = v;
  }
  const keys = Object.keys(fields);
  if (!keys.length) return null;
  const [rate] = await sql`
    UPDATE shipping_rates SET ${sql(fields, keys)}, updated_at = NOW()
    WHERE id = ${rateId}
    RETURNING *
  `;
  return rate;
};

const deleteShippingRate = async (rateId) => {
  await sql`DELETE FROM shipping_rates WHERE id = ${rateId}`;
};

const findShippingRateById = async (id) => {
  const [rate] = await sql`SELECT * FROM shipping_rates WHERE id = ${id}`;
  return rate || null;
};

// ─── Rate resolver ────────────────────────────────────────────────────────────

/**
 * Resolve shipping rates for a customer address.
 *
 * Priority for manual zones: CITY > STATE > COUNTRY > default zone.
 * If Shipbubble is connected and active, live rates are fetched and merged.
 * The seller can mix: some zones use manual rates, Shipbubble covers the rest.
 *
 * FREE rate with min_order: only shown when orderTotal >= min_order.
 * FLAT rate with min_order: becomes free (₦0) when orderTotal >= min_order.
 *
 * @param {string} businessId
 * @param {object} params
 * @param {string} params.city
 * @param {string} params.state
 * @param {string} params.country
 * @param {number|null} params.orderWeight - kg, for weight-based rates
 * @param {number|null} params.orderTotal - ₦, for min_order free-shipping threshold
 * @param {object|null} params.shipbubbleIntegration - { apiKey (decrypted), originAddress } if connected
 * @param {object|null} params.receiverAddress - full address for Shipbubble live rates
 */
const resolveShippingRates = async (businessId, {
  city, state, country, orderWeight, orderTotal,
  shipbubbleIntegration = null, receiverAddress = null,
}) => {
  // ── Step 1: find the best matching manual zone ──────────────────────────────
  // Priority: CITY > STATE > COUNTRY > default

  let zoneId = null;

  // CITY match (most specific)
  if (city) {
    const [row] = await sql`
      SELECT DISTINCT sz.id FROM shipping_zones sz
      JOIN shipping_zone_regions szr ON szr.zone_id = sz.id
      WHERE sz.business_id = ${businessId} AND sz.is_active = true
        AND szr.region_type = 'CITY'
        AND LOWER(szr.region_value) = LOWER(${city})
      LIMIT 1
    `;
    zoneId = row?.id || null;
  }

  // STATE match
  if (!zoneId && state) {
    const [row] = await sql`
      SELECT DISTINCT sz.id FROM shipping_zones sz
      JOIN shipping_zone_regions szr ON szr.zone_id = sz.id
      WHERE sz.business_id = ${businessId} AND sz.is_active = true
        AND szr.region_type = 'STATE'
        AND LOWER(szr.region_value) = LOWER(${state})
      LIMIT 1
    `;
    zoneId = row?.id || null;
  }

  // COUNTRY match
  if (!zoneId && country) {
    const [row] = await sql`
      SELECT DISTINCT sz.id FROM shipping_zones sz
      JOIN shipping_zone_regions szr ON szr.zone_id = sz.id
      WHERE sz.business_id = ${businessId} AND sz.is_active = true
        AND szr.region_type = 'COUNTRY'
        AND LOWER(szr.region_value) = LOWER(${country})
      LIMIT 1
    `;
    zoneId = row?.id || null;
  }

  // Default zone fallback
  if (!zoneId) {
    const [row] = await sql`
      SELECT id FROM shipping_zones
      WHERE business_id = ${businessId} AND is_default = true AND is_active = true
      LIMIT 1
    `;
    zoneId = row?.id || null;
  }

  // ── Step 2: build manual rates from the matched zone ───────────────────────
  let manualRates = [];
  if (zoneId) {
    const dbRates = await sql`
      SELECT * FROM shipping_rates WHERE zone_id = ${zoneId} AND is_active = true
      ORDER BY flat_rate ASC NULLS LAST
    `;

    for (const r of dbRates) {
      // Weight-based: filter by weight range
      if (r.rate_type === 'WEIGHT_BASED') {
        if (!orderWeight) continue; // can't compute without weight
        const w = Number(orderWeight);
        if (r.min_weight && w < Number(r.min_weight)) continue;
        if (r.max_weight && w > Number(r.max_weight)) continue;
      }

      // FREE rate with min_order: only show when order meets the threshold
      if (r.rate_type === 'FREE' && r.min_order && orderTotal) {
        if (Number(orderTotal) < Number(r.min_order)) continue;
      }

      // FLAT rate with min_order: becomes ₦0 when order meets threshold
      let computedRate;
      if (r.rate_type === 'FREE') {
        computedRate = 0;
      } else if (r.rate_type === 'WEIGHT_BASED') {
        computedRate = Math.round(Number(r.weight_rate) * Number(orderWeight || 0));
      } else {
        // FLAT — check if min_order threshold makes it free
        const isFreeThresholdMet = r.min_order && orderTotal && Number(orderTotal) >= Number(r.min_order);
        computedRate = isFreeThresholdMet ? 0 : Number(r.flat_rate || 0);
      }

      manualRates.push({
        id: r.id,
        name: r.name,
        description: r.description,
        estimatedDays: r.estimated_days,
        rate: computedRate,
        isFree: computedRate === 0,
        source: 'MANUAL',
      });
    }
  }

  // ── Step 3: Shipbubble live rates (if connected and active) ────────────────
  let shipbubbleRates = [];
  if (shipbubbleIntegration?.apiKey && shipbubbleIntegration?.originAddress && receiverAddress) {
    try {
      const packages = [{
        weight: orderWeight || 0.5,
        length: 20, width: 20, height: 10, // default dimensions if not provided
      }];

      const origin = shipbubbleIntegration.originAddress;
      const senderAddress = {
        name: origin.contactName || 'Sender',
        email: origin.email || '',
        phone: origin.phone || '',
        address: origin.streetAddress || '',
        city: origin.city || '',
        state: origin.state || '',
        country: origin.country || 'Nigeria',
      };

      const shipbubbleConfig = require('../../config/shipbubble');
      const liveRates = await shipbubbleConfig.getLiveRates(
        shipbubbleIntegration.apiKey,
        { senderAddress, receiverAddress, packages }
      );
      shipbubbleRates = liveRates;
    } catch (err) {
      // Live rates failed — fall back to manual only, don't crash checkout
      console.warn('[shipping] Shipbubble live rates failed:', err.message);
    }
  }

  // ── Step 4: merge and return ───────────────────────────────────────────────
  // If Shipbubble is connected, return both manual and live rates.
  // The customer picks one. Manual rates appear first (seller-defined), then live.
  const allRates = [...manualRates, ...shipbubbleRates];

  return {
    source: shipbubbleRates.length > 0 ? 'MIXED' : (manualRates.length > 0 ? 'MANUAL' : 'NONE'),
    zoneId: zoneId || null,
    rates: allRates,
  };
};

// ─── Shipping policies ────────────────────────────────────────────────────────

const listShippingPolicies = async (businessId) => {
  return sql`
    SELECT * FROM shipping_policies WHERE business_id = ${businessId} ORDER BY created_at ASC
  `;
};

const findShippingPolicyById = async (id, businessId) => {
  const [p] = await sql`SELECT * FROM shipping_policies WHERE id = ${id} AND business_id = ${businessId}`;
  return p || null;
};

const createShippingPolicy = async (businessId, { title, slug, content, isActive }) => {
  const [p] = await sql`
    INSERT INTO shipping_policies (business_id, title, slug, content, is_active)
    VALUES (${businessId}, ${title}, ${slug}, ${content}, ${isActive ?? true})
    RETURNING *
  `;
  return p;
};

const updateShippingPolicy = async (id, businessId, fields) => {
  const keys = Object.keys(fields);
  if (!keys.length) return null;
  const [p] = await sql`
    UPDATE shipping_policies SET ${sql(fields, keys)}, updated_at = NOW()
    WHERE id = ${id} AND business_id = ${businessId}
    RETURNING *
  `;
  return p;
};

const deleteShippingPolicy = async (id, businessId) => {
  await sql`DELETE FROM shipping_policies WHERE id = ${id} AND business_id = ${businessId}`;
};

module.exports = {
  listShippingZones,
  findShippingZoneById,
  createShippingZone,
  updateShippingZone,
  deleteShippingZone,
  addZoneRegion,
  deleteZoneRegion,
  createShippingRate,
  updateShippingRate,
  deleteShippingRate,
  findShippingRateById,
  resolveShippingRates,
  listShippingPolicies,
  findShippingPolicyById,
  createShippingPolicy,
  updateShippingPolicy,
  deleteShippingPolicy,
};
