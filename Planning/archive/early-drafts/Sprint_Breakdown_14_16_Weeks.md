# Music School SaaS MVP - Detailed Sprint Breakdown

## Overview

This document provides a day-by-day breakdown of the 14-16 week MVP development timeline. Each week includes specific deliverables, testing criteria, and git commits.

**Start Date:** [Week 1 Monday]  
**Target MVP Launch:** [Week 16 Friday]  
**Lead Developer:** Andrew  
**Tech Stack:** TypeScript, Node.js, React, Prisma, PostgreSQL

---

## WEEK 1: Foundation & Project Setup

**Focus:** Repository setup, project structure, database initialization  
**Deliverables:** Functional local dev environment, Prisma schema, initial commit

### Day 1 (Monday): GitHub & Project Initialization

**Morning:**
```powershell
# Create GitHub repository
# 1. Go to https://github.com/new
# 2. Create: music-school-saas (Private)
# 3. Add Node.js .gitignore
# 4. Clone locally

git clone https://github.com/[your-username]/music-school-saas.git
cd music-school-saas

# Create folder structure
$dirs = @(
    "apps\backend\src\config",
    "apps\backend\src\controllers",
    "apps\backend\src\services",
    "apps\backend\src\middleware",
    "apps\backend\src\routes",
    "apps\backend\src\types",
    "apps\backend\src\utils",
    "apps\backend\prisma",
    "apps\backend\tests",
    "apps\frontend\src\components",
    "apps\frontend\src\pages",
    ".github\workflows"
)

foreach ($dir in $dirs) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

# Create root README
# Create root .gitignore
# Create docker-compose.yml
```

**Afternoon:**
- [ ] Create comprehensive README.md
- [ ] Create root .gitignore file
- [ ] Create docker-compose.yml with PostgreSQL + pgAdmin
- [ ] Initial commit to GitHub

**Commit:** `chore: initial project structure and setup`

**Success Criteria:**
- ✅ GitHub repo created and cloned
- ✅ Folder structure matches specification
- ✅ docker-compose.yml ready to use
- ✅ First commit on GitHub

---

### Day 2 (Tuesday): Backend Initialization & Prisma Setup

**Morning:**
```powershell
# Navigate to backend
cd apps\backend

# Initialize Node.js project
npm init -y

# Install core dependencies
npm install express typescript @types/express @types/node prisma @prisma/client dotenv cors bcryptjs jsonwebtoken stripe axios uuid

# Install dev dependencies
npm install --save-dev @types/bcryptjs @types/jsonwebtoken ts-node nodemon @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint @types/uuid
```

**Tasks:**
- [ ] Initialize Prisma: `npx prisma init`
- [ ] Create `tsconfig.json`
- [ ] Create `.env` file with database URL
- [ ] Create `package.json` scripts
- [ ] Create basic folder structure

**Afternoon:**
- [ ] Test Prisma connection to local PostgreSQL
- [ ] Verify TypeScript compilation
- [ ] Set up ESLint configuration

**Commit:** `chore(backend): initialize Node.js, TypeScript, and Prisma`

**Success Criteria:**
- ✅ npm dependencies installed
- ✅ TypeScript configured
- ✅ Prisma initialized
- ✅ Can compile TypeScript: `npm run build`
- ✅ `.env` file created (not committed)

---

### Day 3 (Wednesday): Database Schema - Part 1

**Focus:** Create comprehensive Prisma schema (first half)

**Tasks:**
- [ ] Copy enhanced schema to `apps/backend/prisma/schema.prisma`
- [ ] Split into logical sections with comments
- [ ] Add indexes for performance
- [ ] Validate schema syntax: `npx prisma format`

**Schema Sections to Create:**
1. Core (School, Location, Room)
2. Users (User, Role)
3. Family (FamilyGroup)
4. Students (Student)
5. Lessons (Lesson, LessonType, Recurrence)

**Afternoon:**
- [ ] Review schema for inconsistencies
- [ ] Add comments and documentation
- [ ] Test relationships

**Commit:** `chore(database): create core Prisma schema - part 1`

**Success Criteria:**
- ✅ Schema compiles without errors
- ✅ All indexes defined
- ✅ Comments explaining complex relationships

---

### Day 4 (Thursday): Database Schema - Part 2 & Migrations

**Focus:** Complete schema and create initial migration

**Tasks:**
- [ ] Complete remaining schema sections:
  - Enrollments (Enrollment, EnrollmentStatus, Attendance)
  - Payments (Payment, Payout, PaymentStatus)
  - Resources (Resource, ResourceAccess)
  - Notifications (NotificationPreference)
  - Hybrid Config (HybridLessonConfig)

**Morning:**
- [ ] Add all remaining models to schema
- [ ] Validate schema with `npx prisma format`

**Afternoon:**
```powershell
# Start PostgreSQL
docker-compose up -d

# Create first migration
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Open Prisma Studio to verify
npx prisma studio
```

**Tasks:**
- [ ] Verify migration applies cleanly
- [ ] Review database structure in Prisma Studio
- [ ] Create backup of clean schema state

**Commit:** `chore(database): complete Prisma schema and create initial migration`

**Success Criteria:**
- ✅ Full schema in place
- ✅ Migration created successfully
- ✅ PostgreSQL tables created
- ✅ Prisma Studio shows all tables correctly

---

### Day 5 (Friday): Frontend Setup & First Commit

**Morning:**
```powershell
# Navigate to frontend directory
cd ..\..\apps\frontend

# Create Vite React project
npm create vite@latest . -- --template react-ts

# Install Material-UI and dependencies
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material
npm install react-router-dom axios @tanstack/react-query
npm install @stripe/react-stripe-js @stripe/js

# Create .env file
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

**Afternoon:**
- [ ] Verify frontend builds: `npm run build`
- [ ] Verify dev server starts: `npm run dev`
- [ ] Update root README with setup instructions

**Final Tasks:**
- [ ] Create comprehensive DEVELOPMENT.md
- [ ] Add both apps to git
- [ ] Create initial GitHub commit

```powershell
# From project root
git add .
git commit -m "chore: initial backend and frontend setup"
git push origin main
```

**Commit:** `chore: complete project initialization with backend and frontend`

**Success Criteria:**
- ✅ Both backend and frontend set up
- ✅ Dependencies installed
- ✅ Backend runs on port 5000
- ✅ Frontend runs on port 5173
- ✅ All pushed to GitHub
- ✅ Development guide written

---

## WEEK 2: Project Infrastructure & Configuration

**Focus:** Core backend setup, middleware, configuration, basic API structure  
**Deliverables:** Express app with middleware, authentication ready, API structure

### Day 1 (Monday): Express App & Middleware Setup

**Tasks:**
```typescript
// apps/backend/src/app.ts
import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Basic route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Error handling
app.use(errorHandler);

export default app;
```

**Create:**
- [ ] `src/app.ts` - Express application
- [ ] `src/middleware/errorHandler.ts` - Global error handling
- [ ] `src/middleware/requestLogger.ts` - Request logging
- [ ] `src/config/database.ts` - Prisma client initialization
- [ ] `src/utils/logger.ts` - Logging utility

**Afternoon:**
```powershell
# Test Express app
npm run dev

# Verify health endpoint
Invoke-RestMethod -Uri "http://localhost:5000/health" -Method Get
```

**Commit:** `feat(backend): initialize Express app with middleware`

**Success Criteria:**
- ✅ Express server starts on port 5000
- ✅ Health endpoint responds
- ✅ CORS enabled
- ✅ Error handling middleware in place

---

### Day 2 (Tuesday): Environment Configuration & Constants

**Tasks:**
- [ ] Create `src/config/environment.ts` - Load and validate env vars
- [ ] Create `src/types/index.ts` - Common TypeScript types
- [ ] Create `src/utils/validators.ts` - Input validation helpers
- [ ] Create `src/utils/errorHandler.ts` - Error utilities
- [ ] Update `.env.example` with all variables needed

```typescript
// src/config/environment.ts
import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || '5000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  stripeKey: process.env.STRIPE_SECRET_KEY,
  databaseUrl: process.env.DATABASE_URL,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
};

