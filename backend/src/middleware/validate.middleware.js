/**
 * Zod validation middleware.
 * Maps Zod errors to human-readable, field-specific messages.
 */

const formatZodError = (zodError) => {
  return zodError.errors.map((e) => {
    const field = e.path.join('.');
    let message = e.message;

    // Make Zod's default messages more human-readable
    switch (e.code) {
      case 'invalid_type':
        if (e.received === 'undefined') {
          message = `${field || 'This field'} is required.`;
        } else {
          message = `${field || 'This field'} must be a ${e.expected}, got ${e.received}.`;
        }
        break;
      case 'too_small':
        if (e.type === 'string') {
          message = e.minimum === 1
            ? `${field || 'This field'} cannot be empty.`
            : `${field || 'This field'} must be at least ${e.minimum} character${e.minimum !== 1 ? 's' : ''}.`;
        } else if (e.type === 'number') {
          message = `${field || 'This field'} must be at least ${e.minimum}.`;
        } else if (e.type === 'array') {
          message = `${field || 'This field'} must contain at least ${e.minimum} item${e.minimum !== 1 ? 's' : ''}.`;
        }
        break;
      case 'too_big':
        if (e.type === 'string') {
          message = `${field || 'This field'} must be no more than ${e.maximum} character${e.maximum !== 1 ? 's' : ''}.`;
        } else if (e.type === 'number') {
          message = `${field || 'This field'} must be no more than ${e.maximum}.`;
        }
        break;
      case 'invalid_string':
        if (e.validation === 'email') {
          message = `${field || 'Email'} must be a valid email address (e.g. user@example.com).`;
        } else if (e.validation === 'url') {
          message = `${field || 'URL'} must be a valid URL (e.g. https://example.com).`;
        } else if (e.validation === 'uuid') {
          message = `${field || 'ID'} must be a valid UUID.`;
        } else if (e.validation === 'regex') {
          // Keep the custom message from the schema definition
          message = e.message;
        }
        break;
      case 'invalid_enum_value':
        message = `${field || 'This field'} must be one of: ${e.options?.join(', ')}.`;
        break;
      case 'invalid_literal':
        message = `${field || 'This field'} must be exactly: ${e.expected}.`;
        break;
      case 'unrecognized_keys':
        message = `Unexpected field${e.keys.length > 1 ? 's' : ''}: ${e.keys.join(', ')}.`;
        break;
      default:
        // Use the message from the schema (e.g. custom .refine() messages)
        message = e.message;
    }

    return { field: field || '_root', message };
  });
};

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const details = formatZodError(result.error);
    // Return only the first error — frontend toasts this message directly to the user.
    // The full details array is included so the frontend can also highlight specific fields.
    const first = details[0];
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: first.message,
        field: first.field !== '_root' ? first.field : undefined,
        details,
      },
    });
  }
  req.body = result.data;
  next();
};

const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    const details = formatZodError(result.error);
    const first = details[0];
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: first.message,
        field: first.field !== '_root' ? first.field : undefined,
        details,
      },
    });
  }
  req.query = result.data;
  next();
};

module.exports = { validate, validateQuery };
