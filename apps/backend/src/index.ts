import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// ===========================================
// Middleware
// ===========================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===========================================
// Health Check
// ===========================================

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ===========================================
// API Routes
// ===========================================

// TODO: Add routes as they are implemented
// app.use(`${API_PREFIX}/auth`, authRoutes);
// app.use(`${API_PREFIX}/admin`, adminRoutes);
// app.use(`${API_PREFIX}/teachers`, teacherRoutes);
// app.use(`${API_PREFIX}/parents`, parentRoutes);
// app.use(`${API_PREFIX}/public`, publicRoutes);

// Placeholder route
app.get(API_PREFIX, (_req: Request, res: Response) => {
  res.json({
    message: "Welcome to Music 'n Me API",
    version: '1.0.0',
    documentation: '/api/v1/docs',
  });
});

// ===========================================
// Error Handling
// ===========================================

app.use(notFound);
app.use(errorHandler);

// ===========================================
// Start Server
// ===========================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🎵  Music 'n Me API Server                              ║
║                                                            ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(40)}║
║   Port: ${PORT.toString().padEnd(47)}║
║   API Prefix: ${API_PREFIX.padEnd(42)}║
║                                                            ║
║   Ready to accept connections!                             ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

export default app;
