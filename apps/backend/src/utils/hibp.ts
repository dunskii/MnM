// ===========================================
// Have I Been Pwned Integration
// ===========================================
// Uses k-anonymity model for secure password checking
// https://haveibeenpwned.com/API/v3#PwnedPasswords

import crypto from 'crypto';
import { HIBPCheckResult } from '../types';

// HIBP API endpoint
const HIBP_API_URL = 'https://api.pwnedpasswords.com/range/';

// Timeout for API requests (ms)
const REQUEST_TIMEOUT = 5000;

/**
 * Check if a password has been exposed in a data breach
 * Uses k-anonymity to protect the password:
 * - Only the first 5 characters of the SHA-1 hash are sent
 * - The API returns all hashes starting with those 5 chars
 * - We check locally if our full hash is in the response
 */
export async function checkHIBP(password: string): Promise<HIBPCheckResult> {
  try {
    // Calculate SHA-1 hash of the password
    const hash = crypto
      .createHash('sha1')
      .update(password)
      .digest('hex')
      .toUpperCase();

    // Get first 5 characters (prefix) and rest (suffix)
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    // Request all hashes matching this prefix
    const response = await fetchWithTimeout(
      `${HIBP_API_URL}${prefix}`,
      REQUEST_TIMEOUT
    );

    if (!response.ok) {
      // API error, fail open (allow password but log warning)
      console.warn(`HIBP API error: ${response.status}`);
      return {
        breached: false,
        count: 0,
        severity: 'none',
      };
    }

    const text = await response.text();

    // Parse response - each line is: SUFFIX:COUNT
    const lines = text.split('\n');
    for (const line of lines) {
      const [hashSuffix, countStr] = line.split(':');
      if (hashSuffix && hashSuffix.trim() === suffix) {
        const count = parseInt(countStr?.trim() || '0', 10);
        return {
          breached: true,
          count,
          severity: getSeverity(count),
        };
      }
    }

    // Password not found in breaches
    return {
      breached: false,
      count: 0,
      severity: 'none',
    };
  } catch (error) {
    // Network error or timeout, fail open
    console.warn('HIBP check failed:', error);
    return {
      breached: false,
      count: 0,
      severity: 'none',
    };
  }
}

/**
 * Determine severity based on breach count
 */
function getSeverity(
  count: number
): 'none' | 'low' | 'medium' | 'high' | 'critical' {
  if (count === 0) return 'none';
  if (count < 10) return 'low';
  if (count < 100) return 'medium';
  if (count < 1000) return 'high';
  return 'critical';
}

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(
  url: string,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Music-n-Me-Password-Check',
        'Add-Padding': 'true', // Helps with privacy
      },
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Get a human-readable message for breach severity
 */
export function getBreachMessage(result: HIBPCheckResult): string | null {
  if (!result.breached) {
    return null;
  }

  const formattedCount = result.count.toLocaleString();

  switch (result.severity) {
    case 'critical':
      return `This password has appeared in ${formattedCount} data breaches and should never be used.`;
    case 'high':
      return `This password has appeared in ${formattedCount} data breaches. Please choose a different password.`;
    case 'medium':
      return `This password has been seen in data breaches ${formattedCount} times. Consider using a stronger password.`;
    case 'low':
      return `This password may have been exposed in a data breach.`;
    default:
      return null;
  }
}
