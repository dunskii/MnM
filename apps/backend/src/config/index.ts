import dotenv from 'dotenv';

dotenv.config();

// ===========================================
// Environment Validation
// ===========================================

/**
 * Get JWT secret with production validation
 * SECURITY: In production, JWT_SECRET MUST be set - no fallback allowed
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (process.env.NODE_ENV === 'production') {
    if (!secret) {
      throw new Error(
        'CRITICAL: JWT_SECRET environment variable is required in production. ' +
        'Generate a secure secret with: openssl rand -base64 64'
      );
    }
    if (secret.length < 32) {
      throw new Error(
        'CRITICAL: JWT_SECRET must be at least 32 characters in production.'
      );
    }
  }

  // Development fallback (logged warning)
  if (!secret) {
    console.warn(
      '⚠️  WARNING: Using default JWT secret. This is insecure and should only be used in development.'
    );
    return 'dev-only-jwt-secret-do-not-use-in-production';
  }

  return secret;
}

/**
 * Validate required environment variables on startup
 */
function validateRequiredEnvVars(): void {
  const required: { name: string; productionOnly: boolean }[] = [
    { name: 'DATABASE_URL', productionOnly: false },
    { name: 'JWT_SECRET', productionOnly: true },
    { name: 'ENCRYPTION_KEY', productionOnly: true },
  ];

  const missing: string[] = [];

  for (const { name, productionOnly } of required) {
    if (!process.env[name]) {
      if (productionOnly && process.env.NODE_ENV !== 'production') {
        continue; // Skip production-only vars in development
      }
      missing.push(name);
    }
  }

  if (missing.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

// Run validation on module load
validateRequiredEnvVars();

// ===========================================
// Configuration Export
// ===========================================

export const config = {
  // Server
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // JWT - SECURITY: Uses validated secret
  jwt: {
    secret: getJwtSecret(),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Password
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),

  // Email (SendGrid)
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@musicnme.com.au',
    fromName: process.env.SENDGRID_FROM_NAME || "Music 'n Me",
  },

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  },

  // Google Drive OAuth 2.0
  googleDrive: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/v1/google-drive/auth/callback',
    scopes: [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.file',
    ],
    syncIntervalMinutes: parseInt(process.env.DRIVE_SYNC_INTERVAL_MINUTES || '15', 10),
    maxFileSizeMB: parseInt(process.env.DRIVE_MAX_FILE_SIZE_MB || '25', 10),
  },

  // Redis (for Bull queues)
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  // DigitalOcean Spaces
  spaces: {
    key: process.env.DO_SPACES_KEY || '',
    secret: process.env.DO_SPACES_SECRET || '',
    bucket: process.env.DO_SPACES_BUCKET || 'music-n-me-files',
    region: process.env.DO_SPACES_REGION || 'syd1',
    endpoint: process.env.DO_SPACES_ENDPOINT || 'https://syd1.digitaloceanspaces.com',
  },

  // Frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // File Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || String(25 * 1024 * 1024), 10), // 25MB default
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
  },
} as const;

export default config;