// Validate required env vars
const requiredVars = ['JWT_SECRET', 'DATABASE_URL'];
requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});
```

**Commit:** `feat(backend): add environment configuration and constants`

**Success Criteria:**
- ✅ Environment variables loaded and validated
- ✅ All config centralized
- ✅ `.env.example` updated

---

### Day 3 (Wednesday): Database & Type Utilities

**Tasks:**
- [ ] Create `src/config/database.ts` - Prisma client setup
- [ ] Create `src/types/custom.d.ts` - Express request augmentation
- [ ] Create utility functions:
  - [ ] `src/utils/response.ts` - Standardized response format
  - [ ] `src/utils/errors.ts` - Custom error classes
  - [ ] `src/utils/validators.ts` - Input validation

```typescript
// src/config/database.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Handle shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;

// src/types/custom.d.ts
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT';
        schoolId: string;
      };
      startTime: number;
    }
  }
}
```

**Commit:** `feat(backend): add database utilities and type definitions`

**Success Criteria:**
- ✅ Prisma client ready
- ✅ Express request augmented for user context
- ✅ Response utilities standardized

---

### Day 4 (Thursday): Basic API Structure & Routes

**Tasks:**
- [ ] Create route structure:
  - [ ] `src/routes/index.ts` - Main router
  - [ ] `src/routes/health.routes.ts` - Health check
  - [ ] `src/routes/auth.routes.ts` - Placeholder for auth (Week 3)
  - [ ] `src/routes/lessons.routes.ts` - Placeholder

```typescript
// src/routes/index.ts
import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
// More routes...

export default router;

// Update src/app.ts
import routes from './routes';
app.use('/api', routes);
```

**Afternoon:**
- [ ] Test all routes with Postman/curl
- [ ] Verify response format consistency

**Commit:** `feat(backend): add basic route structure`

**Success Criteria:**
- ✅ Routes organized in modules
- ✅ Main router mounted at `/api`
- ✅ Health check working at `/api/health`

---

### Day 5 (Friday): Testing Setup & First Tests

**Tasks:**
```powershell
# Install testing framework
npm install --save-dev jest @types/jest ts-jest

# Create jest.config.js
```

**Create:**
- [ ] `jest.config.js` - Jest configuration
- [ ] `tests/setup.ts` - Test setup
- [ ] `tests/app.test.ts` - Basic Express tests

```typescript
// tests/app.test.ts
import request from 'supertest';
import app from '../src/app';

describe('Express App', () => {
  it('should return health status', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
  });
});
```

**Afternoon:**
```powershell
# Run tests
npm test

# Generate coverage report
npm test -- --coverage
```

**Update package.json:**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

**Commit:** `chore(backend): add testing framework and initial tests`

**Success Criteria:**
- ✅ Jest configured
- ✅ First test passes
- ✅ `npm test` works

---

**End of Week 2 Status:**
- ✅ Express app with middleware
- ✅ Configuration and environment setup
- ✅ Route structure in place
- ✅ Testing framework ready
- ✅ 5 commits to GitHub

---

## WEEK 3: Authentication & User Management

**Focus:** JWT auth, user registration/login, password hashing, role-based middleware  
**Deliverables:** Complete auth system, user endpoints, protected routes

### Day 1 (Monday): Authentication Service & JWT

**Tasks:**
```typescript
// src/services/auth.service.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/environment';
import prisma from '../config/database';

export class AuthService {
  
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateToken(userId: string, role: string): string {
    return jwt.sign(
      { userId, role },
      env.jwtSecret,
      { expiresIn: env.jwtExpire }
    );
  }

  verifyToken(token: string): { userId: string; role: string } {
    return jwt.verify(token, env.jwtSecret) as any;
  }

  async registerUser(email: string, password: string, firstName: string, 
                     lastName: string, schoolId: string, role: string) {
    const hashedPassword = await this.hashPassword(password);
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        schoolId
      }
    });

    return user;
  }

  async loginUser(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('User not found');

    const validPassword = await this.comparePassword(password, user.password);
    if (!validPassword) throw new Error('Invalid password');

    const token = this.generateToken(user.id, user.role);
    return { user, token };
  }
}

export const authService = new AuthService();
```

**Create:**
- [ ] `src/services/auth.service.ts` - Authentication logic
- [ ] `src/services/user.service.ts` - User management

**Commit:** `feat(auth): create authentication service with JWT`

**Success Criteria:**
- ✅ Password hashing working
- ✅ JWT generation and verification
- ✅ Auth service tested

---

### Day 2 (Tuesday): Authentication Middleware & Routes

**Tasks:**
```typescript
// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = authService.verifyToken(token);
    req.user = {
      id: decoded.userId,
      role: decoded.role as any,
      schoolId: '', // Will be set by user service
      email: ''
    };
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
```

**Create:**
```typescript
// src/routes/auth.routes.ts
import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, schoolId, role } = req.body;
    
    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = await authService.registerUser(
      email, password, firstName, lastName, schoolId, role || 'STUDENT'
    );
    
    const token = authService.generateToken(user.id, user.role);
    
    res.status(201).json({ 
      user: { id: user.id, email: user.email, firstName, lastName, role: user.role },
      token 
    });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const { user, token } = await authService.loginUser(email, password);
    
    res.json({ 
      user: { id: user.id, email: user.email, firstName: user.firstName, role: user.role },
      token 
    });
  } catch (error) {
    res.status(401).json({ error: (error as Error).message });
  }
});

export default router;
```

**Commit:** `feat(auth): add authentication middleware and routes`

**Success Criteria:**
- ✅ POST /api/auth/register works
- ✅ POST /api/auth/login works
- ✅ JWT tokens returned correctly
- ✅ Tokens can be verified

---

### Day 3 (Wednesday): User Management Routes

**Tasks:**
```typescript
// src/routes/users.routes.ts
import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import prisma from '../config/database';

const router = Router();

// Get current user profile
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user profile
router.patch('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, phone } = req.body;
    
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { firstName, lastName, phone }
    });
    
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update user' });
  }
});

