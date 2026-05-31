const { Router } = require('express');
const {
  getZones, createZone, updateZone, deleteZone,
  addRegion, deleteRegion,
  createRate, updateRate, deleteRate,
  getPolicies, createPolicy, updatePolicy, deletePolicy,
} = require('./shipping.controller');

const router = Router();

// Zones
router.get('/zones', getZones);
router.post('/zones', createZone);
router.put('/zones/:zoneId', updateZone);
router.delete('/zones/:zoneId', deleteZone);

// Zone regions
router.post('/zones/:zoneId/regions', addRegion);
router.delete('/zones/:zoneId/regions/:regionId', deleteRegion);

// Rates
router.post('/zones/:zoneId/rates', createRate);
router.put('/rates/:rateId', updateRate);
router.delete('/rates/:rateId', deleteRate);

// Policies
router.get('/policies', getPolicies);
router.post('/policies', createPolicy);
router.put('/policies/:policyId', updatePolicy);
router.delete('/policies/:policyId', deletePolicy);

module.exports = router;
