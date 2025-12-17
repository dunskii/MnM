# Development Guidelines

## Code Style

### TypeScript
- Strict mode enabled
- Use explicit types (avoid `any`)
- Prefer interfaces over types for object shapes
- Use enums for fixed sets of values

### JavaScript/TypeScript Best Practices
- Async/await over promises
- Functional components with hooks (React)
- Destructuring for props and objects
- Arrow functions for consistency
- Clear, descriptive variable names

### Formatting
- ESLint + Prettier for automatic formatting
- 2 spaces for indentation
- Single quotes for strings
- Semicolons required
- Trailing commas in multi-line objects/arrays

## Security Best Practices

### Multi-Tenancy
**CRITICAL**: Every database query MUST filter by `schoolId`

```typescript
// ✅ CORRECT
const lessons = await prisma.lesson.findMany({
  where: {
    schoolId: req.user.schoolId,  // ALWAYS include this!
    instructorId: teacherId
  }
});

// ❌ WRONG - Security vulnerability!
const lessons = await prisma.lesson.findMany({
  where: { instructorId: teacherId }
});
```

### Authentication & Authorization
- Hash passwords with bcrypt (12 rounds minimum)
- JWT tokens expire after 7 days
- Store JWT secret in environment variables
- Validate JWT on every protected route
- Check user role before allowing actions

### Input Validation
- Validate all user input on backend
- Sanitize data before database operations
- Use Prisma's parameterized queries (automatic)
- Validate file uploads (type, size)
- Rate limiting on auth endpoints

### General Security
- HTTPS enforced in production
- CORS restricted to frontend domain
- Environment variables for secrets
- Never commit `.env` files
- Secure headers (helmet.js)

## Testing Strategy

### Backend Testing (Jest)
- Unit tests for services and utilities
- Integration tests for API endpoints
- Test authentication and authorization
- Test multi-tenancy isolation
- Mock external services (Stripe, SendGrid, etc.)

### Frontend Testing (React Testing Library)
- Component unit tests
- User interaction tests
- Form validation tests
- Mock API calls
- Accessibility tests

### E2E Testing
Critical user flows:
1. **Admin Flow**: Register → Login → Create school → Create lesson → Enroll students → Mark attendance
2. **Parent Flow**: Register → Create family → Add children → View schedule → Pay invoice
3. **Teacher Flow**: Login → View schedule → Mark attendance → Upload resource

### Test Coverage Goals
- Backend: 80%+ coverage
- Frontend: 70%+ coverage
- Critical paths: 100% coverage

## Git Workflow

### Branches
- `main`: Production-ready code (protected)
- `dev`: Integration branch
- Feature branches: `feature/lesson-management`, `feature/stripe-integration`
- Bug fixes: `fix/attendance-bug`, `fix/invoice-calculation`
- Hotfixes: `hotfix/critical-security-patch`

### Commit Messages
Use conventional commits format:

```
feat: add lesson drag-and-drop rescheduling
fix: resolve double-booking conflict detection
refactor: simplify invoice calculation logic
docs: update API documentation
test: add attendance marking tests
chore: update dependencies
```

### Pull Request Process
1. Create feature branch from `dev`
2. Write code + tests
3. Run linter and tests locally
4. Create PR to `dev` branch
5. Code review required
6. Squash and merge after approval
7. Delete feature branch

### Merge to Main
- Only from `dev` branch
- After full QA testing
- Tag with version number
- Deploy to production

## API Design

### REST Conventions
- Use HTTP methods correctly: GET, POST, PATCH, DELETE
- Consistent URL structure: `/api/v1/resource`
- Plural nouns for collections: `/api/v1/lessons`
- IDs in URL path: `/api/v1/lessons/:id`

### Request/Response Format
```typescript
// Success Response
{
  "success": true,
  "data": { /* resource data */ },
  "message": "Lesson created successfully"
}

// Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid lesson duration",
    "details": { /* validation errors */ }
  }
}
```

### Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (not logged in)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (e.g., double-booking)
- `500`: Internal Server Error

### Pagination
```typescript
// Request
GET /api/v1/lessons?page=2&limit=20

// Response
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## Database Conventions

### Naming
- Tables: PascalCase (User, Lesson, Invoice)
- Columns: camelCase (firstName, lessonType, createdAt)
- Relations: descriptive names (lessonsAsInstructor, studentProfile)

### Required Fields
Every model should have:
- `id`: Primary key (cuid)
- `createdAt`: Timestamp
- `updatedAt`: Timestamp
- `schoolId`: For multi-tenant models

### Indexes
Add indexes for:
- Foreign keys
- Frequently queried fields
- Fields used in WHERE clauses
- Fields used in ORDER BY

### Migrations
```bash
# Create migration after schema changes
npx prisma migrate dev --name add_hybrid_lesson_config

# Apply migrations to production
npx prisma migrate deploy

# Reset database (DEVELOPMENT ONLY!)
npx prisma migrate reset
```

## Error Handling

### Backend
```typescript
// Use try-catch for async operations
try {
  const lesson = await prisma.lesson.create({ data });
  res.json({ success: true, data: lesson });
} catch (error) {
  console.error('Error creating lesson:', error);
  res.status(500).json({
    success: false,
    error: {
      code: 'DATABASE_ERROR',
      message: 'Failed to create lesson'
    }
  });
}
```

### Frontend
```typescript
// React Query handles errors gracefully
const { data, isLoading, error } = useQuery({
  queryKey: ['lessons'],
  queryFn: fetchLessons,
  onError: (error) => {
    toast.error('Failed to load lessons');
  }
});
```

## Performance Optimization

### Database
- Use `select` to fetch only needed fields
- Use `include` instead of multiple queries
- Pagination for large datasets
- Database indexes on frequently queried fields
- Connection pooling

### Backend
- Redis caching for frequently accessed data (Phase 2)
- Compress API responses (gzip)
- Rate limiting to prevent abuse

### Frontend
- Code splitting with React lazy loading
- Memoization with `useMemo` and `useCallback`
- Debounce search inputs
- Optimize images (WebP, lazy loading)
- Virtual scrolling for large lists

## Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/music_school_dev"

# Auth
JWT_SECRET="your-secret-key-here"
JWT_EXPIRE="7d"

# Server
PORT=5000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"

# Phase 2 Integrations
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
SENDGRID_API_KEY="SG...."
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
AWS_S3_BUCKET="musicnme-files"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Documentation

### Code Comments
- Document WHY, not WHAT (code should be self-explanatory)
- JSDoc for public functions and complex logic
- TODO comments with GitHub issue numbers

### API Documentation
- Document all endpoints
- Include request/response examples
- Note authentication requirements
- List possible error responses

### README
- Project setup instructions
- Development workflow
- Deployment process
- Common troubleshooting

## Deployment

### Development
- DigitalOcean App Platform (automatic from `dev` branch)
- PostgreSQL Managed Database (dev instance)

### Production
- DigitalOcean App Platform (manual deploy from `main`)
- PostgreSQL Managed Database (production instance)
- Daily automated backups
- Environment variables configured
- HTTPS enforced
- Custom domain configured

### Deployment Checklist
- [ ] All tests passing
- [ ] Environment variables set
- [ ] Database migrations applied
- [ ] Secrets rotated (if needed)
- [ ] Monitoring enabled
- [ ] Backup verified
- [ ] Rollback plan ready

## Support Resources

- **Prisma**: https://www.prisma.io/docs
- **Material-UI**: https://mui.com/material-ui
- **React Big Calendar**: https://github.com/jquense/react-big-calendar
- **React Query**: https://tanstack.com/query/latest
- **Stripe**: https://stripe.com/docs
- **Express**: https://expressjs.com/
- **TypeScript**: https://www.typescriptlang.org/docs/