// List all users (admin only)
router.get('/', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { schoolId: req.user!.schoolId }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;
```

**Update `src/routes/index.ts` to include users:**
```typescript
import usersRoutes from './users.routes';
router.use('/users', usersRoutes);
```

**Commit:** `feat(auth): add user management routes`

**Success Criteria:**
- ✅ GET /api/users/me returns current user
- ✅ PATCH /api/users/me updates profile
- ✅ GET /api/users returns all users (admin only)
- ✅ Role-based access control working

---

### Day 4 (Thursday): Email Verification (Basic)

**Tasks:**
```typescript
// src/services/email.service.ts (Phase 1 simplified)
export class EmailService {
  // Phase 1: Just log, don't actually send
  async sendVerificationEmail(email: string, code: string): Promise<void> {
    console.log(`[EMAIL] Verification code for ${email}: ${code}`);
    // Phase 2: Integrate SendGrid
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    console.log(`[EMAIL] Password reset token for ${email}: ${token}`);
  }
}
```

**Create:**
- [ ] `src/services/email.service.ts` - Email placeholder (logging only)
- [ ] Update registration to log verification code

**Note:** SendGrid integration happens in Week 9 with notifications

**Commit:** `chore(auth): add email service placeholder for phase 2`

**Success Criteria:**
- ✅ Email service structure in place
- ✅ Ready for SendGrid integration in Phase 2

---

### Day 5 (Friday): Authentication Testing & Security

**Tasks:**
```powershell
# Update package.json with test database URL
# Create separate test environment
```

**Create tests:**
```typescript
// tests/auth.test.ts
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/database';

describe('Authentication', () => {
  
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        schoolId: 'school1',
        role: 'STUDENT'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('token');
  });

  it('should login user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'TestPassword123!'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });

  it('should reject invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'WrongPassword'
      });

    expect(response.status).toBe(401);
  });
});
```

**Security checklist:**
- [ ] Passwords hashed with bcrypt (salt rounds: 12)
- [ ] No passwords logged or exposed
- [ ] JWT secret stored in .env
- [ ] CORS configured
- [ ] SQL injection prevented (using Prisma)
- [ ] Input validation on registration

**Commit:** `test(auth): add comprehensive authentication tests`

**Success Criteria:**
- ✅ All auth tests pass
- ✅ Password security verified
- ✅ Token expiration working

---

**End of Week 3 Status:**
- ✅ Complete JWT authentication system
- ✅ User registration and login
- ✅ Role-based access control
- ✅ Comprehensive tests
- ✅ 5+ commits

---

## WEEK 4: User Management & Roles

**Focus:** Admin user creation, role management, permissions, school setup  
**Deliverables:** Complete user management system, admin panel foundation

### Day 1 (Monday): School & Admin Setup

**Tasks:**
```typescript
// src/services/school.service.ts
export class SchoolService {
  
  async createSchool(data: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  }) {
    return prisma.school.create({ data });
  }

  async getSchool(schoolId: string) {
    return prisma.school.findUnique({ where: { id: schoolId } });
  }

  async updateSchool(schoolId: string, data: any) {
    return prisma.school.update({
      where: { id: schoolId },
      data
    });
  }

  async createAdminUser(schoolId: string, adminData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const hashedPassword = await this.authService.hashPassword(adminData.password);
    
    return prisma.user.create({
      data: {
        ...adminData,
        password: hashedPassword,
        role: 'ADMIN',
        schoolId
      }
    });
  }
}

export const schoolService = new SchoolService();
```

**Create routes:**
- [ ] `src/routes/schools.routes.ts`
- [ ] POST /api/schools (create school)
- [ ] GET /api/schools/:id
- [ ] PATCH /api/schools/:id

**Commit:** `feat(schools): add school management and setup`

**Success Criteria:**
- ✅ Can create school
- ✅ Can update school info
- ✅ Admin user creation working

---

### Day 2 (Tuesday): Admin User Management

**Tasks:**
```typescript
// src/routes/admin/users.routes.ts
import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../../middleware/auth.middleware';
import prisma from '../../config/database';
import { authService } from '../../services/auth.service';

const router = Router();

// Create new user (admin only)
router.post('/', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    
    const hashedPassword = await authService.hashPassword(password);
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        schoolId: req.user!.schoolId
      }
    });

    res.status(201).json({ 
      user: { id: user.id, email, firstName, lastName, role }
    });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// List all users in school (admin only)
router.get('/', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { schoolId: req.user!.schoolId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      }
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete user' });
  }
});

export default router;
```

**Create admin routes namespace:**
- [ ] `src/routes/admin/index.ts`
- [ ] `src/routes/admin/users.routes.ts`
- [ ] Update main routes to include admin

**Commit:** `feat(admin): add user management endpoints`

**Success Criteria:**
- ✅ Admin can create users
- ✅ Admin can list all users
- ✅ Admin can delete users
- ✅ Role enforcement working

---

### Day 3 (Wednesday): Teacher Management

**Tasks:**
```typescript
// src/routes/admin/teachers.routes.ts
import { Router } from 'express';
import { authenticateToken, requireRole } from '../../middleware/auth.middleware';
import prisma from '../../config/database';

const router = Router();

// Create teacher account
router.post('/', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { email, password, firstName, lastName, specialties, bio } = req.body;
    
    // Create user with TEACHER role
    const teacher = await prisma.user.create({
      data: {
        email,
        password: await hashPassword(password),
        firstName,
        lastName,
        role: 'TEACHER',
        schoolId: req.user!.schoolId,
        specialties,
        bio
      }
    });

    res.status(201).json(teacher);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Set teacher availability
router.post('/:teacherId/availability', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { dayOfWeek, startTime, endTime } = req.body;
    
    const availability = await prisma.teacherAvailability.create({
      data: {
        teacherId: req.params.teacherId,
        dayOfWeek,
        startTime,
        endTime,
        recurring: true
      }
    });

    res.json(availability);
  } catch (error) {
    res.status(400).json({ error: 'Failed to set availability' });
  }
});

// Get teacher's availability
router.get('/:teacherId/availability', authenticateToken, async (req, res) => {
  try {
    const availability = await prisma.teacherAvailability.findMany({
      where: { teacherId: req.params.teacherId }
    });

    res.json(availability);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

export default router;
```

**Create:**
- [ ] `src/routes/admin/teachers.routes.ts`
- [ ] TeacherAvailability management

**Commit:** `feat(teachers): add teacher management and availability`

**Success Criteria:**
- ✅ Can create teacher accounts
- ✅ Can set teacher availability
- ✅ Can retrieve availability schedules

---

### Day 4 (Thursday): Student Management

**Tasks:**
```typescript
// src/routes/admin/students.routes.ts
import { Router } from 'express';
import { authenticateToken, requireRole } from '../../middleware/auth.middleware';
import prisma from '../../config/database';

const router = Router();

// Create student and family
router.post('/', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { firstName, lastName, instrument, level, parentEmail, parentName } = req.body;
    
    // Create user
    const studentUser = await prisma.user.create({
      data: {
        email: `student-${Date.now()}@internal.school`,
        password: 'temp-password', // Not used
        firstName,
        lastName,
        role: 'STUDENT',
        schoolId: req.user!.schoolId
      }
    });

    // Create student profile
    const student = await prisma.student.create({
      data: {
        userId: studentUser.id,
        schoolId: req.user!.schoolId,
        instrument,
        level,
        parentName,
        parentEmail
      }
    });

    res.status(201).json(student);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// List all students
router.get('/', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      where: { schoolId: req.user!.schoolId },
      include: { user: true }
    });

    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get student details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        enrollments: { include: { lesson: true } },
        attendance: true
      }
    });

    res.json(student);
  } catch (error) {
    res.status(404).json({ error: 'Student not found' });
  }
});

export default router;
```

**Commit:** `feat(students): add student management`

**Success Criteria:**
- ✅ Can create student profiles
- ✅ Can retrieve student list
- ✅ Student details available

---

### Day 5 (Friday): Full User Management Testing

**Tasks:**
- [ ] Create comprehensive test suite for all user endpoints
- [ ] Test admin permissions
- [ ] Test role-based access

```typescript
// tests/admin.test.ts
describe('Admin User Management', () => {
  it('should allow admin to create teacher', async () => {
    // Test implementation
  });

  it('should deny non-admin from creating teacher', async () => {
    // Test implementation
  });

  it('should allow setting teacher availability', async () => {
    // Test implementation
  });
});
```

**Commit:** `test(admin): add user management tests`

**Success Criteria:**
- ✅ All user management tests pass
- ✅ Admin-only endpoints protected
- ✅ Role enforcement verified

---

**End of Week 4 Status:**
- ✅ Complete user management system
- ✅ Admin interface for user creation/management
- ✅ Teacher availability system
- ✅ Student profiles
- ✅ Role-based access control
- ✅ Comprehensive testing

---

## WEEK 5-6: Core Lessons, Family Accounts & Enrollment

**Focus:** Lesson types, multi-location, family account system, student enrollment  
**Deliverables:** Complete lesson management, family accounts working, admin enrollment

### Week 5: Day 1 (Monday): Locations & Rooms + Lesson Configuration Framework

**Morning - Locations & Rooms:**
```typescript
// src/routes/admin/locations.routes.ts
import { Router } from 'express';
import { authenticateToken, requireRole } from '../../middleware/auth.middleware';
import prisma from '../../config/database';

