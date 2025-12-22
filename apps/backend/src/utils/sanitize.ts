// ===========================================
// Input Sanitization Utilities
// ===========================================
// Sanitizes user input to prevent XSS and injection attacks

// ===========================================
// HTML SANITIZATION
// ===========================================

/**
 * HTML entities to escape
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escape HTML entities to prevent XSS
 * Use this for any user-provided text that will be displayed
 */
export function escapeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Strip all HTML tags from input
 * More aggressive than escaping - removes tags entirely
 */
export function stripHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove HTML tags
  return input
    .replace(/<[^>]*>/g, '')
    // Decode common HTML entities that might remain
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .trim();
}

// ===========================================
// TEXT SANITIZATION
// ===========================================

/**
 * Sanitize text input for database storage
 * - Trims whitespace
 * - Escapes HTML
 * - Limits length
 * - Removes control characters
 */
export function sanitizeText(
  input: string | null | undefined,
  maxLength: number = 10000
): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    // Remove control characters (except newlines and tabs)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Trim whitespace
    .trim()
    // Limit length
    .slice(0, maxLength);
}

/**
 * Sanitize notes/comments field
 * - Escapes HTML
 * - Preserves newlines
 * - Limits length
 */
export function sanitizeNotes(
  input: string | null | undefined,
  maxLength: number = 5000
): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return escapeHtml(sanitizeText(input, maxLength));
}

/**
 * Sanitize name field
 * - Only allows letters, spaces, hyphens, apostrophes
 * - Trims and normalizes whitespace
 */
export function sanitizeName(
  input: string | null | undefined,
  maxLength: number = 100
): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    // Remove anything that's not a letter, space, hyphen, or apostrophe
    .replace(/[^a-zA-ZÀ-ÿ\s\-']/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitize phone number
 * - Only allows digits, plus, spaces, hyphens, parentheses
 */
export function sanitizePhone(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/[^0-9+\s\-()]/g, '')
    .trim()
    .slice(0, 20);
}

/**
 * Sanitize email address
 * - Lowercase
 * - Trim
 * - Basic validation
 */
export function sanitizeEmail(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const email = input.toLowerCase().trim().slice(0, 254);

  // Basic email pattern check
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return '';
  }

  return email;
}

// ===========================================
// BATCH SANITIZATION
// ===========================================

/**
 * Sanitize an object's string fields
 * Useful for sanitizing form data before processing
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  fieldRules?: Partial<Record<keyof T, 'text' | 'notes' | 'name' | 'phone' | 'email' | 'html'>>
): T {
  const result = { ...obj };

  for (const [key, value] of Object.entries(result)) {
    if (typeof value !== 'string') continue;

    const rule = fieldRules?.[key as keyof T] || 'text';

    switch (rule) {
      case 'notes':
        (result as Record<string, unknown>)[key] = sanitizeNotes(value);
        break;
      case 'name':
        (result as Record<string, unknown>)[key] = sanitizeName(value);
        break;
      case 'phone':
        (result as Record<string, unknown>)[key] = sanitizePhone(value);
        break;
      case 'email':
        (result as Record<string, unknown>)[key] = sanitizeEmail(value);
        break;
      case 'html':
        (result as Record<string, unknown>)[key] = stripHtml(value);
        break;
      default:
        (result as Record<string, unknown>)[key] = sanitizeText(value);
    }
  }

  return result;
}

export default {
  escapeHtml,
  stripHtml,
  sanitizeText,
  sanitizeNotes,
  sanitizeName,
  sanitizePhone,
  sanitizeEmail,
  sanitizeObject,
};
