import { env } from '../config/env';
import { sendTemplateEmail } from '../config/mailer';
import { logger } from '../utils/logger';

export async function sendOtpEmail(
  email: string,
  name: string,
  code: string,
  purpose: 'verify' | 'reset'
): Promise<boolean> {
  const heading = purpose === 'verify' ? 'Verify your email address' : 'Reset your password';
  const message =
    purpose === 'verify'
      ? `Welcome to ${env.APP_NAME}, ${name}! Use the verification code below to activate your account.`
      : `Hi ${name}, we received a request to reset your password. Use the code below to continue.`;
  try {
    return await sendTemplateEmail({
      to: email,
      subject:
        purpose === 'verify'
          ? `Your ${env.APP_NAME} verification code`
          : `Your ${env.APP_NAME} password reset code`,
      template: 'otp',
      data: { heading, message, code },
    });
  } catch (error) {
    logger.error('Failed to send OTP email', error);
    return false;
  }
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  try {
    await sendTemplateEmail({
      to: email,
      subject: `Welcome to ${env.APP_NAME}`,
      template: 'notice',
      data: {
        heading: `You're in, ${name}!`,
        message:
          'Your account is verified. Explore project-based courses, track your progress and learn from engineers who ship real products.',
        ctaLabel: 'Browse courses',
        ctaUrl: `${env.CLIENT_URL}/courses`,
      },
    });
  } catch (error) {
    logger.error('Failed to send welcome email', error);
  }
}

interface ReceiptData {
  studentName: string;
  courseTitle: string;
  amount: number;
  currency: string;
  orderId: string;
  invoiceNumber: string;
}

export async function sendOrderReceiptEmail(email: string, data: ReceiptData): Promise<void> {
  try {
    await sendTemplateEmail({
      to: email,
      subject: `Your receipt for ${data.courseTitle}`,
      template: 'notice',
      data: {
        heading: 'Purchase confirmed',
        message: `Thanks, ${data.studentName}. Your enrollment in "${data.courseTitle}" is now active. You can start learning right away.`,
        details: `Invoice: ${data.invoiceNumber} · Amount: $${data.amount.toFixed(2)} ${data.currency.toUpperCase()} · Order: ${data.orderId}`,
        ctaLabel: 'Start learning',
        ctaUrl: `${env.CLIENT_URL}/dashboard/courses`,
      },
    });
  } catch (error) {
    logger.error('Failed to send order receipt', error);
  }
}

export async function sendAnswerEmail(
  email: string,
  studentName: string,
  question: string
): Promise<void> {
  try {
    await sendTemplateEmail({
      to: email,
      subject: 'Your question received an answer',
      template: 'notice',
      data: {
        heading: 'New reply from your instructor',
        message: `Hi ${studentName}, our team replied to your question: "${question.slice(0, 140)}${
          question.length > 140 ? '…' : ''
        }".`,
        ctaLabel: 'View the answer',
        ctaUrl: `${env.CLIENT_URL}/dashboard/courses`,
      },
    });
  } catch (error) {
    logger.error('Failed to send answer email', error);
  }
}

export async function sendPasswordResetNotice(email: string, name: string): Promise<void> {
  try {
    await sendTemplateEmail({
      to: email,
      subject: 'Your password was changed',
      template: 'notice',
      data: {
        heading: 'Password updated successfully',
        message: `Hi ${name}, your ${env.APP_NAME} password was reset. If this wasn't you, contact support immediately.`,
        ctaLabel: 'Sign in',
        ctaUrl: `${env.CLIENT_URL}/login`,
      },
    });
  } catch (error) {
    logger.error('Failed to send password reset notice', error);
  }
}