const router = Router();

// Create location
router.post('/', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, address, city, phone } = req.body;
    
    const location = await prisma.location.create({
      data: {
        name,
        address,
        city,
        phone,
        schoolId: req.user!.schoolId
      }
    });

    res.status(201).json(location);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Create room
router.post('/:locationId/rooms', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, capacity } = req.body;
    
    const room = await prisma.room.create({
      data: {
        name,
        capacity,
        locationId: req.params.locationId
      }
    });

    res.status(201).json(room);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create room' });
  }
});

// Get locations with rooms
router.get('/', authenticateToken, async (req, res) => {
  try {
    const locations = await prisma.location.findMany({
      where: { schoolId: req.user!.schoolId },
      include: { rooms: true }
    });

    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

export default router;
```

**Afternoon - Lesson Configuration Service (Opus1-Inspired):**
```typescript
// src/services/lessonConfig.service.ts
export class LessonConfigService {
  
  // Store lesson-specific configuration (templates, colors, settings)
  async createLessonConfig(lessonId: string, config: {
    calendarColor: string;  // #FF0000, #6B46C1, etc.
    confirmationEmailTemplate: string;
    reminderEmailTemplate: string;
    cancellationEmailTemplate: string;
    reminderSMSTemplate?: string;
    maxStudents: number;
    tags: string[];  // ['30mins', 'piano', 'beginner']
  }) {
    return prisma.lessonConfig.create({
      data: {
        lessonId,
        ...config
      }
    });
  }

  async getLessonConfig(lessonId: string) {
    return prisma.lessonConfig.findUnique({
      where: { lessonId }
    });
  }

  async updateLessonConfig(lessonId: string, updates: any) {
    return prisma.lessonConfig.update({
      where: { lessonId },
      data: updates
    });
  }
}

export const lessonConfigService = new LessonConfigService();
```

**Add to Prisma Schema:**
```prisma
model LessonConfig {
  id                              String   @id @default(cuid())
  lessonId                        String   @unique
  lesson                          Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  
  // Appearance (from Opus1)
  calendarColor                   String   @default("#3B82F6")  // Blue for individual
  
  // Email Templates (from Opus1)
  confirmationEmailTemplate       String   @db.Text
  reminderEmailTemplate           String   @db.Text
  cancellationEmailTemplate       String   @db.Text
  
  // SMS Templates (from Opus1)
  reminderSMSTemplate             String?  @db.Text
  bookingOpenSMSTemplate          String?  @db.Text
  
  // Tags for categorization (from Opus1)
  tags                            String[] // ['30mins', 'piano', 'beginner']
  maxStudents                     Int?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([lessonId])
}
```

**Commit:** `feat(locations,config): add location/room management + lesson config foundation`

**Success Criteria:**
- ✅ Can create locations and rooms
- ✅ Lesson config structure ready for templates
- ✅ Calendar color field prepared
- ✅ Tag system foundation in place

### Week 5: Day 2-3: Family Accounts System

**Morning Day 2:**
```typescript
// src/services/family.service.ts
export class FamilyService {
  
  async createFamilyForParent(parentId: string, familyData: any) {
    // Create family group with parent as admin
    const family = await prisma.familyGroup.create({
      data: {
        name: familyData.name,
        adminId: parentId,
        schoolId: familyData.schoolId,
        billingEmail: familyData.billingEmail
      }
    });

    // Link parent to family
    await prisma.user.update({
      where: { id: parentId },
      data: { familyGroupId: family.id }
    });

    return family;
  }

  async addStudentToFamily(familyId: string, studentData: any) {
    // Create student user
    const studentUser = await prisma.user.create({
      data: {
        email: `student-${Date.now()}@internal.school`,
        password: 'temp', 
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        role: 'STUDENT',
        schoolId: studentData.schoolId,
        familyGroupId: familyId
      }
    });

    // Create student profile
    const student = await prisma.student.create({
      data: {
        userId: studentUser.id,
        schoolId: studentData.schoolId,
        instrument: studentData.instrument,
        level: studentData.level
      }
    });

    return student;
  }

  async getFamilyWithStudents(familyId: string) {
    return prisma.familyGroup.findUnique({
      where: { id: familyId },
      include: {
        admin: true,
        members: {
          include: { studentProfile: true }
        }
      }
    });
  }

  async getFamilySchedule(familyId: string) {
    // Get all students in family
    const family = await this.getFamilyWithStudents(familyId);
    
    // Get all enrollments for all students
    const students = family?.members.filter(m => m.role === 'STUDENT') || [];
    
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: { in: students.map(s => s.id) }
      },
      include: { lesson: true, student: true }
    });

    return enrollments;
  }
}

export const familyService = new FamilyService();
```

**Afternoon Day 2 + Day 3:**
```typescript
// src/routes/families.routes.ts
import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import { familyService } from '../../services/family.service';

const router = Router();

// Create family (parent)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user!.role !== 'PARENT') {
      return res.status(403).json({ error: 'Only parents can create families' });
    }

    const family = await familyService.createFamilyForParent(
      req.user!.id,
      req.body
    );

    res.status(201).json(family);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Get my family
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });

    if (!user?.familyGroupId) {
      return res.json({ family: null, message: 'No family account' });
    }

    const family = await familyService.getFamilyWithStudents(user.familyGroupId);
    res.json(family);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch family' });
  }
});

// Add student to my family
router.post('/students', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });

    if (!user?.familyGroupId) {
      return res.status(400).json({ error: 'No family account' });
    }

    const student = await familyService.addStudentToFamily(
      user.familyGroupId,
      { ...req.body, schoolId: req.user!.schoolId }
    );

    res.status(201).json(student);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Get family schedule
router.get('/schedule', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });

    if (!user?.familyGroupId) {
      return res.json({ lessons: [] });
    }

    const schedule = await familyService.getFamilySchedule(user.familyGroupId);
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

export default router;
```

**Commit Day 2:** `feat(families): implement family account creation and management`

**Commit Day 3:** `feat(families): add family routes and student management`

**Success Criteria:**
- ✅ Parents can create family accounts
- ✅ Can add students to family
- ✅ Can retrieve family with all students
- ✅ Can get combined family schedule

### Week 5: Day 4-5 + Week 6: Day 1-2: Lesson Management

**Day 4:**
```typescript
// src/services/lesson.service.ts
export class LessonService {
  
  async createLesson(lessonData: any) {
    return prisma.lesson.create({
      data: {
        title: lessonData.title,
        type: lessonData.type,  // INDIVIDUAL, GROUP, HYBRID
        description: lessonData.description,
        schoolId: lessonData.schoolId,
        instructorId: lessonData.instructorId,
        locationId: lessonData.locationId,
        roomId: lessonData.roomId,
        startTime: new Date(lessonData.startTime),
        endTime: new Date(lessonData.endTime),
        duration: lessonData.duration,
        recurrence: lessonData.recurrence || 'ONCE',
        recurrenceEndDate: lessonData.recurrenceEndDate,
        maxStudents: lessonData.maxStudents,
        isHybrid: lessonData.isHybrid || false,
        pricePerStudent: lessonData.pricePerStudent
      }
    });
  }

  async updateLesson(lessonId: string, updates: any) {
    return prisma.lesson.update({
      where: { id: lessonId },
      data: updates
    });
  }

