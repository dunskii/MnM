# Music 'n Me

A SaaS platform for managing music schools, replacing the "Simply Portal" system.

## Quick Links

- [Task List](./TASKLIST.md) - Development tasks organized by phase
- [Progress Tracker](./PROGRESS.md) - Track development progress
- [Project Instructions](./CLAUDE.md) - Detailed project context
- [Sprint Plan](./Planning/roadmaps/12_Week_MVP_Plan.md) - 12-week MVP breakdown

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Node.js 18+, TypeScript, Express, Prisma, PostgreSQL 15+ |
| **Frontend** | React 18+, TypeScript, Vite, Material-UI v5, React Query |
| **Auth** | JWT + bcrypt (12 rounds) |
| **Payments** | Stripe |
| **Email** | SendGrid |
| **File Storage** | Google Drive API, DigitalOcean Spaces |
| **Hosting** | DigitalOcean |

## Key Features (MVP)

- **Hybrid Lesson Booking** - Courses mixing group + individual sessions (CORE FEATURE)
- **Meet & Greet System** - Public booking for prospective parents
- **Google Drive Sync** - Two-way file sync between Drive and portal
- **Multi-tenancy** - Multiple schools on single platform
- **Teacher Cross-Access** - Teachers can view all classes/students

## Project Structure

```
MnM/
├── apps/
│   ├── backend/          # Node.js + Express + Prisma
│   │   ├── src/
│   │   │   ├── config/   # Configuration
│   │   │   ├── middleware/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   └── types/
│   │   └── prisma/       # Database schema
│   └── frontend/         # React + Vite + MUI
│       └── src/
│           ├── components/
│           ├── pages/
│           ├── hooks/
│           ├── services/
│           ├── styles/
│           └── types/
├── Planning/             # Project planning docs
├── docs/                 # Developer documentation
├── TASKLIST.md           # Development tasks
├── PROGRESS.md           # Progress tracker
└── CLAUDE.md             # Project instructions
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Docker (for PostgreSQL)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MnM
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start PostgreSQL with Docker**
   ```bash
   npm run docker:up
   ```

4. **Configure environment variables**
   ```bash
   # Backend
   cp apps/backend/.env.example apps/backend/.env
   # Edit apps/backend/.env with your settings

   # Frontend
   cp apps/frontend/.env.example apps/frontend/.env
   # Edit apps/frontend/.env with your settings
   ```

5. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

6. **Start development servers**
   ```bash
   # Start both backend and frontend
   npm run dev

   # Or start individually
   npm run dev:backend   # Port 5000
   npm run dev:frontend  # Port 3000
   ```

## Available Scripts

### Root Level

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both backend and frontend |
| `npm run dev:backend` | Start backend only |
| `npm run dev:frontend` | Start frontend only |
| `npm run build` | Build both apps |
| `npm run test` | Run all tests |
| `npm run lint` | Lint all code |
| `npm run docker:up` | Start PostgreSQL + Redis |
| `npm run docker:down` | Stop Docker services |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed database |

### Backend

```bash
cd apps/backend
npm run dev          # Start dev server
npm run build        # Build for production
npm run test         # Run tests
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
```

### Frontend

```bash
cd apps/frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run test         # Run tests
npm run preview      # Preview production build
```

## Environment Variables

### Backend (.env)

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/music_n_me
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_test_...
SENDGRID_API_KEY=...
```

See `apps/backend/.env.example` for all variables.

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

See `apps/frontend/.env.example` for all variables.

## Brand Guidelines

- **Primary Color**: #4580E4 (Blue)
- **Secondary Color**: #FFCE00 (Yellow)
- **Accent Colors**: Mint (#96DAC9), Coral (#FFAE9E), Cream (#FCF6E6)
- **Typography**: Monkey Mayhem (headings), Avenir (body)
- **Style**: Flat design, no gradients, no drop shadows

## License

Private - All rights reserved.
