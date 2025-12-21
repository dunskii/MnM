// ===========================================
// Routes - Central Export
// ===========================================

import { Router } from 'express';
import authRoutes from './auth.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);

// Future routes will be added here:
// router.use('/users', userRoutes);
// router.use('/schools', schoolRoutes);
// router.use('/lessons', lessonRoutes);
// router.use('/students', studentRoutes);
// router.use('/attendance', attendanceRoutes);
// router.use('/invoices', invoiceRoutes);
// router.use('/meet-and-greet', meetAndGreetRoutes);

export default router;
