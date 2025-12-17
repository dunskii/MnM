# Coding Standards - Music 'n Me

**Last Updated:** December 17, 2025
**Version:** 1.0

## Overview

This document establishes coding standards for Music 'n Me platform to ensure code quality, consistency, and maintainability across the development team.

## Table of Contents

1. [TypeScript Configuration](#typescript-configuration)
2. [Code Formatting](#code-formatting)
3. [File Organization](#file-organization)
4. [Naming Conventions](#naming-conventions)
5. [Component Guidelines](#component-guidelines)
6. [Multi-Tenancy Patterns](#multi-tenancy-patterns)
7. [Error Handling](#error-handling)
8. [Testing Standards](#testing-standards)

## TypeScript Configuration

### Strict Mode

Always use TypeScript strict mode for maximum type safety:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Type Safety Rules

```typescript
// ✅ GOOD - Explicit types
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ BAD - Implicit any
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ✅ GOOD - Proper interface
interface StudentLesson {
  studentId: string;
  lessonId: string;
  enrollmentDate: Date;
}

// ❌ BAD - Using any
type StudentLesson = any;
```

## Code Formatting

### Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

### Formatting Rules

- Use **single quotes** for strings
- Always use **semicolons**
- **Trailing commas** in objects and arrays
- **2 spaces** for indentation (no tabs)
- **100 character** max line length

## File Organization

### Project Structure

```
MNM/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── middleware/
│   │   │   ├── utils/
│   │   │   └── types/
│   │   └── prisma/
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── hooks/
│       │   ├── api/
│       │   └── utils/
│       └── public/
└── Planning/
```

### File Naming

- **Components:** PascalCase (`LessonCard.tsx`)
- **Utilities:** camelCase (`dateUtils.ts`)
- **Types:** camelCase (`lesson.types.ts`)
- **Constants:** camelCase (`apiConstants.ts`)
- **Pages:** camelCase (`dashboard.tsx`)

## Naming Conventions

### Variables and Functions

```typescript
// ✅ GOOD - Descriptive names
const activeStudents = students.filter(s => s.status === 'ACTIVE');
const calculateLessonDuration = (startTime: Date, endTime: Date) => {};

// ❌ BAD - Unclear names
const arr = students.filter(s => s.status === 'ACTIVE');
const calc = (start: Date, end: Date) => {};
```

### Boolean Variables

Prefix with `is`, `has`, `can`, or `should`:

```typescript
const isAuthenticated = true;
const hasPermission = false;
const canEdit = user.role === 'ADMIN';
const shouldShowWarning = credits < 5;
```

### Constants

Use SCREAMING_SNAKE_CASE:

```typescript
const MAX_UPLOAD_SIZE = 5242880; // 5MB
const API_BASE_URL = 'https://api.musicnme.com';
const DEFAULT_PAGE_SIZE = 20;
```

## Component Guidelines

### React Component Structure

```typescript
// 1. Imports
import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography } from '@mui/material';

// 2. Types
interface LessonCardProps {
  lesson: Lesson;
  onEdit?: (id: string) => void;
  className?: string;
}

// 3. Component
export const LessonCard: React.FC<LessonCardProps> = ({
  lesson,
  onEdit,
  className
}) => {
  // 4. State
  const [isExpanded, setIsExpanded] = useState(false);

  // 5. Effects
  useEffect(() => {
    // Component effects
  }, []);

  // 6. Event handlers
  const handleEdit = () => {
    onEdit?.(lesson.id);
  };

  // 7. Early returns
  if (!lesson) {
    return <div>Loading...</div>;
  }

  // 8. Render
  return (
    <Card className={className}>
      <CardContent>
        <Typography variant="h6">{lesson.title}</Typography>
      </CardContent>
    </Card>
  );
};
```

### Material-UI Best Practices

```typescript
import { styled } from '@mui/material/styles';
import { Card } from '@mui/material';

// Use styled components for custom styling
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}));

// Follow Music 'n Me brand colors
const theme = createTheme({
  palette: {
    primary: {
      main: '#4580E4', // Blue
    },
    secondary: {
      main: '#FFCE00', // Yellow
    },
    background: {
      paper: '#FCF6E6', // Cream
    },
  },
  typography: {
    fontFamily: 'Avenir, Roboto, sans-serif',
    h1: { fontFamily: '"Monkey Mayhem", cursive' },
    h2: { fontFamily: '"Monkey Mayhem", cursive' },
    h3: { fontFamily: '"Monkey Mayhem", cursive' },
  },
});
```

## Multi-Tenancy Patterns (CRITICAL)

### Database Query Pattern

**EVERY query MUST filter by schoolId:**

```typescript
// ✅ CORRECT - Always include schoolId
const lessons = await prisma.lesson.findMany({
  where: {
    schoolId: req.user.schoolId,
    type: 'HYBRID'
  }
});

// ✅ CORRECT - Nested relation with schoolId
const bookings = await prisma.booking.findMany({
  where: {
    lesson: {
      schoolId: req.user.schoolId
    },
    date: today
  }
});

// ❌ WRONG - Missing schoolId (SECURITY VULNERABILITY!)
const lessons = await prisma.lesson.findMany({
  where: { type: 'HYBRID' }
});
```

### API Endpoint Pattern

```typescript
// ✅ CORRECT - Validates school context
router.get('/lessons/:id', authenticate, async (req, res) => {
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: req.params.id,
      schoolId: req.user.schoolId // CRITICAL!
    }
  });

  if (!lesson) {
    return res.status(404).json({ error: 'Lesson not found' });
  }

  res.json(lesson);
});

// ❌ WRONG - No schoolId check
router.get('/lessons/:id', authenticate, async (req, res) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: req.params.id }
  });
  res.json(lesson); // Could leak data from other schools!
});
```

### Authorization Pattern

```typescript
// ✅ CORRECT - Verify ownership before update/delete
async function updateLesson(id: string, data: any, user: AuthUser) {
  // First verify lesson belongs to user's school
  const lesson = await prisma.lesson.findFirst({
    where: {
      id,
      schoolId: user.schoolId
    }
  });

  if (!lesson) {
    throw new Error('Lesson not found or access denied');
  }

  // Now safe to update
  return await prisma.lesson.update({
    where: { id },
    data
  });
}
```

## Error Handling

### Custom Error Classes

```typescript
// Base error
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Specific errors
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}
```

### Error Handling Pattern

```typescript
// ✅ GOOD - Specific error handling
try {
  const data = await createLesson(input);
  return data;
} catch (error) {
  if (error instanceof ValidationError) {
    return res.status(400).json({ error: error.message });
  }
  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Lesson already exists' });
    }
  }
  console.error('Unexpected error:', error);
  return res.status(500).json({ error: 'Internal server error' });
}

// ❌ BAD - Generic error handling
try {
  const data = await createLesson(input);
  return data;
} catch (error) {
  console.log(error); // Never use console.log in production!
  return res.status(500).json({ error: 'Something went wrong' });
}
```

## Testing Standards

### Unit Test Pattern

```typescript
describe('LessonService', () => {
  describe('createLesson', () => {
    it('should create lesson with schoolId', async () => {
      const data = {
        title: 'Piano Basics',
        type: 'INDIVIDUAL',
        schoolId: 'school-123'
      };

      const result = await createLesson(data);

      expect(result.id).toBeDefined();
      expect(result.schoolId).toBe('school-123');
    });

    it('should throw error if schoolId missing', async () => {
      const data = {
        title: 'Piano Basics',
        type: 'INDIVIDUAL'
      };

      await expect(createLesson(data)).rejects.toThrow('schoolId is required');
    });
  });
});
```

### Multi-Tenancy Test Pattern

```typescript
describe('Multi-Tenancy Security', () => {
  it('should not allow cross-school data access', async () => {
    const schoolA = await createTestSchool();
    const schoolB = await createTestSchool();
    const lessonA = await createTestLesson({ schoolId: schoolA.id });

    const userB = { schoolId: schoolB.id };

    await expect(
      getLesson(lessonA.id, userB)
    ).rejects.toThrow('not found');
  });
});
```

## Comments and Documentation

### JSDoc for Complex Functions

```typescript
/**
 * Calculates available time slots for hybrid lesson booking
 *
 * @param lessonId - The hybrid lesson ID
 * @param weekNumber - Week number in the term (1-based)
 * @param teacherId - Teacher's ID
 * @returns Array of available time slots
 *
 * @throws {ValidationError} If week is not an individual week
 * @throws {NotFoundError} If lesson not found
 */
async function getAvailableSlots(
  lessonId: string,
  weekNumber: number,
  teacherId: string
): Promise<TimeSlot[]> {
  // Implementation
}
```

### Inline Comments

```typescript
// Only comment when the code is not self-explanatory

// ✅ GOOD - Explains WHY
// Calculate cutoff time as 24 hours before lesson start
const cutoffTime = subHours(lesson.startTime, 24);

// ❌ BAD - States the obvious
// Add 24 hours to the current time
const cutoffTime = subHours(lesson.startTime, 24);
```

## Git Commit Messages

### Format

```
type(scope): description

body (optional)

footer (optional)
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Build/tooling

### Examples

```
feat(booking): implement hybrid lesson booking calendar

- Add calendar component with week patterns
- Implement parent booking interface
- Add 24-hour rescheduling rule
- Include multi-tenancy security

Closes #42
```

## Code Review Checklist

Before submitting PR:

- [ ] TypeScript strict mode compliance
- [ ] All tests passing
- [ ] Multi-tenancy security verified (schoolId in all queries)
- [ ] Material-UI patterns followed
- [ ] Brand colors used correctly
- [ ] Mobile responsive
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] No console.log statements
- [ ] Comments only where necessary

## Success Criteria

Code meets standards when:
- ✅ No TypeScript errors
- ✅ All tests passing
- ✅ Multi-tenancy security enforced
- ✅ Follows naming conventions
- ✅ Proper error handling
- ✅ Documented when necessary
- ✅ Reviewed and approved

---

**Remember:** These standards exist to make our codebase maintainable and our product secure. The most critical standard is **multi-tenancy security** - never skip schoolId filtering!
