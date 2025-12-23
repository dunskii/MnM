// ===========================================
// Stripe Payment Service
// ===========================================
// Handles Stripe payment processing for registrations

import Stripe from 'stripe';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { config } from '../config';

// ===========================================
// CONSTANTS
// ===========================================

const STRIPE_CONSTANTS = {
  PLATFORM_FEE_PERCENT: 0.05, // 5% platform fee
  DEFAULT_REGISTRATION_FEE_CENTS: 5000, // $50.00 in cents
  CURRENCY: 'aud' as const,
} as const;

// ===========================================
// ENVIRONMENT VALIDATION
// ===========================================

const STRIPE_CONFIGURED = Boolean(config.stripe.secretKey);

function validateStripeConfig(): void {
  if (config.env === 'production') {
    if (!config.stripe.secretKey) {
      throw new Error('CRITICAL: STRIPE_SECRET_KEY is required in production');
    }
    if (!config.stripe.webhookSecret) {
      throw new Error('CRITICAL: STRIPE_WEBHOOK_SECRET is required in production');
    }
    if (!config.stripe.publishableKey) {
      throw new Error('CRITICAL: STRIPE_PUBLISHABLE_KEY is required in production');
    }
  } else if (!STRIPE_CONFIGURED) {
    console.warn('⚠️  Stripe API key not configured - payment features will not work');
  }
}

// Validate on module load
validateStripeConfig();

// Initialize Stripe with secret key (or placeholder for dev without keys)
// API version is determined by the installed stripe package
const stripe = STRIPE_CONFIGURED
  ? new Stripe(config.stripe.secretKey!)
  : null;

// ===========================================
// TYPES
// ===========================================

interface CreateCheckoutSessionParams {
  meetAndGreetId: string;
  schoolId: string;
  successUrl: string;
  cancelUrl: string;
}

interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}


// ===========================================
// SERVICE FUNCTIONS
// ===========================================

/**
 * Check if Stripe is configured and available
 */
export function isStripeConfigured(): boolean {
  return STRIPE_CONFIGURED && stripe !== null;
}

/**
 * Throw error if Stripe is not configured
 */
function requireStripe(): Stripe {
  if (!stripe) {
    throw new AppError(
      'Payment processing is not configured. Please contact the administrator.',
      503
    );
  }
  return stripe;
}

