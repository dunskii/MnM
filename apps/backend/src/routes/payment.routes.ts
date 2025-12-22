// ===========================================
// Payment Routes
// ===========================================
// Handles Stripe payment endpoints

import { Router, Request, Response, raw } from 'express';
import { stripeService } from '../services/stripe.service';
import { authenticate, authorize, AppError, paymentRateLimiter } from '../middleware';

const router = Router();

// ===========================================
// PUBLIC ENDPOINTS (For payment flow)
// ===========================================

/**
 * Get Stripe publishable key
 * GET /api/v1/payments/config
 */
router.get('/config', (_req: Request, res: Response): void => {
  const publishableKey = stripeService.getPublishableKey();

  res.json({
    status: 'success',
    data: { publishableKey },
  });
});

/**
 * Create checkout session for registration payment
 * POST /api/v1/payments/checkout/registration
 * Rate limited: 10 requests per minute per IP
 */
router.post(
  '/checkout/registration',
  paymentRateLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { meetAndGreetId, schoolId, successUrl, cancelUrl } = req.body;

      if (!meetAndGreetId || !schoolId || !successUrl || !cancelUrl) {
        throw new AppError('Missing required fields', 400);
      }

      const session = await stripeService.createCheckoutSession({
        meetAndGreetId,
        schoolId,
        successUrl,
        cancelUrl,
      });

      res.json({
        status: 'success',
        data: session,
      });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({
          status: 'error',
          message: err.message,
        });
        return;
      }
      console.error('Checkout session error:', err);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create checkout session',
      });
    }
  }
);

/**
 * Verify completed checkout session
 * GET /api/v1/payments/checkout/verify/:sessionId
 */
router.get(
  '/checkout/verify/:sessionId',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        throw new AppError('Session ID required', 400);
      }

      const result = await stripeService.verifyCheckoutSession(sessionId);

      res.json({
        status: 'success',
        data: result,
      });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({
          status: 'error',
          message: err.message,
        });
        return;
      }
      console.error('Verify session error:', err);
      res.status(500).json({
        status: 'error',
        message: 'Failed to verify session',
      });
    }
  }
);

/**
 * Stripe webhook handler
 * POST /api/v1/payments/webhook
 *
 * Note: This route needs raw body for signature verification.
 * Configure this in the main app.ts before body-parser.
 */
router.post(
  '/webhook',
  raw({ type: 'application/json' }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const signature = req.headers['stripe-signature'] as string;

      if (!signature) {
        res.status(400).json({
          status: 'error',
          message: 'No signature header',
        });
        return;
      }

      const result = await stripeService.handleWebhookEvent(
        req.body as Buffer,
        signature
      );

      res.json({ received: true, type: result.type });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({
          status: 'error',
          message: err.message,
        });
        return;
      }
      console.error('Webhook error:', err);
      res.status(500).json({
        status: 'error',
        message: 'Webhook processing failed',
      });
    }
  }
);

// ===========================================
// ADMIN ENDPOINTS
// ===========================================

/**
 * Get Stripe Connect onboarding link for school
 * POST /api/v1/payments/admin/connect/onboard
 */
router.post(
  '/admin/connect/onboard',
  authenticate,
  authorize('ADMIN'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const schoolId = req.user!.schoolId;
      const { refreshUrl, returnUrl } = req.body;

      if (!refreshUrl || !returnUrl) {
        throw new AppError('Missing required URLs', 400);
      }

      const url = await stripeService.createConnectOnboardingLink(
        schoolId,
        refreshUrl,
        returnUrl
      );

      res.json({
        status: 'success',
        data: { url },
      });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({
          status: 'error',
          message: err.message,
        });
        return;
      }
      console.error('Connect onboard error:', err);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create onboarding link',
      });
    }
  }
);

/**
 * Get Stripe Connect account status
 * GET /api/v1/payments/admin/connect/status
 */
router.get(
  '/admin/connect/status',
  authenticate,
  authorize('ADMIN'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const schoolId = req.user!.schoolId;

      const status = await stripeService.checkConnectAccountStatus(schoolId);

      res.json({
        status: 'success',
        data: status,
      });
    } catch (err: unknown) {
      console.error('Connect status error:', err);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get account status',
      });
    }
  }
);

export default router;