  async getLessonWithDetails(lessonId: string) {
    return prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        instructor: true,
        location: true,
        room: true,
        enrollments: {
          include: { student: { include: { user: true } } }
        },
        hybridConfig: true
      }
    });
  }

  async getSchoolLessons(schoolId: string, filters: any = {}) {
    return prisma.lesson.findMany({
      where: {
        schoolId,
        status: { not: 'CANCELLED' },
        ...filters
      },
      include: {
        instructor: true,
        location: true,
        enrollments: true
      },
      orderBy: { startTime: 'asc' }
    });
  }
}

export const lessonService = new LessonService();
```

**Day 5:**
```typescript
// src/routes/admin/lessons.routes.ts
import { Router } from 'express';
import { authenticateToken, requireRole } from '../../middleware/auth.middleware';
import { lessonService } from '../../services/lesson.service';

const router = Router();

// Create lesson
router.post('/', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const lesson = await lessonService.createLesson({
      ...req.body,
      schoolId: req.user!.schoolId
    });

    res.status(201).json(lesson);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Get all lessons
router.get('/', authenticateToken, async (req, res) => {
  try {
    const lessons = await lessonService.getSchoolLessons(req.user!.schoolId);
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

// Get lesson details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const lesson = await lessonService.getLessonWithDetails(req.params.id);
    res.json(lesson);
  } catch (error) {
    res.status(404).json({ error: 'Lesson not found' });
  }
});

// Update lesson
router.patch('/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const lesson = await lessonService.updateLesson(req.params.id, req.body);
    res.json(lesson);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update lesson' });
  }
});

export default router;
```

**Week 6: Day 1-2:**
```typescript
// src/routes/admin/enrollment.routes.ts
import { Router } from 'express';
import { authenticateToken, requireRole } from '../../middleware/auth.middleware';
import prisma from '../../config/database';

const router = Router();

// Assign students to group lesson (bulk)
router.post('/bulk-assign', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { lessonId, studentIds } = req.body;

    // Validate lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId }
    });

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Check group size limit
    if (lesson.maxStudents) {
      const currentEnrollments = await prisma.enrollment.count({
        where: { lessonId, status: 'ACTIVE' }
      });

      if (currentEnrollments + studentIds.length > lesson.maxStudents) {
        return res.status(400).json({ 
          error: `Exceeds max students (${lesson.maxStudents})`
        });
      }
    }

    // Create enrollments
    const enrollments = await Promise.all(
      studentIds.map(studentId =>
        prisma.enrollment.create({
          data: {
            lessonId,
            studentId,
            schoolId: req.user!.schoolId,
            status: 'ACTIVE'
          }
        }).catch(() => null) // Handle duplicates
      )
    );

    res.status(201).json(enrollments.filter(Boolean));
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Remove student from lesson
router.delete('/:enrollmentId', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    await prisma.enrollment.update({
      where: { id: req.params.enrollmentId },
      data: { status: 'UNENROLLED', unenrolledAt: new Date() }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Failed to unenroll student' });
  }
});

// Get lesson enrollments
router.get('/lesson/:lessonId', authenticateToken, async (req, res) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { lessonId: req.params.lessonId, status: 'ACTIVE' },
      include: {
        student: { include: { user: true } }
      }
    });

    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

export default router;
```

**Commits:**
- `feat(lessons): implement lesson management service and endpoints`
- `feat(enrollment): add bulk enrollment and admin assignment`

**Success Criteria (End of Week 5-6):**
- ✅ Locations and rooms manageable
- ✅ Family accounts fully functional
- ✅ Parents can create families and add children
- ✅ Admins can create lessons (individual, group, hybrid)
- ✅ Admins can assign students to lessons (bulk)
- ✅ Can retrieve lessons with all details
- ✅ Family schedule retrieval working

---

## WEEK 7-8: Scheduling & Calendar with Drag-and-Drop

**Focus:** Calendar UI, drag-and-drop rescheduling, conflict detection  
**Deliverables:** Fully functional calendar interface with rescheduling

### Week 7: Backend Scheduling Foundation

**Day 1-2: Conflict Detection Service**
```typescript
// src/services/scheduling.service.ts
export class SchedulingService {
  
  async checkTeacherConflict(
    teacherId: string,
    startTime: Date,
    endTime: Date,
    excludeLessonId?: string
  ) {
    const conflicts = await prisma.lesson.findMany({
      where: {
        instructorId: teacherId,
        id: { not: excludeLessonId },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
        status: { not: 'CANCELLED' }
      }
    });

    return conflicts;
  }

  async checkRoomConflict(
    roomId: string | null,
    startTime: Date,
    endTime: Date,
    excludeLessonId?: string
  ) {
    if (!roomId) return [];

    const conflicts = await prisma.lesson.findMany({
      where: {
        roomId,
        id: { not: excludeLessonId },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
        status: { not: 'CANCELLED' }
      }
    });

    return conflicts;
  }

  async validateReschedule(
    lessonId: string,
    newStartTime: Date,
    newEndTime: Date
  ) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId }
    });

    if (!lesson) throw new Error('Lesson not found');

    // Check teacher availability
    const teacherConflicts = await this.checkTeacherConflict(
      lesson.instructorId,
      newStartTime,
      newEndTime,
      lessonId
    );

    if (teacherConflicts.length > 0) {
      return {
        valid: false,
        error: 'Teacher has conflicting lesson',
        conflicts: teacherConflicts
      };
    }

    // Check room availability
    if (lesson.roomId) {
      const roomConflicts = await this.checkRoomConflict(
        lesson.roomId,
        newStartTime,
        newEndTime,
        lessonId
      );

      if (roomConflicts.length > 0) {
        return {
          valid: false,
          error: 'Room is occupied',
          conflicts: roomConflicts
        };
      }
    }

    return { valid: true };
  }
}

export const schedulingService = new SchedulingService();
```

**Day 2-3: Rescheduling Endpoint**
```typescript
// src/routes/admin/scheduling.routes.ts
import { Router } from 'express';
import { authenticateToken, requireRole } from '../../middleware/auth.middleware';
import { schedulingService } from '../../services/scheduling.service';
import prisma from '../../config/database';

const router = Router();

