import path from 'path';
import fs from 'fs';
import nodemailer, { Transporter } from 'nodemailer';
import ejs from 'ejs';
import { env } from './env';
import { logger } from '../utils/logger';

const templateCandidates = [
  path.join(__dirname, '..', 'templates', 'emails'),
  path.join(process.cwd(), 'src', 'templates', 'emails'),
  path.join(process.cwd(), 'dist', 'templates', 'emails'),
];
const templatesDir = templateCandidates.find((dir) => fs.existsSync(dir)) ?? templateCandidates[0];
const smtpConfigured = Boolean(env.SMTP_HOST);

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!smtpConfigured) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

export const isSmtpConfigured = (): boolean => smtpConfigured;

interface SendTemplateEmailOptions {
  to: string;
  subject: string;
  template: 'otp' | 'notice';
  data: Record<string, unknown>;
}

export async function sendTemplateEmail(options: SendTemplateEmailOptions): Promise<boolean> {
  const html = await ejs.renderFile(path.join(templatesDir, `${options.template}.ejs`), {
    appName: env.APP_NAME,
    year: new Date().getFullYear(),
    subject: options.subject,
    ...options.data,
  });

  const client = getTransporter();
  if (!client) {
    logger.warn(`SMTP is not configured. Email "${options.subject}" to ${options.to} was not delivered.`);
    logger.info(`Email preview (${options.template}): ${options.subject}`, {
      to: options.to,
      data: options.data,
    });
    return false;
  }

  await client.sendMail({
    from: env.MAIL_FROM,
    to: options.to,
    subject: options.subject,
    html,
  });
  return true;
}
