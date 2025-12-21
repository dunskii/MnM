// ===========================================
// Routes - Central Export
// ===========================================

import { Router } from 'express';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import teachersRoutes from './teachers.routes';
import parentsRoutes from './parents.routes';
import studentsRoutes from './students.routes';
import familiesRoutes from './families.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/teachers', teachersRoutes);
router.use('/parents', parentsRoutes);
router.use('/students', studentsRoutes);
router.use('/families', familiesRoutes);

// Future routes will be added here:
// router.use('/lessons', lessonRoutes);
// router.use('/attendance', attendanceRoutes);
// router.use('/invoices', invoiceRoutes);
// router.use('/meet-and-greet', meetAndGreetRoutes);

export default router;
