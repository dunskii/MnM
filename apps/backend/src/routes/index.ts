// ===========================================
// Routes - Central Export
// ===========================================

import { Router } from 'express';
import { csrfProtection } from '../middleware/csrf';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import teachersRoutes from './teachers.routes';
import parentsRoutes from './parents.routes';
import studentsRoutes from './students.routes';
import familiesRoutes from './families.routes';
import lessonsRoutes from './lessons.routes';
import hybridBookingRoutes from './hybridBooking.routes';
import calendarRoutes from './calendar.routes';
import meetAndGreetRoutes from './meetAndGreet.routes';
import paymentRoutes from './payment.routes';
import registrationRoutes from './registration.routes';
import attendanceRoutes from './attendance.routes';
import notesRoutes from './notes.routes';
import resourcesRoutes from './resources.routes';

const router = Router();

// ===========================================
// Public Routes (No CSRF for initial access)
// ===========================================

// Auth routes - login doesn't need CSRF (uses credentials)
router.use('/auth', authRoutes);

// Meet & Greet routes (public booking + admin endpoints)
// Public endpoints don't need CSRF, admin endpoints get it via middleware below
router.use('/', meetAndGreetRoutes);

// Payment routes (webhook doesn't need CSRF - verified by Stripe signature)
router.use('/payments', paymentRoutes);

// Registration routes (public completion endpoint)
router.use('/registration', registrationRoutes);

// ===========================================
// Protected Routes (With CSRF Protection)
// ===========================================

// Apply CSRF protection to all state-changing admin routes
router.use('/admin', csrfProtection, adminRoutes);
router.use('/teachers', csrfProtection, teachersRoutes);
router.use('/parents', csrfProtection, parentsRoutes);
router.use('/students', csrfProtection, studentsRoutes);
router.use('/families', csrfProtection, familiesRoutes);
router.use('/lessons', csrfProtection, lessonsRoutes);
router.use('/hybrid-bookings', csrfProtection, hybridBookingRoutes);
router.use('/calendar', csrfProtection, calendarRoutes);
router.use('/attendance', csrfProtection, attendanceRoutes);
router.use('/notes', csrfProtection, notesRoutes);
router.use('/resources', csrfProtection, resourcesRoutes);

// Future routes will be added here:
// router.use('/invoices', invoiceRoutes);

export default router;
