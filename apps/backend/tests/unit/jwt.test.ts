// ===========================================
// JWT Utility Tests
// ===========================================

import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair,
  extractTokenFromHeader,
  parseExpiryToSeconds,
  isTokenExpired,
  decodeToken,
} from '../../src/utils/jwt';
import { JWTPayload } from '../../src/types';

// Mock the config module
jest.mock('../../src/config', () => ({
  config: {
    jwt: {
      secret: 'test-secret-key-for-unit-tests-32chars',
      accessExpiresIn: '15m',
      refreshExpiresIn: '7d',
    },
  },
}));

describe('JWT Utilities', () => {
  const testPayload: JWTPayload = {
    userId: 'user-123',
    schoolId: 'school-456',
    role: 'ADMIN',
    email: 'test@example.com',
  };

  describe('parseExpiryToSeconds', () => {
    it('should parse seconds correctly', () => {
      expect(parseExpiryToSeconds('30s')).toBe(30);
      expect(parseExpiryToSeconds('60s')).toBe(60);
    });

    it('should parse minutes correctly', () => {
      expect(parseExpiryToSeconds('15m')).toBe(900);
      expect(parseExpiryToSeconds('30m')).toBe(1800);
    });

    it('should parse hours correctly', () => {
      expect(parseExpiryToSeconds('1h')).toBe(3600);
      expect(parseExpiryToSeconds('24h')).toBe(86400);
    });

    it('should parse days correctly', () => {
      expect(parseExpiryToSeconds('7d')).toBe(604800);
      expect(parseExpiryToSeconds('30d')).toBe(2592000);
    });

    it('should return default for invalid format', () => {
      expect(parseExpiryToSeconds('invalid')).toBe(900);
      expect(parseExpiryToSeconds('')).toBe(900);
      expect(parseExpiryToSeconds('15')).toBe(900);
    });
  });

  describe('signAccessToken', () => {
    it('should generate a valid JWT access token', () => {
      const token = signAccessToken(testPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include type: access in payload', () => {
      const token = signAccessToken(testPayload);
      const decoded = verifyAccessToken(token);

      expect(decoded.type).toBe('access');
    });

    it('should include all payload fields', () => {
      const token = signAccessToken(testPayload);
      const decoded = verifyAccessToken(token);

      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.schoolId).toBe(testPayload.schoolId);
      expect(decoded.role).toBe(testPayload.role);
      expect(decoded.email).toBe(testPayload.email);
    });
  });

  describe('signRefreshToken', () => {
    it('should generate a valid JWT refresh token', () => {
      const token = signRefreshToken('user-123', 'token-id-456');

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include type: refresh in payload', () => {
      const token = signRefreshToken('user-123', 'token-id-456');
      const decoded = verifyRefreshToken(token);

      expect(decoded.type).toBe('refresh');
    });

    it('should include userId and tokenId', () => {
      const token = signRefreshToken('user-123', 'token-id-456');
      const decoded = verifyRefreshToken(token);

      expect(decoded.userId).toBe('user-123');
      expect(decoded.tokenId).toBe('token-id-456');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = signAccessToken(testPayload);
      const decoded = verifyAccessToken(token);

      expect(decoded.userId).toBe(testPayload.userId);
    });

    it('should throw for invalid token', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow();
    });

    it('should throw for refresh token', () => {
      const refreshToken = signRefreshToken('user-123', 'token-id-456');

      expect(() => verifyAccessToken(refreshToken)).toThrow('Invalid token type');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = signRefreshToken('user-123', 'token-id-456');
      const decoded = verifyRefreshToken(token);

      expect(decoded.userId).toBe('user-123');
      expect(decoded.tokenId).toBe('token-id-456');
    });

    it('should throw for invalid token', () => {
      expect(() => verifyRefreshToken('invalid-token')).toThrow();
    });

    it('should throw for access token', () => {
      const accessToken = signAccessToken(testPayload);

      expect(() => verifyRefreshToken(accessToken)).toThrow('Invalid token type');
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const tokens = generateTokenPair(testPayload, 'refresh-token-id');

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.expiresIn).toBe(900); // 15 minutes
    });

    it('should generate valid tokens', () => {
      const tokens = generateTokenPair(testPayload, 'refresh-token-id');

      const accessDecoded = verifyAccessToken(tokens.accessToken);
      const refreshDecoded = verifyRefreshToken(tokens.refreshToken);

      expect(accessDecoded.userId).toBe(testPayload.userId);
      expect(refreshDecoded.tokenId).toBe('refresh-token-id');
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const token = extractTokenFromHeader('Bearer abc123');
      expect(token).toBe('abc123');
    });

    it('should handle lowercase bearer', () => {
      const token = extractTokenFromHeader('bearer abc123');
      expect(token).toBe('abc123');
    });

    it('should return null for missing header', () => {
      expect(extractTokenFromHeader(undefined)).toBeNull();
    });

    it('should return null for invalid format', () => {
      expect(extractTokenFromHeader('abc123')).toBeNull();
      expect(extractTokenFromHeader('Basic abc123')).toBeNull();
      expect(extractTokenFromHeader('Bearer')).toBeNull();
      expect(extractTokenFromHeader('Bearer abc 123')).toBeNull();
    });
  });

  describe('decodeToken', () => {
    it('should decode a valid token without verification', () => {
      const token = signAccessToken(testPayload);
      const decoded = decodeToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(testPayload.userId);
    });

    it('should return null for invalid token', () => {
      const decoded = decodeToken('not-a-valid-token');
      expect(decoded).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid non-expired token', () => {
      const token = signAccessToken(testPayload);
      expect(isTokenExpired(token)).toBe(false);
    });

    it('should return true for invalid token', () => {
      expect(isTokenExpired('invalid-token')).toBe(true);
    });
  });
});
