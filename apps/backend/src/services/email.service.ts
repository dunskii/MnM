// ===========================================
// Email Service (SendGrid)
// ===========================================
// Handles all email sending with brand-compliant templates
// Brand colors: Primary #4580E4, Secondary #FFCE00, Accent #96DAC9

import sgMail from '@sendgrid/mail';
import { config } from '../config';

// ===========================================
// INITIALIZATION
// ===========================================

// Initialize SendGrid with API key
if (config.sendgrid.apiKey) {
  sgMail.setApiKey(config.sendgrid.apiKey);
} else {
  console.warn('SendGrid API key not configured - emails will not be sent');
}

// ===========================================
// TYPES
// ===========================================

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface MeetAndGreetVerificationData {
  parentName: string;
  childName: string;
  preferredDateTime: string;
  verificationUrl: string;
}

interface MeetAndGreetConfirmationData {
  parentName: string;
  childName: string;
  scheduledDateTime: string;
  locationName: string;
  teacherName: string;
}

interface MeetAndGreetAdminNotificationData {
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  childName: string;
  childAge: number;
  instrumentInterest: string;
  preferredDateTime: string;
  dashboardUrl: string;
}

interface MeetAndGreetApprovalData {
  parentName: string;
  childName: string;
  registrationUrl: string;
  expiryDate: string;
  schoolName: string;
}

interface MeetAndGreetRejectionData {
  parentName: string;
  childName: string;
  reason: string;
}

interface WelcomeEmailData {
  parentName: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
  schoolName: string;
}

interface PaymentReceiptData {
  parentName: string;
  amount: string;
  description: string;
  receiptNumber: string;
  paymentDate: string;
}

// Error type for SendGrid API errors
interface SendGridError extends Error {
  code?: number;
  response?: {
    body?: unknown;
  };
}

// ===========================================
// BASE TEMPLATE
// ===========================================

/**
 * Generate the base HTML email template with Music 'n Me branding
 */
