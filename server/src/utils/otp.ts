import crypto from 'crypto';

export function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export function hashOtp(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export function otpExpiryDate(minutes = 10): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export function randomInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `INV-${year}-${random}`;
}
