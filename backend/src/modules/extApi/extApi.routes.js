const { Router } = require('express');
const c = require('./extApi.controller');
const { validate } = require('../../middleware/validate.middleware');
const { registerSchema, credentialsSchema } = require('./extApi.schema');
const { requireSellerAuth } = require('../../middleware/auth.middleware');

const router = Router();

// No auth — developer registration
router.post('/register', validate(registerSchema), c.register);

// Bearer auth — developer must be logged in and approved
router.post('/credentials', requireSellerAuth, c.generateCredentials);
router.post('/credentials/rotate', requireSellerAuth, c.rotateCredentials);

module.exports = router;
