// ===========================================
// Request Utility Functions
// ===========================================

import { Request } from 'express';

/**
 * Extract client IP address from request
 * Handles proxies (x-forwarded-for, x-real-ip) and direct connections
 */
export function getClientIP(req: Request): string {
  // Check for forwarded headers (behind proxy/load balancer)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs: client, proxy1, proxy2
    // The first one is the original client
    const ips = (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',');
    return ips[0].trim();
  }

  // Check for real IP header (nginx)
  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return typeof realIP === 'string' ? realIP : realIP[0];
  }

  // Fallback to connection remote address
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Get user agent from request
 */
export function getUserAgent(req: Request): string {
  return req.headers['user-agent'] || 'unknown';
}

/**
 * Check if request is from a known bot/crawler
 */
export function isBot(req: Request): boolean {
  const userAgent = getUserAgent(req).toLowerCase();
  const botPatterns = [
    'bot',
    'crawler',
    'spider',
    'scraper',
    'curl',
    'wget',
    'python-requests',
    'postman',
  ];
  return botPatterns.some((pattern) => userAgent.includes(pattern));
}