function baseTemplate(content: string, preheader?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Music 'n Me</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #FCF6E6; font-family: 'Avenir', 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>` : ''}

  <!-- Main Container -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FCF6E6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">

        <!-- Email Card -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 12px; max-width: 600px;">

          <!-- Header with Logo -->
          <tr>
            <td align="center" style="padding: 30px 40px 20px; background-color: #4580E4; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-family: 'Comic Sans MS', cursive, sans-serif; font-size: 28px; color: #ffffff; font-weight: bold;">
                Music 'n Me
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px 40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 30px; border-top: 1px solid #e0e0e0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="text-align: center; color: #9DA5AF; font-size: 12px; line-height: 1.5;">
                    <p style="margin: 0 0 10px;">
                      Music 'n Me - Where Every Note Matters
                    </p>
                    <p style="margin: 0;">
                      <a href="${config.frontendUrl}" style="color: #4580E4; text-decoration: none;">Visit our website</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate a styled CTA button
 */
function ctaButton(text: string, url: string, color: string = '#4580E4'): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 25px auto;">
      <tr>
        <td style="border-radius: 8px; background-color: ${color};">
          <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 30px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

// ===========================================
// SEND EMAIL FUNCTION
// ===========================================

/**
 * Send an email via SendGrid
 * Implements retry logic and graceful error handling
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // Skip if SendGrid not configured
  if (!config.sendgrid.apiKey) {
    console.warn(`Email not sent (no API key): ${options.subject} to ${options.to}`);
    return false;
  }

  const msg = {
    to: options.to,
    from: {
      email: config.sendgrid.fromEmail,
      name: config.sendgrid.fromName,
    },
    subject: options.subject,
    html: options.html,
    text: options.text || stripHtml(options.html),
  };

  // Retry logic with exponential backoff
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await sgMail.send(msg);
      console.log(`Email sent: "${options.subject}" to ${options.to}`);
      return true;
    } catch (error: unknown) {
      const sendGridError = error as SendGridError;
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Email send attempt ${attempt} failed:`, lastError.message);

      // Don't retry on client errors (4xx) - SendGrid returns error.code for HTTP status
      if (sendGridError.code && sendGridError.code >= 400 && sendGridError.code < 500) {
        break;
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  console.error(`Failed to send email after ${maxRetries} attempts:`, lastError?.message);
  return false;
}

/**
 * Strip HTML tags for plain text version
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ===========================================
// MEET & GREET EMAILS
// ===========================================

/**
 * Send email verification for Meet & Greet booking
 */
export async function sendMeetAndGreetVerification(
  to: string,
  data: MeetAndGreetVerificationData
): Promise<boolean> {
  const content = `
    <h2 style="margin: 0 0 20px; color: #080808; font-size: 22px; font-weight: 600;">
      Verify Your Meet & Greet Booking
    </h2>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      Hi ${data.parentName},
    </p>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      Thanks for booking a meet & greet for <strong>${data.childName}</strong>!
    </p>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      Please verify your email address to confirm your booking:
    </p>

    ${ctaButton('Verify Email', data.verificationUrl)}

    <div style="background-color: #FCF6E6; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0 0 8px; color: #080808; font-size: 14px;">
        <strong>Booking Details:</strong>
      </p>
      <p style="margin: 0 0 4px; color: #080808; font-size: 14px;">
        Preferred Date/Time: ${data.preferredDateTime}
      </p>
      <p style="margin: 0; color: #080808; font-size: 14px;">
        Duration: 15 minutes
      </p>
    </div>

    <p style="margin: 20px 0 0; color: #9DA5AF; font-size: 13px;">
      This link expires in 24 hours. If you didn't book this, you can safely ignore this email.
    </p>
  `;

  return sendEmail({
    to,
    subject: "Verify Your Meet & Greet Booking - Music 'n Me",
    html: baseTemplate(content, `Verify your email to confirm your meet & greet booking for ${data.childName}`),
  });
}

/**
 * Send booking confirmation after email verification
 */
export async function sendMeetAndGreetConfirmation(
  to: string,
  data: MeetAndGreetConfirmationData
): Promise<boolean> {
  const content = `
    <h2 style="margin: 0 0 20px; color: #080808; font-size: 22px; font-weight: 600;">
      Meet & Greet Confirmed!
    </h2>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      Hi ${data.parentName},
    </p>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      Great news! Your email has been verified and your meet & greet booking for <strong>${data.childName}</strong> is confirmed.
    </p>

    <div style="background-color: #FCF6E6; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0 0 8px; color: #080808; font-size: 14px;">
        <strong>What happens next?</strong>
      </p>
      <ul style="margin: 0; padding-left: 20px; color: #080808; font-size: 14px; line-height: 1.6;">
        <li>Our team will review your booking</li>
        <li>We'll contact you to confirm the date and time</li>
        <li>You'll meet with one of our friendly teachers</li>
      </ul>
    </div>

    <p style="margin: 15px 0 0; color: #080808; font-size: 16px; line-height: 1.6;">
      We're excited to meet ${data.childName} and introduce them to the wonderful world of music!
    </p>
  `;

  return sendEmail({
    to,
    subject: "Meet & Greet Confirmed - Music 'n Me",
    html: baseTemplate(content, `Your meet & greet for ${data.childName} is confirmed!`),
  });
}

/**
 * Notify school admin of new meet & greet booking
 */
export async function sendMeetAndGreetAdminNotification(
  to: string,
  data: MeetAndGreetAdminNotificationData
): Promise<boolean> {
  const content = `
    <h2 style="margin: 0 0 20px; color: #080808; font-size: 22px; font-weight: 600;">
      New Meet & Greet Booking
    </h2>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      A new meet & greet has been submitted and verified:
    </p>

    <div style="background-color: #FCF6E6; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Parent:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;">${data.parentName}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Email:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;">${data.parentEmail}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Phone:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;">${data.parentPhone}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Child:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;">${data.childName} (${data.childAge} years old)</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Instrument:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;">${data.instrumentInterest}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Preferred Time:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;">${data.preferredDateTime}</td>
        </tr>
      </table>
    </div>

    ${ctaButton('View in Dashboard', data.dashboardUrl)}
  `;

  return sendEmail({
    to,
    subject: `New Meet & Greet: ${data.childName} - Music 'n Me`,
    html: baseTemplate(content, `New meet & greet booking from ${data.parentName} for ${data.childName}`),
  });
}

/**
 * Send approval email with registration link
 */
export async function sendMeetAndGreetApproval(
  to: string,
  data: MeetAndGreetApprovalData
): Promise<boolean> {
  const content = `
    <h2 style="margin: 0 0 20px; color: #080808; font-size: 22px; font-weight: 600;">
      Welcome to ${data.schoolName}!
    </h2>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      Hi ${data.parentName},
    </p>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      We're thrilled to welcome <strong>${data.childName}</strong> to our music family! Your meet & greet has been approved.
    </p>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      To complete your registration, please click the button below:
    </p>

    ${ctaButton('Complete Registration', data.registrationUrl, '#FFCE00')}

    <div style="background-color: #FCF6E6; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0 0 8px; color: #080808; font-size: 14px;">
        <strong>Important:</strong>
      </p>
      <p style="margin: 0; color: #080808; font-size: 14px;">
        This registration link expires on <strong>${data.expiryDate}</strong>.
        A one-time registration fee will be charged to complete enrollment.
      </p>
    </div>

    <p style="margin: 15px 0 0; color: #080808; font-size: 16px; line-height: 1.6;">
      We can't wait to start ${data.childName}'s musical journey!
    </p>
  `;

  return sendEmail({
    to,
    subject: `Complete Your Registration - ${data.schoolName}`,
    html: baseTemplate(content, `Your meet & greet for ${data.childName} has been approved! Complete your registration now.`),
  });
}

/**
 * Send rejection email with reason
 */
export async function sendMeetAndGreetRejection(
  to: string,
  data: MeetAndGreetRejectionData
): Promise<boolean> {
  const content = `
    <h2 style="margin: 0 0 20px; color: #080808; font-size: 22px; font-weight: 600;">
      Meet & Greet Update
    </h2>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      Hi ${data.parentName},
    </p>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      Thank you for your interest in Music 'n Me for ${data.childName}. Unfortunately, we're unable to proceed with your meet & greet booking at this time.
    </p>

    <div style="background-color: #FCF6E6; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0 0 8px; color: #080808; font-size: 14px;">
        <strong>Reason:</strong>
      </p>
      <p style="margin: 0; color: #080808; font-size: 14px;">
        ${data.reason}
      </p>
    </div>

    <p style="margin: 15px 0 0; color: #080808; font-size: 16px; line-height: 1.6;">
      If you have any questions, please don't hesitate to contact us.
    </p>
  `;

  return sendEmail({
    to,
    subject: "Meet & Greet Update - Music 'n Me",
    html: baseTemplate(content),
  });
}

// ===========================================
// ACCOUNT EMAILS
// ===========================================

/**
 * Send welcome email with login credentials
 */
export async function sendWelcomeEmail(
  to: string,
  data: WelcomeEmailData
): Promise<boolean> {
  const content = `
    <h2 style="margin: 0 0 20px; color: #080808; font-size: 22px; font-weight: 600;">
      Welcome to ${data.schoolName}!
    </h2>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      Hi ${data.parentName},
    </p>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      Your account has been created. You can now access the parent portal to view schedules, make payments, and more.
    </p>

    <div style="background-color: #FCF6E6; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0 0 8px; color: #080808; font-size: 14px;">
        <strong>Your Login Details:</strong>
      </p>
      <p style="margin: 0 0 4px; color: #080808; font-size: 14px;">
        Email: <strong>${data.email}</strong>
      </p>
      <p style="margin: 0; color: #080808; font-size: 14px;">
        Temporary Password: <strong>${data.tempPassword}</strong>
      </p>
    </div>

    ${ctaButton('Log In Now', data.loginUrl)}

    <p style="margin: 20px 0 0; color: #9DA5AF; font-size: 13px;">
      For security, please change your password after your first login.
    </p>
  `;

  return sendEmail({
    to,
    subject: `Welcome to ${data.schoolName} - Your Account is Ready`,
    html: baseTemplate(content, `Your account at ${data.schoolName} is ready! Log in now to get started.`),
  });
}

/**
 * Send payment receipt
 */
export async function sendPaymentReceipt(
  to: string,
  data: PaymentReceiptData
): Promise<boolean> {
  const content = `
    <h2 style="margin: 0 0 20px; color: #080808; font-size: 22px; font-weight: 600;">
      Payment Receipt
    </h2>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      Hi ${data.parentName},
    </p>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      Thank you for your payment. Here are the details:
    </p>

    <div style="background-color: #FCF6E6; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Receipt #:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px; text-align: right;">${data.receiptNumber}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Date:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px; text-align: right;">${data.paymentDate}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Description:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px; text-align: right;">${data.description}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0 0; color: #080808; font-size: 16px; border-top: 1px solid #e0e0e0;"><strong>Amount Paid:</strong></td>
          <td style="padding: 8px 0 0; color: #4580E4; font-size: 18px; font-weight: 600; text-align: right; border-top: 1px solid #e0e0e0;">${data.amount}</td>
        </tr>
      </table>
    </div>

    <p style="margin: 15px 0 0; color: #9DA5AF; font-size: 13px;">
      Please keep this email for your records.
    </p>
  `;

  return sendEmail({
    to,
    subject: "Payment Receipt - Music 'n Me",
    html: baseTemplate(content, `Your payment of ${data.amount} has been received. Receipt #${data.receiptNumber}`),
  });
}

// ===========================================
// INVOICE EMAILS
// ===========================================

interface InvoiceEmailData {
  parentName: string;
  schoolName: string;
  invoiceNumber: string;
  total: number;
  dueDate: Date;
  description: string;
}

interface PaymentReceiptEmailData {
  parentName: string;
  schoolName: string;
  invoiceNumber: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  remainingBalance: number;
}

interface PaymentReminderData {
  parentName: string;
  schoolName: string;
  invoiceNumber: string;
  total: number;
  amountDue: number;
  dueDate: Date;
  paymentUrl: string;
}

/**
 * Send invoice notification to parent
 */
export async function sendInvoiceEmail(
  to: string,
  data: InvoiceEmailData
): Promise<boolean> {
  const formattedTotal = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(data.total);

  const formattedDueDate = new Intl.DateTimeFormat('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(data.dueDate));

  const content = `
    <h2 style="margin: 0 0 20px; color: #080808; font-size: 22px; font-weight: 600;">
      New Invoice from ${data.schoolName}
    </h2>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      Hi ${data.parentName},
    </p>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      A new invoice has been created for your account. Here are the details:
    </p>

    <div style="background-color: #FCF6E6; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Invoice #:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px; text-align: right;">${data.invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Description:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px; text-align: right;">${data.description}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Due Date:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px; text-align: right;">${formattedDueDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0 0; color: #080808; font-size: 16px; border-top: 1px solid #e0e0e0;"><strong>Total Amount:</strong></td>
          <td style="padding: 8px 0 0; color: #4580E4; font-size: 18px; font-weight: 600; text-align: right; border-top: 1px solid #e0e0e0;">${formattedTotal}</td>
        </tr>
      </table>
    </div>

    ${ctaButton('View & Pay Invoice', `${config.frontendUrl}/parent/invoices`)}

    <p style="margin: 20px 0 0; color: #9DA5AF; font-size: 13px;">
      Please pay by the due date to avoid any late fees. If you have any questions, please contact us.
    </p>
  `;

  return sendEmail({
    to,
    subject: `New Invoice ${data.invoiceNumber} - ${data.schoolName}`,
    html: baseTemplate(content, `New invoice ${data.invoiceNumber} for ${formattedTotal} due ${formattedDueDate}`),
  });
}

/**
 * Send payment receipt for invoice payment
 */
export async function sendPaymentReceiptEmail(
  to: string,
  data: PaymentReceiptEmailData
): Promise<boolean> {
  const formattedAmount = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(data.amount);

  const formattedBalance = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(data.remainingBalance);

  const paymentMethodDisplay = {
    STRIPE: 'Credit Card',
    BANK_TRANSFER: 'Bank Transfer',
    CASH: 'Cash',
    CHECK: 'Cheque',
    OTHER: 'Other',
  }[data.paymentMethod] || data.paymentMethod;

  const content = `
    <h2 style="margin: 0 0 20px; color: #080808; font-size: 22px; font-weight: 600;">
      Payment Received - Thank You!
    </h2>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      Hi ${data.parentName},
    </p>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      We've received your payment. Thank you!
    </p>

    <div style="background-color: #FCF6E6; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Invoice #:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px; text-align: right;">${data.invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Payment Method:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px; text-align: right;">${paymentMethodDisplay}</td>
        </tr>
        ${data.reference ? `
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Reference:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px; text-align: right;">${data.reference}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px 0 0; color: #080808; font-size: 16px; border-top: 1px solid #e0e0e0;"><strong>Amount Paid:</strong></td>
          <td style="padding: 8px 0 0; color: #96DAC9; font-size: 18px; font-weight: 600; text-align: right; border-top: 1px solid #e0e0e0;">${formattedAmount}</td>
        </tr>
        ${data.remainingBalance > 0 ? `
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Remaining Balance:</strong></td>
          <td style="padding: 4px 0; color: #ff4040; font-size: 14px; text-align: right;">${formattedBalance}</td>
        </tr>
        ` : `
        <tr>
          <td colspan="2" style="padding: 8px 0 0; text-align: center;">
            <span style="background-color: #96DAC9; color: #080808; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600;">
              PAID IN FULL
            </span>
          </td>
        </tr>
        `}
      </table>
    </div>

    <p style="margin: 15px 0 0; color: #9DA5AF; font-size: 13px;">
      Please keep this email for your records.
    </p>
  `;

  return sendEmail({
    to,
    subject: `Payment Received - Invoice ${data.invoiceNumber}`,
    html: baseTemplate(content, `Your payment of ${formattedAmount} for invoice ${data.invoiceNumber} has been received`),
  });
}

/**
 * Send payment reminder before due date
 */
export async function sendPaymentReminderEmail(
  to: string,
  data: PaymentReminderData
): Promise<boolean> {
  const formattedAmount = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(data.amountDue);

  const formattedDueDate = new Intl.DateTimeFormat('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(data.dueDate));

  const content = `
    <h2 style="margin: 0 0 20px; color: #080808; font-size: 22px; font-weight: 600;">
      Payment Reminder
    </h2>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      Hi ${data.parentName},
    </p>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      This is a friendly reminder that your invoice is due soon.
    </p>

    <div style="background-color: #FCF6E6; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Invoice #:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px; text-align: right;">${data.invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Due Date:</strong></td>
          <td style="padding: 4px 0; color: #FFCE00; font-size: 14px; font-weight: 600; text-align: right;">${formattedDueDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0 0; color: #080808; font-size: 16px; border-top: 1px solid #e0e0e0;"><strong>Amount Due:</strong></td>
          <td style="padding: 8px 0 0; color: #4580E4; font-size: 18px; font-weight: 600; text-align: right; border-top: 1px solid #e0e0e0;">${formattedAmount}</td>
        </tr>
      </table>
    </div>

    ${ctaButton('Pay Now', data.paymentUrl)}

    <p style="margin: 20px 0 0; color: #9DA5AF; font-size: 13px;">
      If you've already made this payment, please disregard this reminder.
    </p>
  `;

  return sendEmail({
    to,
    subject: `Payment Reminder - Invoice ${data.invoiceNumber} Due ${formattedDueDate}`,
    html: baseTemplate(content, `Reminder: Invoice ${data.invoiceNumber} for ${formattedAmount} is due ${formattedDueDate}`),
  });
}

/**
 * Send overdue notice
 */
export async function sendOverdueNoticeEmail(
  to: string,
  data: PaymentReminderData
): Promise<boolean> {
  const formattedAmount = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(data.amountDue);

  const formattedDueDate = new Intl.DateTimeFormat('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(data.dueDate));

  const content = `
    <h2 style="margin: 0 0 20px; color: #ff4040; font-size: 22px; font-weight: 600;">
      Invoice Overdue
    </h2>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      Hi ${data.parentName},
    </p>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      Your invoice is now past due. Please make payment at your earliest convenience to avoid any service interruptions.
    </p>

    <div style="background-color: #FFAE9E; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Invoice #:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px; text-align: right;">${data.invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Due Date:</strong></td>
          <td style="padding: 4px 0; color: #ff4040; font-size: 14px; font-weight: 600; text-align: right;">${formattedDueDate} (OVERDUE)</td>
        </tr>
        <tr>
          <td style="padding: 8px 0 0; color: #080808; font-size: 16px; border-top: 1px solid #e0e0e0;"><strong>Amount Due:</strong></td>
          <td style="padding: 8px 0 0; color: #ff4040; font-size: 18px; font-weight: 600; text-align: right; border-top: 1px solid #e0e0e0;">${formattedAmount}</td>
        </tr>
      </table>
    </div>

    ${ctaButton('Pay Now', data.paymentUrl, '#ff4040')}

    <p style="margin: 20px 0 0; color: #9DA5AF; font-size: 13px;">
      If you're experiencing difficulties, please contact us to discuss payment arrangements.
    </p>
  `;

  return sendEmail({
    to,
    subject: `OVERDUE: Invoice ${data.invoiceNumber} - Payment Required`,
    html: baseTemplate(content, `OVERDUE: Invoice ${data.invoiceNumber} for ${formattedAmount} requires immediate payment`),
  });
}

// ===========================================
// LESSON RESCHEDULE EMAILS
// ===========================================

interface LessonRescheduledData {
  parentName: string;
  studentName: string;
  lessonName: string;
  oldDay: string;
  oldTime: string;
  newDay: string;
  newTime: string;
  teacherName: string;
  locationName: string;
  roomName: string;
  reason?: string;
}

/**
 * Send lesson rescheduled notification
 */
export async function sendLessonRescheduledEmail(
  to: string,
  data: LessonRescheduledData
): Promise<boolean> {
  const content = `
    <h2 style="margin: 0 0 20px; color: #080808; font-size: 22px; font-weight: 600;">
      Lesson Schedule Update
    </h2>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      Hi ${data.parentName},
    </p>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      ${data.studentName}'s <strong>${data.lessonName}</strong> lesson has been rescheduled.
    </p>

    <div style="background-color: #FCF6E6; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td colspan="2" style="padding: 0 0 10px; color: #9DA5AF; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
            Previous Schedule
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #9DA5AF; font-size: 14px; text-decoration: line-through;">
            ${data.oldDay} at ${data.oldTime}
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 15px 0 10px; color: #4580E4; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; border-top: 1px solid #e0e0e0;">
            New Schedule
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Day:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px; text-align: right;">${data.newDay}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Time:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px; text-align: right;">${data.newTime}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Teacher:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px; text-align: right;">${data.teacherName}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Location:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px; text-align: right;">${data.locationName}, ${data.roomName}</td>
        </tr>
      </table>
    </div>

    ${data.reason ? `
    <p style="margin: 15px 0; color: #9DA5AF; font-size: 14px;">
      <strong>Reason:</strong> ${data.reason}
    </p>
    ` : ''}

    ${ctaButton('View Schedule', `${config.frontendUrl}/parent/schedule`)}

    <p style="margin: 20px 0 0; color: #9DA5AF; font-size: 13px;">
      If you have any questions about this change, please contact us.
    </p>
  `;

  return sendEmail({
    to,
    subject: `Lesson Rescheduled - ${data.lessonName}`,
    html: baseTemplate(content, `${data.studentName}'s ${data.lessonName} lesson has been rescheduled to ${data.newDay} at ${data.newTime}`),
  });
}

// ===========================================
// HYBRID BOOKING EMAILS
// ===========================================

interface HybridBookingOpenedData {
  parentName: string;
  studentName: string;
  lessonName: string;
  bookingDeadline: string;
  availableWeeks: number[];
  bookingUrl: string;
}

interface HybridBookingReminderData {
  parentName: string;
  studentName: string;
  lessonName: string;
  bookingDeadline: string;
  unbookedWeeks: number[];
  bookingUrl: string;
}

interface IndividualSessionBookedData {
  parentName: string;
  studentName: string;
  lessonName: string;
  sessionDate: string;
  sessionTime: string;
  teacherName: string;
  locationName: string;
  roomName: string;
  weekNumber: number;
}

interface IndividualSessionRescheduledData {
  parentName: string;
  studentName: string;
  lessonName: string;
  weekNumber: number;
  oldDate: string;
  oldTime: string;
  newDate: string;
  newTime: string;
  teacherName: string;
  locationName: string;
}

/**
 * Send hybrid booking period opened notification
 * CRITICAL: This drives parent engagement for booking individual sessions
 */
export async function sendHybridBookingOpenedEmail(
  to: string,
  data: HybridBookingOpenedData
): Promise<boolean> {
  const weeksDisplay = data.availableWeeks.length > 3
    ? `Weeks ${data.availableWeeks[0]}, ${data.availableWeeks[1]}, ${data.availableWeeks[2]}, and ${data.availableWeeks.length - 3} more`
    : `Week${data.availableWeeks.length > 1 ? 's' : ''} ${data.availableWeeks.join(', ')}`;

  const content = `
    <h2 style="margin: 0 0 20px; color: #080808; font-size: 22px; font-weight: 600;">
      Book Your Individual Session!
    </h2>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      Hi ${data.parentName},
    </p>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      Individual session bookings are now open for <strong>${data.studentName}</strong>'s <strong>${data.lessonName}</strong> class!
    </p>

    <div style="background-color: #FFCE00; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0 0 8px; color: #080808; font-size: 14px; font-weight: 600;">
        Available for: ${weeksDisplay}
      </p>
      <p style="margin: 0; color: #080808; font-size: 14px;">
        <strong>Booking Deadline:</strong> ${data.bookingDeadline}
      </p>
    </div>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      Book your preferred time slot now before they fill up!
    </p>

    ${ctaButton('Book Now', data.bookingUrl, '#4580E4')}

    <p style="margin: 20px 0 0; color: #9DA5AF; font-size: 13px;">
      Individual sessions are a great opportunity for focused one-on-one time with the teacher.
    </p>
  `;

  return sendEmail({
    to,
    subject: `Book Individual Session - ${data.lessonName}`,
    html: baseTemplate(content, `Individual session bookings are now open for ${data.studentName}'s ${data.lessonName} class - book before ${data.bookingDeadline}`),
  });
}

/**
 * Send hybrid booking reminder to parents who haven't booked
 */
export async function sendHybridBookingReminderEmail(
  to: string,
  data: HybridBookingReminderData
): Promise<boolean> {
  const content = `
    <h2 style="margin: 0 0 20px; color: #FFCE00; font-size: 22px; font-weight: 600;">
      Don't Forget to Book!
    </h2>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      Hi ${data.parentName},
    </p>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      This is a friendly reminder that you still need to book individual sessions for <strong>${data.studentName}</strong>'s <strong>${data.lessonName}</strong> class.
    </p>

    <div style="background-color: #FCF6E6; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #FFCE00;">
      <p style="margin: 0 0 8px; color: #080808; font-size: 14px;">
        <strong>Unbooked weeks:</strong> ${data.unbookedWeeks.join(', ')}
      </p>
      <p style="margin: 0; color: #ff4040; font-size: 14px; font-weight: 600;">
        Deadline: ${data.bookingDeadline}
      </p>
    </div>

    ${ctaButton('Book Now', data.bookingUrl, '#FFCE00')}

    <p style="margin: 20px 0 0; color: #9DA5AF; font-size: 13px;">
      If you don't book before the deadline, a time will be assigned automatically.
    </p>
  `;

  return sendEmail({
    to,
    subject: `Reminder: Book Individual Session - ${data.lessonName}`,
    html: baseTemplate(content, `Reminder: Book ${data.studentName}'s individual session for ${data.lessonName} before ${data.bookingDeadline}`),
  });
}

/**
 * Send individual session booking confirmation
 */
export async function sendIndividualSessionBookedEmail(
  to: string,
  data: IndividualSessionBookedData
): Promise<boolean> {
  const content = `
    <h2 style="margin: 0 0 20px; color: #080808; font-size: 22px; font-weight: 600;">
      Individual Session Booked!
    </h2>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      Hi ${data.parentName},
    </p>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      Great news! You've successfully booked an individual session for <strong>${data.studentName}</strong>.
    </p>

    <div style="background-color: #96DAC9; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0 0 10px; color: #080808; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
        Session Details - Week ${data.weekNumber}
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Lesson:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px; text-align: right;">${data.lessonName}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Date:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px; text-align: right;">${data.sessionDate}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Time:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px; text-align: right;">${data.sessionTime}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Teacher:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px; text-align: right;">${data.teacherName}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Location:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px; text-align: right;">${data.locationName}, ${data.roomName}</td>
        </tr>
      </table>
    </div>

    ${ctaButton('View Schedule', `${config.frontendUrl}/parent/schedule`)}

    <p style="margin: 20px 0 0; color: #9DA5AF; font-size: 13px;">
      Need to reschedule? You can change your booking up to 24 hours before the session.
    </p>
  `;

  return sendEmail({
    to,
    subject: `Session Booked - ${data.lessonName} Week ${data.weekNumber}`,
    html: baseTemplate(content, `${data.studentName}'s individual session for ${data.lessonName} is booked for ${data.sessionDate} at ${data.sessionTime}`),
  });
}

/**
 * Send individual session rescheduled notification
 */
export async function sendIndividualSessionRescheduledEmail(
  to: string,
  data: IndividualSessionRescheduledData
): Promise<boolean> {
  const content = `
    <h2 style="margin: 0 0 20px; color: #080808; font-size: 22px; font-weight: 600;">
      Session Rescheduled
    </h2>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      Hi ${data.parentName},
    </p>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      ${data.studentName}'s individual session for <strong>${data.lessonName}</strong> (Week ${data.weekNumber}) has been rescheduled.
    </p>

    <div style="background-color: #FCF6E6; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td colspan="2" style="padding: 0 0 10px; color: #9DA5AF; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
            Previous Time
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #9DA5AF; font-size: 14px; text-decoration: line-through;">
            ${data.oldDate} at ${data.oldTime}
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 15px 0 10px; color: #4580E4; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; border-top: 1px solid #e0e0e0;">
            New Time
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Date:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px; text-align: right;">${data.newDate}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Time:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px; text-align: right;">${data.newTime}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Teacher:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px; text-align: right;">${data.teacherName}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Location:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px; text-align: right;">${data.locationName}</td>
        </tr>
      </table>
    </div>

    ${ctaButton('View Schedule', `${config.frontendUrl}/parent/schedule`)}

    <p style="margin: 20px 0 0; color: #9DA5AF; font-size: 13px;">
      If you have any questions about this change, please contact us.
    </p>
  `;

  return sendEmail({
    to,
    subject: `Session Rescheduled - ${data.lessonName} Week ${data.weekNumber}`,
    html: baseTemplate(content, `${data.studentName}'s individual session for ${data.lessonName} has been rescheduled to ${data.newDate} at ${data.newTime}`),
  });
}

// ===========================================
// MEET & GREET REMINDER EMAIL
// ===========================================

interface MeetAndGreetReminderData {
  parentName: string;
  childName: string;
  scheduledDateTime: string;
  locationName: string;
  locationAddress: string;
  teacherName: string;
}

/**
 * Send meet & greet reminder 24 hours before
 */
export async function sendMeetAndGreetReminderEmail(
  to: string,
  data: MeetAndGreetReminderData
): Promise<boolean> {
  const content = `
    <h2 style="margin: 0 0 20px; color: #080808; font-size: 22px; font-weight: 600;">
      Meet & Greet Tomorrow!
    </h2>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      Hi ${data.parentName},
    </p>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      This is a friendly reminder that ${data.childName}'s meet & greet is coming up soon!
    </p>

    <div style="background-color: #96DAC9; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Date & Time:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px; text-align: right;">${data.scheduledDateTime}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Location:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px; text-align: right;">${data.locationName}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Address:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px; text-align: right;">${data.locationAddress}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Teacher:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px; text-align: right;">${data.teacherName}</td>
        </tr>
      </table>
    </div>

    <p style="margin: 15px 0 0; color: #080808; font-size: 16px; line-height: 1.6;">
      We're looking forward to meeting ${data.childName} and introducing them to the wonderful world of music!
    </p>

    <p style="margin: 20px 0 0; color: #9DA5AF; font-size: 13px;">
      If you need to reschedule, please contact us as soon as possible.
    </p>
  `;

  return sendEmail({
    to,
    subject: `Reminder: Meet & Greet Tomorrow - Music 'n Me`,
    html: baseTemplate(content, `Reminder: ${data.childName}'s meet & greet is tomorrow at ${data.scheduledDateTime}`),
  });
}

// ===========================================
// LESSON REMINDER EMAIL
// ===========================================

interface LessonReminderData {
  parentName: string;
  studentName: string;
  lessonName: string;
  lessonDate: string;
  lessonTime: string;
  teacherName: string;
  locationName: string;
  roomName: string;
}

/**
 * Send lesson reminder 24 hours before
 */
export async function sendLessonReminderEmail(
  to: string,
  data: LessonReminderData
): Promise<boolean> {
  const content = `
    <h2 style="margin: 0 0 20px; color: #080808; font-size: 22px; font-weight: 600;">
      Lesson Reminder
    </h2>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      Hi ${data.parentName},
    </p>

    <p style="margin: 0 0 15px; color: #080808; font-size: 16px; line-height: 1.6;">
      Just a reminder that ${data.studentName} has a <strong>${data.lessonName}</strong> lesson coming up!
    </p>

    <div style="background-color: #FCF6E6; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Date:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px; text-align: right;">${data.lessonDate}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Time:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px; text-align: right;">${data.lessonTime}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Teacher:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px; text-align: right;">${data.teacherName}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #080808; font-size: 14px;"><strong>Location:</strong></td>
          <td style="padding: 4px 0; color: #080808; font-size: 14px; text-align: right;">${data.locationName}, ${data.roomName}</td>
        </tr>
      </table>
    </div>

    <p style="margin: 15px 0 0; color: #9DA5AF; font-size: 13px;">
      See you soon!
    </p>
  `;

  return sendEmail({
    to,
    subject: `Lesson Tomorrow - ${data.lessonName}`,
    html: baseTemplate(content, `Reminder: ${data.studentName}'s ${data.lessonName} lesson is tomorrow at ${data.lessonTime}`),
  });
}