// Reschedule single lesson
router.post('/reschedule', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { lessonId, newStartTime, newEndTime } = req.body;

    // Validate reschedule
    const validation = await schedulingService.validateReschedule(
      lessonId,
      new Date(newStartTime),
      new Date(newEndTime)
    );

    if (!validation.valid) {
      return res.status(409).json(validation);
    }

    // Create change history entry
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId }
    });

    await prisma.lessonChangeHistory.create({
      data: {
        lessonId,
        changedBy: req.user!.id,
        previousStartTime: lesson!.startTime,
        previousEndTime: lesson!.endTime,
        newStartTime: new Date(newStartTime),
        newEndTime: new Date(newEndTime),
        reason: req.body.reason
      }
    });

    // Update lesson
    const updated = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        startTime: new Date(newStartTime),
        endTime: new Date(newEndTime)
      },
      include: {
        enrollments: { include: { student: { include: { user: true } } } }
      }
    });

    // TODO: Send notifications (Week 9)
    // notificationService.send({
    //   type: 'LESSON_RESCHEDULED',
    //   affectedStudents: updated.enrollments.map(e => e.student.userId)
    // });

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Check conflicts before drag
router.post('/check-conflict', authenticateToken, async (req, res) => {
  try {
    const { lessonId, startTime, endTime } = req.body;

    const validation = await schedulingService.validateReschedule(
      lessonId,
      new Date(startTime),
      new Date(endTime)
    );

    res.json(validation);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Get lesson change history
router.get('/:lessonId/history', authenticateToken, async (req, res) => {
  try {
    const history = await prisma.lessonChangeHistory.findMany({
      where: { lessonId: req.params.lessonId },
      include: { changedBy: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' }
    });

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Undo reschedule
router.post('/:lessonId/undo', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const history = await prisma.lessonChangeHistory.findFirst({
      where: { lessonId: req.params.lessonId },
      orderBy: { createdAt: 'desc' }
    });

    if (!history) {
      return res.status(404).json({ error: 'No recent changes to undo' });
    }

    const updated = await prisma.lesson.update({
      where: { id: req.params.lessonId },
      data: {
        startTime: history.previousStartTime,
        endTime: history.previousEndTime
      }
    });

    // Mark as reverted
    await prisma.lessonChangeHistory.update({
      where: { id: history.id },
      data: { revertedAt: new Date(), status: 'reverted' }
    });

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: 'Failed to undo' });
  }
});

export default router;
```

**Day 4-5: Calendar API Endpoints**
```typescript
// src/routes/calendar.routes.ts
import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import prisma from '../../config/database';

const router = Router();

// Get calendar events for date range
router.get('/events', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, locationId, teacherId, lessonType } = req.query;

    const where: any = {
      schoolId: req.user!.schoolId,
      startTime: {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      },
      status: { not: 'CANCELLED' }
    };

    if (locationId) where.locationId = locationId;
    if (teacherId) where.instructorId = teacherId;
    if (lessonType) where.type = lessonType;

    const lessons = await prisma.lesson.findMany({
      where,
      include: {
        instructor: true,
        location: true,
        room: true,
        enrollments: { select: { id: true } }
      },
      orderBy: { startTime: 'asc' }
    });

    res.json(lessons);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get teacher's calendar
router.get('/teacher/:teacherId', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const lessons = await prisma.lesson.findMany({
      where: {
        instructorId: req.params.teacherId,
        startTime: { gte: new Date(startDate as string) },
        endTime: { lte: new Date(endDate as string) },
        status: { not: 'CANCELLED' }
      },
      include: { location: true, room: true }
    });

    res.json(lessons);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teacher calendar' });
  }
});

export default router;
```

**Commits:**
- `feat(scheduling): implement conflict detection and validation`
- `feat(scheduling): add reschedule and calendar endpoints`

### Week 8: Frontend Calendar Implementation

**Day 1-2: Calendar Component Setup**
```typescript
// apps/frontend/src/components/Calendar/LessonCalendar.tsx
import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'en-US': require('date-fns/locale/en-US') };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales
});

interface Lesson {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId?: string;
  type: 'INDIVIDUAL' | 'GROUP' | 'HYBRID';
}

export function LessonCalendar() {
  const [events, setEvents] = useState<Lesson[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/calendar/events?startDate=...&endDate=...');
      const lessons = await response.json();
      setEvents(lessons.map((l: any) => ({
        id: l.id,
        title: l.title,
        start: new Date(l.startTime),
        end: new Date(l.endTime),
        type: l.type,
        resourceId: l.roomId
      })));
    } catch (error) {
      console.error('Failed to fetch lessons', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectEvent = (event: Lesson) => {
    setSelectedEvent(event);
  };

  return (
    <div style={{ height: '100vh' }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={(slotInfo) => {
          // Could add slot selection for creating new lessons
        }}
        selectable
        popup
      />
      {selectedEvent && (
        <LessonDetailDialog
          lesson={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onReschedule={(newTime) => handleReschedule(selectedEvent.id, newTime)}
        />
      )}
    </div>
  );
}
```

**Day 3-4: Drag-and-Drop Implementation**
```typescript
// apps/frontend/src/components/Calendar/DragDropCalendar.tsx
import React, { useState } from 'react';
import {
  Calendar,
  Views,
  dateFnsLocalizer,
  SlotInfo
} from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dnd';
import { format, parse, startOfWeek, getDay, addHours } from 'date-fns';

const DragDropCalendar = withDragAndDrop(Calendar);

export function SchedulingCalendar() {
  const [events, setEvents] = useState([]);
  const [showConflictAlert, setShowConflictAlert] = useState(false);
  const [conflictInfo, setConflictInfo] = useState<any>(null);

  const handleEventDrop = async ({ event, start, end }: any) => {
    // Check for conflicts
    const response = await fetch('/api/scheduling/check-conflict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lessonId: event.id,
        startTime: start,
        endTime: end
      })
    });

    const validation = await response.json();

    if (!validation.valid) {
      setConflictInfo(validation);
      setShowConflictAlert(true);
      return; // Don't update UI
    }

    // Perform reschedule
    const rescheduleResponse = await fetch('/api/scheduling/reschedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lessonId: event.id,
        newStartTime: start,
        newEndTime: end
      })
    });

    const updated = await rescheduleResponse.json();

    // Update event in calendar
    setEvents(events.map(e => e.id === event.id ? { ...e, start, end } : e));
  };

  return (
    <div>
      <DragDropCalendar
        localizer={localizer}
        events={events}
        onEventDrop={handleEventDrop}
        draggableAccessor={() => true}
        resizable
        step={30}
        showMultiDayTimes
      />

      {showConflictAlert && (
        <ConflictDialog
          info={conflictInfo}
          onClose={() => setShowConflictAlert(false)}
        />
      )}
    </div>
  );
}
```

**Day 5: Testing**
- [ ] Test conflict detection scenarios
- [ ] Test drag-and-drop UI
- [ ] Test undo functionality

**Commits:**
- `feat(frontend): add lesson calendar component with react-big-calendar`
- `feat(frontend): implement drag-and-drop scheduling`

**Success Criteria (End of Week 7-8):**
- ✅ Calendar displays all lessons
- ✅ Drag-and-drop reschedules lessons
- ✅ Real-time conflict detection
- ✅ Conflicts prevented with alerts
- ✅ Undo functionality working
- ✅ Change history tracked

---

## WEEK 9-10: Notifications & Hybrid Lessons

### Week 9: Email & SMS Notification Setup

**Day 1-2: SendGrid & Twilio Integration**
```powershell
# Install notification dependencies
npm install @sendgrid/mail twilio bull redis

# Create .env entries
# SENDGRID_API_KEY=...
# TWILIO_ACCOUNT_SID=...
# TWILIO_AUTH_TOKEN=...
# TWILIO_PHONE_NUMBER=...
# REDIS_URL=redis://localhost:6379
```

**Day 1-2:**
```typescript
// src/services/notification.service.ts
// (See Notification Specification for full code)

// src/services/email.service.ts (using SendGrid)
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export class EmailService {
  async sendEmail(to: string, subject: string, html: string) {
    await sgMail.send({
      to,
      from: 'noreply@school.mymusics.app',
      subject,
      html
    });
  }
}

// src/services/sms.service.ts (using Twilio)
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export class SMSService {
  async sendSMS(to: string, message: string) {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to
    });
  }
}
```

**Day 3-4: Notification Queue Setup**
```typescript
// src/config/queue.ts
import Queue from 'bull';

export const emailQueue = new Queue('emails', {
  redis: process.env.REDIS_URL
});

export const smsQueue = new Queue('sms', {
  redis: process.env.REDIS_URL
});

// Process email queue
emailQueue.process(async (job) => {
  await emailService.sendEmail(
    job.data.to,
    job.data.subject,
    job.data.html
  );
});

// Process SMS queue
smsQueue.process(async (job) => {
  await smsService.sendSMS(job.data.to, job.data.message);
});
```

**Day 5: Notification Templates**
- [ ] Create template system
- [ ] Create HTML email templates
- [ ] Create SMS message templates

**Commits:**
- `feat(notifications): integrate SendGrid and Twilio`
- `feat(notifications): set up Bull queue for async processing`

### Week 9: Notification Preferences & Triggers

**Day 3-5 continued:**
```typescript
// src/models/NotificationPreference (in Prisma)
// Already in schema - create migration

// src/routes/notifications/preferences.routes.ts
import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();

