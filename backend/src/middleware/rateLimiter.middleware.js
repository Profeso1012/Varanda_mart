const rateLimit = require('express-rate-limit');

/**
 * When deployed behind a reverse proxy (Render, Heroku, Nginx), the proxy sets
 * X-Forwarded-For. express-rate-limit throws ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
 * unless Express's trust proxy is set OR we tell the limiter to skip that validation.
 *
 * We handle trust proxy in app.js (app.set('trust proxy', 1) in production).
 * The validate option below suppresses the warning in development where the header
 * may still appear (e.g. when testing through a local proxy or ngrok).
 */
const limiterDefaults = {
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    // Suppress the X-Forwarded-For warning — we handle trust proxy in app.js
    xForwardedForHeader: false,
    // Keep all other validations active
    default: true,
  },
};

const generalRateLimiter = rateLimit({
  ...limiterDefaults,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down and try again in a few minutes.' },
  },
});

const authRateLimiter = rateLimit({
  ...limiterDefaults,
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Please wait 15 minutes before trying again.' },
  },
});

const otpRateLimiter = rateLimit({
  ...limiterDefaults,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many verification code requests. Please wait 1 hour before requesting another code.' },
  },
});

const storefrontRateLimiter = rateLimit({
  ...limiterDefaults,
  windowMs: 1 * 60 * 1000,
  max: 120,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests to this storefront. Please try again shortly.' },
  },
});

module.exports = { generalRateLimiter, authRateLimiter, otpRateLimiter, storefrontRateLimiter };
