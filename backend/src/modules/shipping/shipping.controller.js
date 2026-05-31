const asyncHandler = require('../../middleware/asyncHandler');
const AppError = require('../../utils/AppError');
const { slugify } = require('../../utils/slugify');

const {
  listShippingZones, findShippingZoneById,
  createShippingZone, updateShippingZone, deleteShippingZone,
  addZoneRegion, deleteZoneRegion,
  createShippingRate, updateShippingRate, deleteShippingRate, findShippingRateById,
  listShippingPolicies, findShippingPolicyById,
  createShippingPolicy, updateShippingPolicy, deleteShippingPolicy,
} = require('../../db/queries/shipping.queries');

// ─── Zones ────────────────────────────────────────────────────────────────────

const getZones = asyncHandler(async (req, res) => {
  const zones = await listShippingZones(req.businessId);
  res.json({ success: true, data: { zones } });
});

const createZone = asyncHandler(async (req, res) => {
  const { name, isDefault } = req.body;
  if (!name) throw new AppError('name is required.', 422, 'VALIDATION_ERROR');
  const zone = await createShippingZone(req.businessId, { name, isDefault });
  res.status(201).json({ success: true, data: { zone } });
});

const updateZone = asyncHandler(async (req, res) => {
  const zone = await updateShippingZone(req.params.zoneId, req.businessId, req.body);
  if (!zone) throw new AppError('Zone not found.', 404, 'NOT_FOUND');
  res.json({ success: true, data: { zone } });
});

const deleteZone = asyncHandler(async (req, res) => {
  const zone = await findShippingZoneById(req.params.zoneId, req.businessId);
  if (!zone) throw new AppError('Zone not found.', 404, 'NOT_FOUND');
  await deleteShippingZone(req.params.zoneId, req.businessId);
  res.json({ success: true, data: { message: 'Zone deleted.' } });
});

// ─── Zone regions ─────────────────────────────────────────────────────────────

const addRegion = asyncHandler(async (req, res) => {
  const { regionType, regionValue } = req.body;
  if (!regionType || !regionValue) {
    throw new AppError('regionType and regionValue are required.', 422, 'VALIDATION_ERROR');
  }
  const zone = await findShippingZoneById(req.params.zoneId, req.businessId);
  if (!zone) throw new AppError('Zone not found.', 404, 'NOT_FOUND');

  const region = await addZoneRegion(req.params.zoneId, { regionType, regionValue });
  res.status(201).json({ success: true, data: { region } });
});

const deleteRegion = asyncHandler(async (req, res) => {
  await deleteZoneRegion(req.params.regionId, req.params.zoneId);
  res.json({ success: true, data: { message: 'Region removed.' } });
});

// ─── Rates ────────────────────────────────────────────────────────────────────

const createRate = asyncHandler(async (req, res) => {
  const zone = await findShippingZoneById(req.params.zoneId, req.businessId);
  if (!zone) throw new AppError('Zone not found.', 404, 'NOT_FOUND');

  const rate = await createShippingRate(req.params.zoneId, req.body);
  res.status(201).json({ success: true, data: { rate } });
});

const updateRate = asyncHandler(async (req, res) => {
  const rate = await updateShippingRate(req.params.rateId, req.body);
  if (!rate) throw new AppError('Rate not found.', 404, 'NOT_FOUND');
  res.json({ success: true, data: { rate } });
});

const deleteRate = asyncHandler(async (req, res) => {
  await deleteShippingRate(req.params.rateId);
  res.json({ success: true, data: { message: 'Rate deleted.' } });
});

// ─── Policies ─────────────────────────────────────────────────────────────────

const getPolicies = asyncHandler(async (req, res) => {
  const policies = await listShippingPolicies(req.businessId);
  res.json({ success: true, data: { policies } });
});

const createPolicy = asyncHandler(async (req, res) => {
  const { title, content, isActive } = req.body;
  if (!title || !content) throw new AppError('title and content are required.', 422, 'VALIDATION_ERROR');
  const slug = slugify(title);
  const policy = await createShippingPolicy(req.businessId, { title, slug, content, isActive });
  res.status(201).json({ success: true, data: { policy } });
});

const updatePolicy = asyncHandler(async (req, res) => {
  const { title, content, isActive } = req.body;
  const fields = {};
  if (title !== undefined) { fields.title = title; fields.slug = slugify(title); }
  if (content !== undefined) fields.content = content;
  if (isActive !== undefined) fields.is_active = isActive;

  const policy = await updateShippingPolicy(req.params.policyId, req.businessId, fields);
  if (!policy) throw new AppError('Policy not found.', 404, 'NOT_FOUND');
  res.json({ success: true, data: { policy } });
});

const deletePolicy = asyncHandler(async (req, res) => {
  const existing = await findShippingPolicyById(req.params.policyId, req.businessId);
  if (!existing) throw new AppError('Policy not found.', 404, 'NOT_FOUND');
  await deleteShippingPolicy(req.params.policyId, req.businessId);
  res.json({ success: true, data: { message: 'Policy deleted.' } });
});

module.exports = {
  getZones, createZone, updateZone, deleteZone,
  addRegion, deleteRegion,
  createRate, updateRate, deleteRate,
  getPolicies, createPolicy, updatePolicy, deletePolicy,
};