/**
 * Create a Stripe Checkout session for registration payment
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<CheckoutSessionResult> {
  const stripeClient = requireStripe();
  const { meetAndGreetId, schoolId, successUrl, cancelUrl } = params;

  // Verify meet & greet exists and is approved
  const meetAndGreet = await prisma.meetAndGreet.findFirst({
    where: {
      id: meetAndGreetId,
      schoolId,
      status: 'APPROVED',
    },
    include: {
      school: true,
      instrument: true,
    },
  });

  if (!meetAndGreet) {
    throw new AppError('Invalid or unapproved booking', 400);
  }

  // Check for existing completed payment to prevent duplicates
  const existingPayment = await prisma.registrationPayment.findFirst({
    where: {
      meetAndGreetId,
      status: 'COMPLETED',
    },
  });

  if (existingPayment) {
    throw new AppError('Payment has already been completed for this registration', 400);
  }

  // Check for existing pending session (within last 30 minutes)
  const recentPendingPayment = await prisma.registrationPayment.findFirst({
    where: {
      meetAndGreetId,
      status: 'PENDING',
      createdAt: {
        gte: new Date(Date.now() - 30 * 60 * 1000), // Last 30 minutes
      },
    },
  });

  if (recentPendingPayment && recentPendingPayment.stripeSessionId) {
    // Return existing session if still valid
    try {
      const existingSession = await stripeClient.checkout.sessions.retrieve(
        recentPendingPayment.stripeSessionId
      );
      if (existingSession.status === 'open' && existingSession.url) {
        return {
          sessionId: existingSession.id,
          url: existingSession.url,
        };
      }
    } catch {
      // Session expired or invalid, continue to create new one
    }
  }

  // Get the school's Stripe configuration
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: {
      id: true,
      name: true,
      stripeAccountId: true,
      registrationFee: true,
    },
  });

  if (!school) {
    throw new AppError('School not found', 404);
  }

  // Get registration fee from school settings (default to $50)
  const registrationFee = school.registrationFee
    ? Math.round(Number(school.registrationFee) * 100) // Convert dollars to cents
    : STRIPE_CONSTANTS.DEFAULT_REGISTRATION_FEE_CENTS;

  // Create the checkout session
  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: STRIPE_CONSTANTS.CURRENCY,
          product_data: {
            name: `Registration Fee - ${school.name}`,
            description: `Registration for ${meetAndGreet.studentFirstName} ${meetAndGreet.studentLastName}`,
            metadata: {
              type: 'registration',
              meetAndGreetId: meetAndGreet.id,
              studentName: `${meetAndGreet.studentFirstName} ${meetAndGreet.studentLastName}`,
            },
          },
          unit_amount: registrationFee,
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: 'registration',
      meetAndGreetId: meetAndGreet.id,
      schoolId: school.id,
    },
    customer_email: meetAndGreet.contact1Email,
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
  };

  // If school has a connected Stripe account, use it
  if (school.stripeAccountId) {
    sessionConfig.payment_intent_data = {
      application_fee_amount: Math.round(registrationFee * STRIPE_CONSTANTS.PLATFORM_FEE_PERCENT),
      transfer_data: {
        destination: school.stripeAccountId,
      },
    };
  }

  // Generate idempotency key for this checkout attempt
  const idempotencyKey = `checkout_${meetAndGreetId}_${Date.now()}`;

  const session = await stripeClient.checkout.sessions.create(sessionConfig, {
    idempotencyKey,
  });

  if (!session.url) {
    throw new AppError('Failed to create checkout session', 500);
  }

  // Create pending payment record to track this session
  await prisma.registrationPayment.create({
    data: {
      schoolId,
      meetAndGreetId,
      amount: registrationFee / 100, // Convert cents to dollars
      currency: STRIPE_CONSTANTS.CURRENCY.toUpperCase(),
      status: 'PENDING',
      paymentMethod: 'STRIPE',
      stripeSessionId: session.id,
      description: `Registration payment - ${meetAndGreet.contact1Email}`,
      metadata: {
        type: 'registration',
        idempotencyKey,
      },
    },
  });

  return {
    sessionId: session.id,
    url: session.url,
  };
}

/**
 * Verify a completed checkout session
 */
export async function verifyCheckoutSession(
  sessionId: string
): Promise<{ meetAndGreetId: string; paymentIntentId: string; amount: number }> {
  const stripeClient = requireStripe();
  const session = await stripeClient.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== 'paid') {
    throw new AppError('Payment not completed', 400);
  }

  const meetAndGreetId = session.metadata?.meetAndGreetId;
  if (!meetAndGreetId) {
    throw new AppError('Invalid session metadata', 400);
  }

  return {
    meetAndGreetId,
    paymentIntentId: session.payment_intent as string,
    amount: session.amount_total || 0,
  };
}

/**
 * Handle Stripe webhook events
 */
export async function handleWebhookEvent(
  rawBody: Buffer,
  signature: string
): Promise<{ received: boolean; type?: string }> {
  const webhookSecret = config.stripe.webhookSecret;

  if (!webhookSecret) {
    throw new AppError('Webhook secret not configured', 500);
  }

  const stripeClient = requireStripe();
  let event: Stripe.Event;

  try {
    event = stripeClient.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    throw new AppError(`Webhook signature verification failed`, 400);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutComplete(session);
      break;
    }
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`Payment succeeded: ${paymentIntent.id}`);
      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`Payment failed: ${paymentIntent.id}`);
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return { received: true, type: event.type };
}

/**
 * Handle completed checkout session
 */
