// ===========================================
// Request Utility Tests
// ===========================================

import { Request } from 'express';
import { getClientIP, getUserAgent, isBot } from '../../src/utils/request';

// Helper to create mock request
function createMockRequest(overrides: Partial<Request> = {}): Request {
  const base = {
    headers: {},
    socket: { remoteAddress: '192.168.1.1' } as unknown,
  };

  return {
    ...base,
    ...overrides,
    headers: { ...base.headers, ...overrides.headers },
  } as Request;
}

describe('Request Utilities', () => {
  describe('getClientIP', () => {
    it('should return x-forwarded-for first IP', () => {
      const req = createMockRequest({
        headers: {
          'x-forwarded-for': '10.0.0.1, 10.0.0.2, 10.0.0.3',
        },
      });

      expect(getClientIP(req)).toBe('10.0.0.1');
    });

    it('should handle single x-forwarded-for IP', () => {
      const req = createMockRequest({
        headers: {
          'x-forwarded-for': '10.0.0.1',
        },
      });

      expect(getClientIP(req)).toBe('10.0.0.1');
    });

    it('should return x-real-ip if x-forwarded-for not present', () => {
      const req = createMockRequest({
        headers: {
          'x-real-ip': '10.0.0.5',
        },
      });

      expect(getClientIP(req)).toBe('10.0.0.5');
    });

    it('should prefer x-forwarded-for over x-real-ip', () => {
      const req = createMockRequest({
        headers: {
          'x-forwarded-for': '10.0.0.1',
          'x-real-ip': '10.0.0.5',
        },
      });

      expect(getClientIP(req)).toBe('10.0.0.1');
    });

    it('should fallback to socket remote address', () => {
      const req = {
        headers: {},
        socket: { remoteAddress: '192.168.1.100' },
      } as unknown as Request;

      expect(getClientIP(req)).toBe('192.168.1.100');
    });

    it('should return unknown if no IP available', () => {
      const req = {
        headers: {},
        socket: { remoteAddress: undefined },
      } as unknown as Request;

      expect(getClientIP(req)).toBe('unknown');
    });

    it('should trim whitespace from IPs', () => {
      const req = createMockRequest({
        headers: {
          'x-forwarded-for': '  10.0.0.1  ,  10.0.0.2  ',
        },
      });

      expect(getClientIP(req)).toBe('10.0.0.1');
    });

    it('should handle array header values', () => {
      const req = createMockRequest({
        headers: {
          'x-forwarded-for': ['10.0.0.1, 10.0.0.2'] as unknown as string,
        },
      });

      expect(getClientIP(req)).toBe('10.0.0.1');
    });
  });

  describe('getUserAgent', () => {
    it('should return user-agent header', () => {
      const req = createMockRequest({
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      });

      expect(getUserAgent(req)).toBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    });

    it('should return unknown if no user-agent', () => {
      const req = createMockRequest({ headers: {} });

      expect(getUserAgent(req)).toBe('unknown');
    });
  });

  describe('isBot', () => {
    it('should detect common bots', () => {
      const botAgents = [
        'Googlebot/2.1',
        'Mozilla/5.0 (compatible; bingbot/2.0)',
        'Mozilla/5.0 (compatible; YandexBot/3.0)',
        'python-requests/2.28.0',
        'curl/7.79.1',
        'wget/1.21',
        'PostmanRuntime/7.29.0',
      ];

      for (const agent of botAgents) {
        const req = createMockRequest({
          headers: { 'user-agent': agent },
        });
        expect(isBot(req)).toBe(true);
      }
    });

    it('should not flag regular browsers', () => {
      const browserAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
      ];

      for (const agent of browserAgents) {
        const req = createMockRequest({
          headers: { 'user-agent': agent },
        });
        expect(isBot(req)).toBe(false);
      }
    });

    it('should be case-insensitive', () => {
      const req = createMockRequest({
        headers: { 'user-agent': 'GOOGLEBOT' },
      });
      expect(isBot(req)).toBe(true);
    });
  });
});
