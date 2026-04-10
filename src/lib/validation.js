import { z } from 'zod';

// 1. Login/Register validation
export const authSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  fullName: z.string().min(2, 'Name too short').max(100).optional(),
});

// 2. Project/Task validation
export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().max(1000).optional(),
});

// 3. Time Log validation
export const timeLogSchema = z.object({
  minutes: z.number().int().min(1).max(1440), // max 24 hours per log
  description: z.string().max(500).optional(),
});

/**
 * Universal validation helper.
 * Throws an error with a human-readable message if validation fails.
 */
export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.issues[0];
    throw new Error(`${firstError.path.join('.')}: ${firstError.message}`);
  }
  return result.data;
}

/**
 * Removes all HTML tags from a string.
 * NOTE: This is a basic utility for cleaning plain-text inputs. 
 * For rendering user-provided HTML, always use DOMPurify on the frontend.
 */
export function stripBasicHTML(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .trim();
}
