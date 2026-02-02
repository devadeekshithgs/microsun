import { z } from 'zod';

// ============================================
// COMMON VALIDATION PATTERNS
// ============================================

// Indian phone number: 10 digits starting with 6-9
export const indianPhoneRegex = /^[6-9]\d{9}$/;

// GSTIN: 15 characters alphanumeric (optional)
export const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// ============================================
// REUSABLE FIELD SCHEMAS
// ============================================

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email must be less than 255 characters');

export const phoneSchema = z
  .string()
  .trim()
  .regex(indianPhoneRegex, 'Please enter a valid 10-digit Indian mobile number (starting with 6-9)');

export const optionalPhoneSchema = z
  .string()
  .trim()
  .refine(
    (val) => val === '' || indianPhoneRegex.test(val),
    'Please enter a valid 10-digit Indian mobile number (starting with 6-9)'
  )
  .optional()
  .or(z.literal(''));

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const nameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters');

export const companyNameSchema = z
  .string()
  .trim()
  .min(2, 'Company name must be at least 2 characters')
  .max(200, 'Company name must be less than 200 characters');

export const gstinSchema = z
  .string()
  .trim()
  .refine(
    (val) => val === '' || gstinRegex.test(val),
    'Please enter a valid 15-character GSTIN'
  )
  .optional()
  .or(z.literal(''));

export const positiveIntegerSchema = z
  .number()
  .int('Must be a whole number')
  .min(0, 'Cannot be negative');

export const positiveQuantitySchema = z
  .number()
  .int('Must be a whole number')
  .min(1, 'Quantity must be at least 1');

export const urlSchema = z
  .string()
  .trim()
  .url('Please enter a valid URL')
  .optional()
  .or(z.literal(''));

export const textareaSchema = z
  .string()
  .trim()
  .max(1000, 'Text must be less than 1000 characters')
  .optional()
  .or(z.literal(''));

export const skuSchema = z
  .string()
  .trim()
  .max(50, 'SKU must be less than 50 characters')
  .regex(/^[A-Za-z0-9\-_]*$/, 'SKU can only contain letters, numbers, hyphens, and underscores')
  .optional()
  .or(z.literal(''));

// ============================================
// FORM SCHEMAS
// ============================================

// Registration form
export const registerSchema = z
  .object({
    fullName: nameSchema,
    companyName: companyNameSchema,
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Login form
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Profile update form
export const profileUpdateSchema = z.object({
  fullName: nameSchema,
  companyName: companyNameSchema.optional(),
  phone: optionalPhoneSchema,
  address: textareaSchema,
  city: z.string().trim().max(100, 'City must be less than 100 characters').optional(),
  state: z.string().trim().max(100, 'State must be less than 100 characters').optional(),
  pincode: z
    .string()
    .trim()
    .refine((val) => val === '' || /^[1-9][0-9]{5}$/.test(val), 'Please enter a valid 6-digit pincode')
    .optional()
    .or(z.literal('')),
  gstNumber: gstinSchema,
});

// Product form
export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Product name must be at least 2 characters')
    .max(200, 'Product name must be less than 200 characters'),
  description: textareaSchema,
  categoryId: z.string().uuid('Please select a valid category').optional().or(z.literal('')),
  imageUrl: urlSchema,
  isActive: z.boolean().default(true),
});

// Product variant form
export const variantSchema = z.object({
  variantName: z
    .string()
    .trim()
    .min(1, 'Variant name is required')
    .max(100, 'Variant name must be less than 100 characters'),
  sku: skuSchema,
  stockQuantity: positiveIntegerSchema.default(0),
  lowStockThreshold: positiveIntegerSchema.default(10),
  reorderPoint: positiveIntegerSchema.default(20),
  imageUrl: urlSchema,
  isActive: z.boolean().default(true),
});

// Category form
export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Category name must be at least 2 characters')
    .max(100, 'Category name must be less than 100 characters'),
  description: textareaSchema,
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

// Worker assignment form
export const workerAssignmentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Title must be at least 2 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: textareaSchema,
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  dueDate: z.string().optional(),
});

// Order quantity validation
export const orderItemSchema = z.object({
  variantId: z.string().uuid('Invalid variant'),
  quantity: positiveQuantitySchema,
});

// ============================================
// TYPE EXPORTS
// ============================================

export type RegisterFormValues = z.infer<typeof registerSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type ProfileUpdateFormValues = z.infer<typeof profileUpdateSchema>;
export type ProductFormValues = z.infer<typeof productSchema>;
export type VariantFormValues = z.infer<typeof variantSchema>;
export type CategoryFormValues = z.infer<typeof categorySchema>;
export type WorkerAssignmentFormValues = z.infer<typeof workerAssignmentSchema>;
export type OrderItemFormValues = z.infer<typeof orderItemSchema>;

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validates a phone number and returns an error message if invalid
 */
export function validatePhone(phone: string): string | null {
  if (!phone) return 'Phone number is required';
  if (!indianPhoneRegex.test(phone)) {
    return 'Please enter a valid 10-digit Indian mobile number (starting with 6-9)';
  }
  return null;
}

/**
 * Validates an email and returns an error message if invalid
 */
export function validateEmail(email: string): string | null {
  if (!email) return 'Email is required';
  const result = emailSchema.safeParse(email);
  if (!result.success) {
    return result.error.errors[0]?.message || 'Invalid email';
  }
  return null;
}

/**
 * Validates a positive integer quantity
 */
export function validateQuantity(quantity: number): string | null {
  if (!Number.isInteger(quantity)) return 'Must be a whole number';
  if (quantity < 1) return 'Quantity must be at least 1';
  return null;
}

/**
 * Sanitizes user input by trimming and removing potentially harmful characters
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}
