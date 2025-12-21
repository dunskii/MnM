import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Password
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

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

  // Google Drive
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    serviceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '',
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
} as const;

export default config;