async function handleCheckoutComplete(
  session: Stripe.Checkout.Session
): Promise<void> {
  const meetAndGreetId = session.metadata?.meetAndGreetId;
  const schoolId = session.metadata?.schoolId;

  if (!meetAndGreetId || !schoolId) {
    console.error('[Stripe Webhook] Missing metadata in checkout session:', session.id);
    return;
  }

  // Check if already processed by payment intent
  const existingCompleted = await prisma.registrationPayment.findFirst({
    where: {
      stripePaymentIntentId: session.payment_intent as string,
      status: 'COMPLETED',
    },
  });

  if (existingCompleted) {
    console.log('[Stripe Webhook] Payment already processed:', session.payment_intent);
    return;
  }

  // Try to find and update existing pending payment record
  const existingPending = await prisma.registrationPayment.findFirst({
    where: { stripeSessionId: session.id },
  });

  if (existingPending) {
    // Update existing pending payment to completed
    await prisma.registrationPayment.update({
      where: { id: existingPending.id },
      data: {
        status: 'COMPLETED',
        stripePaymentIntentId: session.payment_intent as string,
        paidAt: new Date(),
        metadata: {
          ...(existingPending.metadata as object || {}),
          customerEmail: session.customer_email,
          completedAt: new Date().toISOString(),
        },
      },
    });
    console.log('[Stripe Webhook] Updated pending payment to completed:', session.id);
  } else {
    // Create new payment record if pending one doesn't exist (fallback)
    await prisma.registrationPayment.create({
      data: {
        schoolId,
        meetAndGreetId,
        amount: (session.amount_total || 0) / 100, // Convert from cents
        currency: session.currency?.toUpperCase() || 'AUD',
        status: 'COMPLETED',
        paymentMethod: 'STRIPE',
        stripePaymentIntentId: session.payment_intent as string,
        stripeSessionId: session.id,
        description: `Registration payment - ${session.customer_email}`,
        paidAt: new Date(),
        metadata: {
          type: 'registration',
          customerEmail: session.customer_email,
        },
      },
    });
    console.log('[Stripe Webhook] Created new payment record:', session.id);
  }

  // Update meet & greet stripeSessionId for tracking
  await prisma.meetAndGreet.update({
    where: { id: meetAndGreetId },
    data: { stripeSessionId: session.id },
  });

  console.log(`[Stripe Webhook] Registration payment received for meet & greet: ${meetAndGreetId}`);
}

/**
 * Get Stripe publishable key for frontend
 */
export function getPublishableKey(): string {
  return config.stripe.publishableKey;
}

/**
 * Create a Stripe Connect onboarding link for a school
 */
export async function createConnectOnboardingLink(
  schoolId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<string> {
  const stripeClient = requireStripe();
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
  });

  if (!school) {
    throw new AppError('School not found', 404);
  }

  let accountId = school.stripeAccountId;

  // Create a connected account if one doesn't exist
  if (!accountId) {
    const account = await stripeClient.accounts.create({
      type: 'standard',
      country: 'AU',
      email: school.email || undefined,
      business_type: 'company',
      company: {
        name: school.name,
      },
      metadata: {
        schoolId: school.id,
      },
    });

    accountId = account.id;

    // Save the account ID to the school
    await prisma.school.update({
      where: { id: schoolId },
      data: { stripeAccountId: accountId },
    });
  }

  // Create the onboarding link
  const accountLink = await stripeClient.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });

  return accountLink.url;
}

/**
 * Check if a school's Stripe account is fully set up
 */
export async function checkConnectAccountStatus(
  schoolId: string
): Promise<{ connected: boolean; chargesEnabled: boolean; payoutsEnabled: boolean }> {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { stripeAccountId: true },
  });

  if (!school?.stripeAccountId) {
    return { connected: false, chargesEnabled: false, payoutsEnabled: false };
  }

  const stripeClient = requireStripe();
  const account = await stripeClient.accounts.retrieve(school.stripeAccountId);

  return {
    connected: true,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
  };
}

// Export all functions as a service object
export const stripeService = {
  isStripeConfigured,
  createCheckoutSession,
  verifyCheckoutSession,
  handleWebhookEvent,
  getPublishableKey,
  createConnectOnboardingLink,
  checkConnectAccountStatus,
};
