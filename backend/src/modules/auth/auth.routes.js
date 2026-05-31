const { Router } = require('express');
const controller = require('./auth.controller');
const { validate } = require('../../middleware/validate.middleware');
const { requireSellerAuth } = require('../../middleware/auth.middleware');
const { authRateLimiter, otpRateLimiter } = require('../../middleware/rateLimiter.middleware');
const {
  registerSchema,
  verifyEmailSchema,
  roleSelectSchema,
  roleAddSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('./auth.schema');

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), controller.register);
router.post('/verify-email', otpRateLimiter, validate(verifyEmailSchema), controller.verifyEmail);
router.post('/role/select', requireSellerAuth, validate(roleSelectSchema), controller.selectRole);
router.post('/role/add', requireSellerAuth, validate(roleAddSchema), controller.addRole);
router.post('/login', authRateLimiter, validate(loginSchema), controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), controller.forgotPassword);
router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), controller.resetPassword);
router.get('/me', requireSellerAuth, controller.getMe);

module.exports = router;