router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const prefs = await prisma.notificationPreference.findUnique({
      where: { userId: req.user!.id }
    });

    if (!prefs) {
      // Create default preferences
      const created = await prisma.notificationPreference.create({
        data: { userId: req.user!.id }
      });
      return res.json(created);
    }

    res.json(prefs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

router.patch('/preferences', authenticateToken, async (req, res) => {
  try {
    const prefs = await prisma.notificationPreference.update({
      where: { userId: req.user!.id },
      data: req.body
    });

    res.json(prefs);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update preferences' });
  }
});

export default router;
```

**Trigger Implementation:**
```typescript
// src/services/notificationTriggers.ts

// Trigger 1: Lesson Rescheduled
export async function onLessonRescheduled(lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      enrollments: {
        include: { student: { include: { user: true } } }
      },
      instructor: true
    }
  });

  for (const enrollment of lesson!.enrollments) {
    const parent = await getParentForStudent(enrollment.student);

    if (parent) {
      const prefs = await getNotificationPrefs(parent.id);

      if (prefs.emailLessonChanges) {
        emailQueue.add({
          to: parent.email,
          template: 'lesson-rescheduled',
          data: {
            lessonTitle: lesson!.title,
            studentName: enrollment.student.user.firstName,
            oldTime: '...', // Get from history
            newTime: lesson!.startTime
          }
        });
      }
    }
  }
}

// Trigger 2: Payment Invoice Created
export async function onPaymentCreated(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { familyGroup: true }
  });

  const recipient = payment!.familyGroup
    ? payment!.familyGroup.admin
    : await getParentForPayment(payment!);

  const prefs = await getNotificationPrefs(recipient.id);

  if (prefs.emailPaymentInvoices) {
    emailQueue.add({
      to: recipient.email,
      template: 'invoice-created',
      data: {
        invoiceNumber: payment!.invoiceNumber,
        amount: payment!.amount,
        dueDate: payment!.invoiceDueDate
      }
    });
  }
}

// Trigger 3: Hybrid Booking Period (scheduled job)
export async function checkAndTriggerHybridBooking() {
  const hybridLessons = await prisma.hybridLessonConfig.findMany({
    include: { lesson: { include: { enrollments: true } } }
  });

  for (const config of hybridLessons) {
    const currentWeek = calculateCurrentWeek(config);

    if (config.oneOnOneWeeks.includes(currentWeek)) {
      for (const enrollment of config.lesson.enrollments) {
        const parent = await getParentForStudent(enrollment.student);
        const prefs = await getNotificationPrefs(parent.id);

        if (prefs.emailBookingPeriods || prefs.smsBookingPeriods) {
          if (prefs.emailBookingPeriods) {
            emailQueue.add({
              to: parent.email,
              template: 'hybrid-booking-open',
              data: { ... }
            });
          }

          if (prefs.smsBookingPeriods && prefs.smsPhoneNumber) {
            smsQueue.add({
              to: prefs.smsPhoneNumber,
              template: 'hybrid-booking-open-sms',
              data: { ... }
            });
          }
        }
      }
    }
  }
}
```

### Week 10: Hybrid Lesson Configuration

**Day 1-3: Hybrid Lesson Service**
```typescript
// src/services/hybrid.service.ts
export class HybridService {
  
  async createHybridConfig(lessonId: string, config: {
    cycleLength: number;
    oneOnOneWeeks: number[];
    cycleStartDate: Date;
    oneOnOnePricePerStudent?: number;
  }) {
    return prisma.hybridLessonConfig.create({
      data: {
        lessonId,
        ...config
      }
    });
  }

  getCurrentCycleWeek(lessonStartDate: Date, cycleLength: number): number {
    const daysElapsed = Math.floor(
      (Date.now() - lessonStartDate.getTime()) / (24 * 60 * 60 * 1000)
    );
    return (Math.floor(daysElapsed / 7) % cycleLength) + 1;
  }

  isBookingWeek(lessonId: string): boolean {
    // Calculate if current week is a 1-on-1 booking week
    // Return true/false
  }

  async getAvailableOneOnOneSlots(lessonId: string): Promise<TimeSlot[]> {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { hybridConfig: true, instructor: true }
    });

    if (!lesson?.hybridConfig || !this.isBookingWeek(lessonId)) {
      return [];
    }

    // Get teacher availability
    // Get already booked slots
    // Calculate available slots
    // Return available times
  }

  async bookOneOnOneSession(lessonId: string, studentId: string, slotTime: Date) {
    // Validate it's a booking week
    // Create individual lesson
    // Create enrollment
    // Send confirmation notification
  }
}

export const hybridService = new HybridService();
```

**Day 4-5: Hybrid Endpoints & Testing**
```typescript
// src/routes/admin/hybrid.routes.ts
import { Router } from 'express';
import { authenticateToken, requireRole } from '../../middleware/auth.middleware';
import { hybridService } from '../../services/hybrid.service';

const router = Router();

// Create hybrid configuration
router.post('/:lessonId/config', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const config = await hybridService.createHybridConfig(req.params.lessonId, req.body);
    res.status(201).json(config);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Get available 1-on-1 slots
router.get('/:lessonId/available-slots', authenticateToken, async (req, res) => {
  try {
    const slots = await hybridService.getAvailableOneOnOneSlots(req.params.lessonId);
    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
});

// Book 1-on-1 session
router.post('/:lessonId/book-session', authenticateToken, async (req, res) => {
  try {
    const { studentId, slotTime } = req.body;
    const booking = await hybridService.bookOneOnOneSession(
      req.params.lessonId,
      studentId,
      new Date(slotTime)
    );

    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
```

**Commits:**
- `feat(notifications): implement notification service with SendGrid/Twilio`
- `feat(notifications): add notification triggers and preferences`
- `feat(hybrid): implement hybrid lesson configuration and 1-on-1 booking`

**Success Criteria (End of Week 9-10):**
- ✅ Email notifications sending via SendGrid
- ✅ SMS notifications via Twilio
- ✅ Notification preferences working
- ✅ All triggers implemented (reschedule, payment, hybrid booking, etc.)
- ✅ Hybrid lesson cycles calculating correctly
- ✅ 1-on-1 booking period triggering notifications
- ✅ Parents can book 1-on-1 sessions

---

## WEEK 11-12: Payments & File Sharing

### Week 11: Stripe Payment Integration

**Day 1-2:**
```typescript
// src/services/payment.service.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export class PaymentService {
  
  async createPaymentIntent(amount: number, currency: string = 'usd') {
    return stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      payment_method_types: ['card']
    });
  }

  async confirmPayment(paymentIntentId: string) {
    return stripe.paymentIntents.retrieve(paymentIntentId);
  }

  async generateInvoice(paymentData: any) {
    return prisma.payment.create({
      data: {
        ...paymentData,
        status: 'PENDING',
        invoiceNumber: this.generateInvoiceNumber()
      }
    });
  }

  private generateInvoiceNumber(): string {
    return `INV-${Date.now()}`;
  }
}

export const paymentService = new PaymentService();
```

**Day 3-4:**
```typescript
// src/routes/payments.routes.ts
import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import { paymentService } from '../../services/payment.service';
import prisma from '../../config/database';

const router = Router();

// Create payment intent (frontend will use this)
router.post('/create-intent', authenticateToken, async (req, res) => {
  try {
    const { lessonId, amount } = req.body;

    const intent = await paymentService.createPaymentIntent(amount);

    // Save payment record
    const payment = await prisma.payment.create({
      data: {
        lessonId,
        schoolId: req.user!.schoolId,
        amount,
        status: 'PENDING',
        stripePaymentIntentId: intent.id,
        invoiceNumber: `INV-${Date.now()}`
      }
    });

    res.json({ clientSecret: intent.client_secret, paymentId: payment.id });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Confirm payment (webhook from Stripe)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']!;
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    return res.sendStatus(400);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;

    // Update payment status
    await prisma.payment.update({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: {
        status: 'COMPLETED',
        paidAt: new Date(),
        stripeChargeId: paymentIntent.charges.data[0]?.id
      }
    });

    // TODO: Send receipt notification
  }

  res.sendStatus(200);
});

export default router;
```

**Day 5: Testing**
- [ ] Test payment creation
- [ ] Test webhook handling
- [ ] Test payment status updates

**Commit:** `feat(payments): integrate Stripe payment processing`

### Week 12: File Sharing & Resources

**Day 1-2:**
```typescript
// src/services/resource.service.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: 'us-east-1' });

export class ResourceService {
  
  async uploadResource(file: Buffer, fileName: string, lessonId: string) {
    const key = `lessons/${lessonId}/${Date.now()}-${fileName}`;

    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      Body: file,
      ContentType: getMimeType(fileName)
    }));

    return key;
  }

  async createResource(lessonId: string, fileUrl: string, resourceData: any) {
    return prisma.resource.create({
      data: {
        ...resourceData,
        fileUrl,
        lessonId,
        schoolId: resourceData.schoolId
      }
    });
  }

  async grantStudentAccess(resourceId: string, studentId: string) {
    return prisma.resourceAccess.create({
      data: {
        resourceId,
        studentId,
        accessGrantedAt: new Date()
      }
    });
  }

  async getStudentResources(studentId: string) {
    return prisma.resource.findMany({
      where: {
        resourceAccess: {
          some: { studentId }
        }
      }
    });
  }
}

