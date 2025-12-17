# Music School SaaS - Local Development Setup Guide

## Overview

This guide covers setting up the music school SaaS platform for local development using:
- Local PostgreSQL database (Docker or native)
- Node.js backend running locally
- React frontend dev server
- GitHub for version control

---

## Prerequisites

Ensure you have installed:
- **Node.js** 18.x or higher (https://nodejs.org)
- **Git** (https://git-scm.com)
- **Docker & Docker Desktop** (https://docker.com) - Recommended for PostgreSQL
  - OR PostgreSQL 15+ installed natively if not using Docker

Verify installations in PowerShell:

```powershell
node --version
npm --version
git --version
docker --version
```

---

## Project Initialization

### Step 1: Create Project Repository on GitHub

1. Go to https://github.com/new
2. Create repository: `music-school-saas`
3. Choose "Private" (if desired)
4. Add `.gitignore` template for Node.js
5. Clone locally

```powershell
git clone https://github.com/[your-username]/music-school-saas.git
cd music-school-saas
```

### Step 2: Create Project Structure

```powershell
# Create directory structure
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
    "apps\frontend\src\components\Layout",
    "apps\frontend\src\components\Auth",
    "apps\frontend\src\components\Lessons",
    "apps\frontend\src\components\Students",
    "apps\frontend\src\components\Payments",
    "apps\frontend\src\components\Common",
    "apps\frontend\src\pages",
    "apps\frontend\src\hooks",
    "apps\frontend\src\services",
    "apps\frontend\src\context",
    "apps\frontend\src\theme",
    ".github\workflows"
)

foreach ($dir in $dirs) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

# Create root .gitignore
@"
node_modules/
.env
.env.local
.env.*.local
dist/
build/
.DS_Store
*.log
.vscode/
.idea/
.idea/
*.swp
*.swo
" | Out-File -Encoding UTF8 ".gitignore"

# Create root README.md
@"
# Music School SaaS Platform

A multi-tenant SaaS platform for managing music schools with support for group and individual lessons, student rosters, and integrated payment processing.

## Tech Stack

- **Frontend**: React 18, TypeScript, Material-UI (Material 3)
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT
- **Payments**: Stripe Connect

## Local Development Setup

See [LOCAL_SETUP.md](./LOCAL_SETUP.md) for detailed setup instructions.

## Project Structure

- `apps/backend/` - Express.js REST API
- `apps/frontend/` - React application

## Getting Started

### Backend

\`\`\`powershell
cd apps/backend
npm install
npm run dev
\`\`\`

### Frontend

\`\`\`powershell
cd apps/frontend
npm install
npm run dev
\`\`\`

## Database

PostgreSQL is managed via Docker Compose locally and Prisma migrations.

\`\`\`powershell
docker-compose up -d
npx prisma migrate dev
\`\`\`

## Contributing

1. Create a feature branch: \`git checkout -b feature/feature-name\`
2. Commit changes: \`git commit -am 'Add feature'\`
3. Push to branch: \`git push origin feature/feature-name\`
4. Open a Pull Request

" | Out-File -Encoding UTF8 "README.md"

Write-Host "✓ Project structure created successfully" -ForegroundColor Green
```

---

## Docker Setup for PostgreSQL

### Step 1: Create docker-compose.yml

From the project root:

```powershell
@"
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: music_school_db
    environment:
      POSTGRES_USER: music_user
      POSTGRES_PASSWORD: music_password_dev
      POSTGRES_DB: music_school_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - music_school_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U music_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: music_school_pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@localhost
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    networks:
      - music_school_network
    depends_on:
      - postgres

volumes:
  postgres_data:

networks:
  music_school_network:
    driver: bridge
" | Out-File -Encoding UTF8 "docker-compose.yml"

Write-Host "✓ docker-compose.yml created" -ForegroundColor Green
```

### Step 2: Start PostgreSQL

```powershell
# Start the database and pgAdmin
docker-compose up -d

# Verify services are running
docker-compose ps

# View logs (optional)
docker-compose logs -f postgres

# Access pgAdmin at http://localhost:5050
# Default email: admin@localhost
# Default password: admin
```

### Useful Docker Commands

```powershell
# Stop services
docker-compose down

# Stop and remove all data (fresh start)
docker-compose down -v

# Restart services
docker-compose restart

# Connect to PostgreSQL via CLI
docker-compose exec postgres psql -U music_user -d music_school_dev

# View database status
docker-compose logs postgres
```

---

## Backend Setup

### Step 1: Initialize Backend Project

```powershell
cd apps\backend

# Initialize npm project
npm init -y

# Install core dependencies
npm install express typescript @types/express @types/node prisma @prisma/client dotenv cors bcryptjs jsonwebtoken stripe axios uuid

# Install dev dependencies
npm install --save-dev @types/bcryptjs @types/jsonwebtoken ts-node nodemon `
  @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint `
  @types/node nodemon

Write-Host "✓ Dependencies installed" -ForegroundColor Green
```

### Step 2: Initialize TypeScript Configuration

```powershell
# Generate tsconfig.json
npx tsc --init

Write-Host "✓ TypeScript configured" -ForegroundColor Green
```

### Step 3: Initialize Prisma

```powershell
# Initialize Prisma
npx prisma init

Write-Host "✓ Prisma initialized" -ForegroundColor Green
```

### Step 4: Create Backend .env File

```powershell
@"
# Database - matches docker-compose.yml
DATABASE_URL="postgresql://music_user:music_password_dev@localhost:5432/music_school_dev"

# JWT Configuration
JWT_SECRET="your_super_secret_jwt_key_for_local_development_change_in_production"
JWT_EXPIRE="7d"

# Stripe Configuration (get these from Stripe Dashboard - use test keys)
STRIPE_SECRET_KEY="sk_test_your_test_secret_key_here"
STRIPE_PUBLISHABLE_KEY="pk_test_your_test_publishable_key_here"
STRIPE_WEBHOOK_SECRET="whsec_test_webhook_secret_here"

# Server Configuration
PORT=5000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
LOG_LEVEL="debug"
" | Out-File -Encoding UTF8 ".env"

Write-Host "✓ .env file created" -ForegroundColor Green
```

### Step 5: Configure package.json Scripts

Edit `apps/backend/package.json` and update the scripts section:

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "prisma:migrate": "prisma migrate dev --name",
    "prisma:generate": "prisma generate",
    "prisma:studio": "prisma studio",
    "prisma:seed": "ts-node prisma/seed.ts",
    "test": "jest",
    "lint": "eslint src --ext .ts"
  }
}
```

### Step 6: Update tsconfig.json

```powershell
@"
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
" | Set-Content -Encoding UTF8 "tsconfig.json"

Write-Host "✓ tsconfig.json configured" -ForegroundColor Green
```

---

## Frontend Setup

### Step 1: Create React + TypeScript Project

```powershell
cd apps

# Create Vite React project
npm create vite@latest frontend -- --template react-ts

cd frontend

Write-Host "✓ React project created" -ForegroundColor Green
```

### Step 2: Install Dependencies

```powershell
# Install Material-UI and Material 3 dependencies
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material

# Install routing and data fetching
npm install react-router-dom axios @tanstack/react-query

# Install Stripe for payments
npm install @stripe/react-stripe-js @stripe/js

# Install development tools
npm install --save-dev @types/react @types/react-dom

Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
```

### Step 3: Create Frontend .env File

```powershell
@"
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_publishable_key_here
" | Out-File -Encoding UTF8 ".env"

Write-Host "✓ Frontend .env file created" -ForegroundColor Green
```

### Step 4: Configure vite.config.ts

Edit `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
```

---

## Running the Application Locally

### Terminal 1: Start PostgreSQL

```powershell
# From project root
docker-compose up

# Leave this running in the background
# Output should show: "database system is ready to accept connections"
```

### Terminal 2: Start Backend Server

```powershell
cd apps\backend

# Install dependencies (first time only)
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations (first time only)
npx prisma migrate dev --name init

# Start dev server
npm run dev

# Output should show: "Server is running on port 5000"
```

### Terminal 3: Start Frontend Dev Server

```powershell
cd apps\frontend

# Install dependencies (first time only)
npm install

# Start dev server
npm run dev

# Output should show: "Local: http://localhost:5173/"
```

### Verify Everything is Running

```powershell
# Check backend is responding
Invoke-RestMethod -Uri "http://localhost:5000/health" -Method Get

# Frontend should be accessible at http://localhost:5173
# Open in browser automatically, or visit manually
```

---

## Git Workflow

### Initial Commit

```powershell
cd music-school-saas

git add .
git commit -m "Initial project setup with backend and frontend structure"
git push origin main

Write-Host "✓ Initial commit pushed to GitHub" -ForegroundColor Green
```

### Creating Feature Branches

```powershell
# Create and switch to feature branch
git checkout -b feature/authentication

# Make changes, then commit
git add .
git commit -m "Add JWT authentication middleware"

# Push branch to GitHub
git push origin feature/authentication

# Create Pull Request on GitHub for code review
```

### Daily Development Workflow

```powershell
# Start of day: pull latest changes
git pull origin main

# Create feature branch for your work
git checkout -b feature/lesson-management

# During development: commit regularly
git add apps/backend/src/services/lesson.service.ts
git commit -m "Implement lesson creation service"

# Push changes
git push origin feature/lesson-management

# When feature is complete: create Pull Request on GitHub
```

---

## Useful Development Commands

### Backend Commands

```powershell
# Run backend in dev mode
cd apps\backend && npm run dev

# Run Prisma Studio (GUI for database)
cd apps\backend && npx prisma studio

# Create a new database migration
cd apps\backend && npx prisma migrate dev --name add_lesson_fields

# Reset database (CAREFUL - deletes all data)
cd apps\backend && npx prisma migrate reset

# Format Prisma schema
cd apps\backend && npx prisma format

# Generate Prisma client
cd apps\backend && npx prisma generate
```

### Frontend Commands

```powershell
# Run frontend in dev mode
cd apps\frontend && npm run dev

# Build for production
cd apps\frontend && npm run build

# Preview production build locally
cd apps\frontend && npm run preview

# Type check
cd apps\frontend && npm run type-check
```

### Database Commands

```powershell
# Access PostgreSQL CLI
docker-compose exec postgres psql -U music_user -d music_school_dev

# List all tables
\dt

# Exit PostgreSQL CLI
\q

# View database logs
docker-compose logs -f postgres

# Reset everything (backup first!)
docker-compose down -v
docker-compose up -d
```

---

## Troubleshooting

### Port Already in Use

```powershell
# Check what's using port 5000 (backend)
Get-Process | Where-Object {$_.Name -like "*node*"}

# Kill specific process (if needed)
Stop-Process -Id [PID] -Force

# Or change port in backend .env
DATABASE_PORT=5001
```

### Database Connection Issues

```powershell
# Ensure PostgreSQL is running
docker-compose ps

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres

# Verify connection string in .env matches docker-compose.yml
# Should be: postgresql://music_user:music_password_dev@localhost:5432/music_school_dev
```

### Prisma Migration Errors

```powershell
# Reset Prisma state
rm -r apps\backend\prisma\migrations
npx prisma migrate dev --name init

# Or resolve conflicts manually
npx prisma migrate resolve --rolled-back [migration_name]
```

### npm Module Issues

```powershell
# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -r node_modules
rm package-lock.json

# Reinstall
npm install
```

---

## GitHub Repository .gitignore

Make sure your `.gitignore` in the root includes:

```
# Dependencies
node_modules/
package-lock.json
npm-debug.log

# Environment variables (NEVER commit .env files)
.env
.env.local
.env.*.local

# Build outputs
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo
*.iml

# OS
.DS_Store
Thumbs.db

# Prisma
prisma/dev.db
prisma/dev.db-journal

# Logs
logs/
*.log

# Optional
.cache/
```

---

## Next Steps

1. ✅ Clone repository locally
2. ✅ Create project structure
3. ✅ Start PostgreSQL with Docker Compose
4. ✅ Set up backend with dependencies and .env
5. ✅ Set up frontend with dependencies and .env
6. ✅ Run `npx prisma migrate dev --name init` to create schema
7. ✅ Start backend server (`npm run dev`)
8. ✅ Start frontend server (`npm run dev`)
9. ✅ Make initial commit and push to GitHub
10. 🔄 Start implementing features on feature branches

---

## Resources

- **Node.js Documentation**: https://nodejs.org/docs
- **TypeScript Handbook**: https://www.typescriptlang.org/docs
- **Express.js Guide**: https://expressjs.com
- **React Documentation**: https://react.dev
- **Prisma Documentation**: https://www.prisma.io/docs
- **Material-UI Documentation**: https://mui.com/material-ui
- **PostgreSQL Documentation**: https://www.postgresql.org/docs
- **Git Documentation**: https://git-scm.com/doc

---

**Setup Complete!** 🎉

You're ready to start local development. Begin with the backend foundation (authentication, database models) before moving to frontend implementation.
