const { config } = require('../config/env');

const isDev = config.nodeEnv !== 'production';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const extractConflictField = (err) => {
  const detailMatch = err.detail?.match(/Key \(([^)]+)\)=/);
  if (detailMatch) return detailMatch[1];
  const constraintMatch = err.constraint?.match(/_([a-z_]+)_key$/);
  if (constraintMatch) return constraintMatch[1];
  return null;
};

const extractFKField = (err) => {
  const detailMatch = err.detail?.match(/Key \(([^)]+)\)=/);
  if (detailMatch) return detailMatch[1];
  return null;
};

/**
 * Log a failed request with enough context to tell:
 *   - Was this a client error (4xx) or a server error (5xx)?
 *   - What endpoint was called?
 *   - What did the request body look like?
 *   - What was the exact error?
 */
const logFailedRequest = (req, statusCode, err, context) => {
  const isClientError = statusCode >= 400 && statusCode < 500;
  const label = isClientError ? '[CLIENT ERROR]' : '[SERVER ERROR]';

  // Sanitise body — remove passwords before logging
  const safeBody = req.body ? { ...req.body } : {};
  if (safeBody.password) safeBody.password = '[REDACTED]';
  if (safeBody.newPassword) safeBody.newPassword = '[REDACTED]';
  if (safeBody.apiKey) safeBody.apiKey = '[REDACTED]';
  if (safeBody.apiSecret) safeBody.apiSecret = '[REDACTED]';

  const parts = [
    `${label} ${statusCode} ${req.method} ${req.originalUrl}`,
    `  code    : ${context.code}`,
    `  message : ${context.message}`,
  ];

  if (Object.keys(safeBody).length) {
    parts.push(`  body    : ${JSON.stringify(safeBody)}`);
  }

  if (req.query && Object.keys(req.query).length) {
    parts.push(`  query   : ${JSON.stringify(req.query)}`);
  }

  if (!isClientError && err?.stack) {
    // Server errors: show the first 4 stack frames so you can find the source
    const stackLines = err.stack.split('\n').slice(0, 5).join('\n  ');
    parts.push(`  stack   :\n  ${stackLines}`);
  }

  if (isClientError) {
    // Client errors are expected — use console.warn so they stand out differently
    console.warn(parts.join('\n'));
  } else {
    console.error(parts.join('\n'));
  }
};

// ─── Global error handler ─────────────────────────────────────────────────────

const globalErrorHandler = (err, req, res, next) => {

  // ── Operational errors (AppError) ─────────────────────────────────────────
  if (err.isOperational) {
    logFailedRequest(req, err.statusCode, err, { code: err.code, message: err.message });
    res.errorHandled = true;
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
  }

  // ── Postgres: unique constraint (23505) ────────────────────────────────────
  if (err.code === '23505') {
    const field = extractConflictField(err);
    const message = field
      ? `${field.replace(/_/g, ' ')} is already taken.`
      : 'A record with this value already exists.';
    logFailedRequest(req, 409, err, { code: 'CONFLICT', message });
    res.errorHandled = true;
    return res.status(409).json({ success: false, error: { code: 'CONFLICT', message } });
  }

  // ── Postgres: foreign key violation (23503) ────────────────────────────────
  if (err.code === '23503') {
    const field = extractFKField(err);
    const message = field
      ? `The referenced ${field.replace(/_/g, ' ')} does not exist.`
      : 'A referenced record does not exist.';
    logFailedRequest(req, 400, err, { code: 'REFERENCE_ERROR', message });
    res.errorHandled = true;
    return res.status(400).json({ success: false, error: { code: 'REFERENCE_ERROR', message } });
  }

  // ── Postgres: not-null violation (23502) ───────────────────────────────────
  if (err.code === '23502') {
    const col = err.column || 'field';
    const message = `${col.replace(/_/g, ' ')} is required.`;
    logFailedRequest(req, 422, err, { code: 'VALIDATION_ERROR', message });
    res.errorHandled = true;
    return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message } });
  }

  // ── Postgres: check constraint (23514) ────────────────────────────────────
  if (err.code === '23514') {
    const message = 'One or more values are out of the allowed range.';
    logFailedRequest(req, 422, err, { code: 'VALIDATION_ERROR', message });
    res.errorHandled = true;
    return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message } });
  }

  // ── Postgres: invalid enum value (22P02) ──────────────────────────────────
  if (err.code === '22P02') {
    const message = 'Invalid value provided for an enum field.';
    logFailedRequest(req, 422, err, { code: 'VALIDATION_ERROR', message });
    res.errorHandled = true;
    return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message } });
  }

  // ── JSON parse error ───────────────────────────────────────────────────────
  if (err.type === 'entity.parse.failed') {
    const message = 'Request body contains invalid JSON.';
    logFailedRequest(req, 400, err, { code: 'INVALID_JSON', message });
    res.errorHandled = true;
    return res.status(400).json({ success: false, error: { code: 'INVALID_JSON', message } });
  }

  // ── Payload too large ──────────────────────────────────────────────────────
  if (err.type === 'entity.too.large') {
    const message = 'Request body exceeds the 1MB size limit.';
    logFailedRequest(req, 413, err, { code: 'PAYLOAD_TOO_LARGE', message });
    res.errorHandled = true;
    return res.status(413).json({ success: false, error: { code: 'PAYLOAD_TOO_LARGE', message } });
  }

  // ── Unknown / unexpected server error ─────────────────────────────────────
  // Always log the full error server-side regardless of environment.
  // In dev: also send stack to the client so the frontend dev can see it.
  // In prod: send a safe message only.
  logFailedRequest(req, 500, err, { code: 'INTERNAL_ERROR', message: err.message });
  res.errorHandled = true;

  if (isDev) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: err.message,
        stack: err.stack?.split('\n').slice(0, 8).join('\n'),
      },
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred. Our team has been notified.',
    },
  });
};

module.exports = { globalErrorHandler };