export const resourceService = new ResourceService();
```

**Day 3-4:**
```typescript
// src/routes/resources.routes.ts
import { Router } from 'express';
import multer from 'multer';
import { authenticateToken, requireRole } from '../../middleware/auth.middleware';
import { resourceService } from '../../services/resource.service';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

// Upload resource (teacher only)
router.post('/', authenticateToken, requireRole('TEACHER'), upload.single('file'), async (req, res) => {
  try {
    const { lessonId, type, title, description } = req.body;

    // Upload to S3
    const fileUrl = await resourceService.uploadResource(
      req.file!.buffer,
      req.file!.originalname,
      lessonId
    );

    // Create resource record
    const resource = await resourceService.createResource(
      lessonId,
      fileUrl,
      {
        type,
        title,
        description,
        schoolId: req.user!.schoolId
      }
    );

    // Grant access to all enrolled students in lesson
    const enrollments = await prisma.enrollment.findMany({
      where: { lessonId }
    });

    for (const enrollment of enrollments) {
      await resourceService.grantStudentAccess(resource.id, enrollment.studentId);
    }

    res.status(201).json(resource);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Get student's resources
router.get('/my-resources', authenticateToken, async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id }
    });

    if (!student) {
      return res.json({ resources: [] });
    }

    const resources = await resourceService.getStudentResources(student.id);
    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// Download resource (track access)
router.get('/:id/download', authenticateToken, async (req, res) => {
  try {
    const resource = await prisma.resource.findUnique({
      where: { id: req.params.id }
    });

    if (!resource) return res.status(404).json({ error: 'Not found' });

    // Track access
    await prisma.resourceAccess.updateMany({
      where: {
        resourceId: req.params.id,
        student: { userId: req.user!.id }
      },
      data: {
        lastAccessedAt: new Date(),
        accessCount: { increment: 1 }
      }
    });

    // Redirect to S3 URL
    const signedUrl = await getSignedUrl(resource.fileUrl);
    res.redirect(signedUrl);
  } catch (error) {
    res.status(500).json({ error: 'Failed to download' });
  }
});

export default router;
```

**Day 5: Testing & Dashboards**
- [ ] Test file upload
- [ ] Test access tracking
- [ ] Build basic dashboards

**Commits:**
- `feat(resources): implement file sharing with S3`
- `feat(resources): add resource access tracking`

---

## WEEK 13-14: Dashboards & UI Polish

### Week 13: Dashboard Implementation

**Day 1-2: Admin Dashboard**
```typescript
// apps/frontend/src/pages/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography } from '@mui/material';
import { SchedulingCalendar } from '../components/Calendar/SchedulingCalendar';
import { StudentRoster } from '../components/Admin/StudentRoster';
import { LessonsList } from '../components/Admin/LessonsList';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalLessons: 0,
    totalPaymentsPending: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary">Total Students</Typography>
              <Typography variant="h5">{stats.totalStudents}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <SchedulingCalendar />
        </Grid>

        <Grid item xs={12} md={6}>
          <StudentRoster />
        </Grid>

        <Grid item xs={12} md={6}>
          <LessonsList />
        </Grid>
      </Grid>
    </Box>
  );
}
```

**Day 3-4: Parent Dashboard**
```typescript
// apps/frontend/src/pages/ParentDashboard.tsx
export function ParentDashboard() {
  // Shows family information
  // Lists all children
  // Shows combined schedule
  // Shows family payments/billing
  // Shows notifications
}
```

**Day 5: Teacher Dashboard**
```typescript
// apps/frontend/src/pages/TeacherDashboard.tsx
export function TeacherDashboard() {
  // Shows teacher's lessons
  // Shows enrolled students
  // Shows resources to upload
  // Shows attendance interface
}
```

**Commits:**
- `feat(frontend): implement admin dashboard`
- `feat(frontend): implement parent dashboard`
- `feat(frontend): implement teacher dashboard`

### Week 14: Final Polish & Testing

**Day 1-2: Attendance UI & Reports**
```typescript
// apps/frontend/src/components/Attendance/AttendanceForm.tsx
// Mark attendance after lessons
```

**Day 3-4: Material 3 Design Implementation**
- [ ] Apply Material 3 color system
- [ ] Implement Material 3 components
- [ ] Review responsive design

**Day 5: Comprehensive Testing**
- [ ] Full end-to-end testing
- [ ] Performance testing
- [ ] Security audit

**Commits:**
- `feat(frontend): add attendance tracking UI`
- `feat(frontend): implement Material 3 design system`
- `test: comprehensive end-to-end testing`

---

## WEEK 15-16: Final Testing & Deployment Prep

### Week 15: Integration Testing & Bug Fixes

**Daily:**
- [ ] Integration tests across all systems
- [ ] Bug fixes and refinements
- [ ] Performance optimization
- [ ] Security hardening

**Commit daily:** `fix: resolve identified issues`

### Week 16: Deployment & Documentation

**Day 1-2:**
- [ ] Final security audit
- [ ] Performance testing
- [ ] Database optimization

**Day 3-4:**
- [ ] Deploy to DigitalOcean staging
- [ ] User acceptance testing
- [ ] Documentation finalization

**Day 5:**
- [ ] Deploy to production
- [ ] Monitor for issues
- [ ] Create admin documentation
- [ ] Create user guides

**Final Commits:**
- `chore: prepare for production deployment`
- `docs: add production documentation`
- `release: v1.0.0 MVP release`

---

## Daily Standup Template

Each day, commit to GitHub with this format:

```
git commit -m "feat(feature-name): brief description"

With details:
- [ ] Task 1 completed
- [ ] Task 2 completed  
- [ ] Next steps identified
```

---

## Sprint Velocity & Burndown

Track progress:
- [ ] 5 commits per week (minimum)
- [ ] All tests passing (minimum)
- [ ] Code review before merge
- [ ] Documentation up to date

---

## Contingency Plan

If behind schedule:
1. **Week 7-8:** Defer scheduled file release to Phase 2
2. **Week 9-10:** Defer SMS, keep emails only
3. **Week 11-12:** Defer advanced reporting
4. **Week 15-16:** Extend by 1-2 weeks if needed

---

**Total: 14-16 weeks to MVP launch 🚀**

