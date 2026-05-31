const { z } = require('zod');

const passwordSchema = z
  .string({ required_error: 'Password is required.' })
  .min(8, 'Password must be at least 8 characters long.')
  .max(128, 'Password must be no more than 128 characters.')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter (A–Z).')
  .regex(/[0-9]/, 'Password must contain at least one number (0–9).')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character (e.g. !, @, #, $).');

const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email address is required.' })
    .email('Please enter a valid email address (e.g. user@example.com).'),
  password: passwordSchema,
  firstName: z
    .string({ required_error: 'First name is required.' })
    .min(1, 'First name cannot be empty.')
    .max(100, 'First name must be no more than 100 characters.'),
  lastName: z
    .string({ required_error: 'Last name is required.' })
    .min(1, 'Last name cannot be empty.')
    .max(100, 'Last name must be no more than 100 characters.'),
  phone: z
    .string()
    .max(30, 'Phone number must be no more than 30 characters.')
    .optional(),
});

const verifyEmailSchema = z.object({
  email: z
    .string({ required_error: 'Email address is required.' })
    .email('Please enter a valid email address.'),
  code: z
    .string({ required_error: 'Verification code is required.' })
    .length(6, 'Verification code must be exactly 6 digits.')
    .regex(/^\d+$/, 'Verification code must contain only numbers.'),
});

const roleSelectSchema = z.object({
  role: z.enum(['SELLER', 'SUPPLIER', 'DEVELOPER'], {
    errorMap: (issue) => {
      if (issue.code === 'invalid_type') return { message: 'Role is required.' };
      return { message: 'Role must be one of: SELLER, SUPPLIER, DEVELOPER.' };
    },
  }),
});

const roleAddSchema = z.object({
  addRole: z.enum(['SELLER', 'SUPPLIER'], {
    errorMap: (issue) => {
      if (issue.code === 'invalid_type') return { message: 'addRole is required.' };
      return { message: 'addRole must be either SELLER or SUPPLIER.' };
    },
  }),
});

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email address is required.' })
    .email('Please enter a valid email address.'),
  password: z
    .string({ required_error: 'Password is required.' })
    .min(1, 'Password cannot be empty.'),
});

const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email address is required.' })
    .email('Please enter a valid email address.'),
});

const resetPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email address is required.' })
    .email('Please enter a valid email address.'),
  code: z
    .string({ required_error: 'Reset code is required.' })
    .length(6, 'Reset code must be exactly 6 digits.')
    .regex(/^\d+$/, 'Reset code must contain only numbers.'),
  newPassword: passwordSchema,
});

module.exports = {
  registerSchema,
  verifyEmailSchema,
  roleSelectSchema,
  roleAddSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
