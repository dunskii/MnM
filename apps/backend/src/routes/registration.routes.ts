// ===========================================
// Registration Routes
// ===========================================
// Handles the registration flow after payment

import { Router, Request, Response } from 'express';
import { registrationService } from '../services/registration.service';
import { stripeService } from '../services/stripe.service';
import { AppError } from '../middleware';

const router = Router();

// ===========================================
// PUBLIC ENDPOINTS (For registration flow)
// ===========================================

/**
 * Complete registration after payment
 * POST /api/v1/registration/complete
 *
 * Called after Stripe checkout redirects to success URL
 */
router.post(
  '/complete',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.body;

      if (!sessionId) {
        throw new AppError('Session ID is required', 400);
      }

      // Verify the checkout session
      const sessionData = await stripeService.verifyCheckoutSession(sessionId);

      // Complete registration
      const result = await registrationService.completeRegistration({
        meetAndGreetId: sessionData.meetAndGreetId,
        stripeSessionId: sessionId,
      });

      res.json({
        status: 'success',
        message: 'Registration completed successfully! Check your email for login details.',
        data: {
          familyId: result.familyId,
          studentId: result.studentId,
        },
      });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({
          status: 'error',
          message: err.message,
        });
        return;
      }
      console.error('Registration error:', err);
      res.status(500).json({
        status: 'error',
        message: 'Failed to complete registration',
      });
    }
  }
);

/**
 * Get registration status
 * GET /api/v1/registration/status/:meetAndGreetId
 */
router.get(
  '/status/:meetAndGreetId',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { meetAndGreetId } = req.params;
      const { schoolId } = req.query;

      if (!meetAndGreetId || !schoolId) {
        throw new AppError('Meeting ID and School ID are required', 400);
      }

      const status = await registrationService.getRegistrationStatus(
        meetAndGreetId,
        schoolId as string
      );

      res.json({
        status: 'success',
        data: status,
      });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({
          status: 'error',
          message: err.message,
        });
        return;
      }
      console.error('Get status error:', err);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get registration status',
      });
    }
  }
);

export default router;
