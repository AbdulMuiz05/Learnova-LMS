import { Request, Response } from 'express';
import crypto from 'crypto';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { asyncHandler, sendSuccess } from '../utils/response';
import {
  clearAuthCookies,
  hashToken,
  refreshTokenExpiryDate,
  setAuthCookies,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/tokens';
import { generateOtp, hashOtp, otpExpiryDate } from '../utils/otp';
import { isSmtpConfigured } from '../config/mailer';
import { env, isProduction } from '../config/env';
import {
  sendOtpEmail,
  sendPasswordResetNotice,
  sendWelcomeEmail,
} from '../services/email.service';
import { notifyAdmins } from '../services/notification.service';
import { uploadImageBuffer } from '../config/cloudinary';
import { logger } from '../utils/logger';

async function issueTokens(userId: string, role: 'student' | 'admin', res: Response) {
  const jti = crypto.randomUUID();
  const refreshToken = signRefreshToken(userId, jti);
  const accessToken = signAccessToken({ _id: userId, role });

  await User.updateOne(
    { _id: userId },
    {
      $pull: { refreshTokens: { expiresAt: { $lt: new Date() } } },
    }
  );
  await User.updateOne(
    { _id: userId },
    {
      $push: {
        refreshTokens: {
          $each: [{ tokenHash: hashToken(refreshToken), expiresAt: refreshTokenExpiryDate(), createdAt: new Date() }],
          $slice: -5,
        },
      },
    }
  );

  setAuthCookies(res, accessToken, refreshToken);
}

function devOtp(code: string): string | undefined {
  if (!isProduction && !isSmtpConfigured()) return code;
  return undefined;
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body as { name: string; email: string; password: string };

  const existing = await User.findOne({ email });
  if (existing) {
    if (!existing.isVerified) {
      throw ApiError.conflict(
        'An account with this email already exists but is not verified. Request a new code on the verification page.',
        'EMAIL_EXISTS_UNVERIFIED'
      );
    }
    throw ApiError.conflict('An account with this email already exists. Try signing in.', 'EMAIL_EXISTS');
  }

  const code = generateOtp();
  const user = await User.create({
    name,
    email,
    password,
    otp: { hash: hashOtp(code), expiresAt: otpExpiryDate(10), purpose: 'verify' },
  });

  await sendOtpEmail(email, name, code, 'verify');

  notifyAdmins({
    type: 'user',
    title: 'New student registered',
    message: `${name} (${email}) just created an account.`,
    link: '/admin/students',
    meta: { userId: user._id.toString() },
  }).catch((error) => logger.error('Admin notification failed', error));

  sendSuccess(
    res,
    {
      email,
      verificationRequired: true,
      devOtp: devOtp(code),
      emailDeliveryConfigured: isSmtpConfigured(),
    },
    'Account created. Check your email for the verification code.',
    201
  );
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, code } = req.body as { email: string; code: string };
  const user = await User.findOne({ email }).select('+otp');
  if (!user) throw ApiError.notFound('No account found for this email', 'ACCOUNT_NOT_FOUND');

  if (user.isVerified) {
    await issueTokens(user._id.toString(), user.role, res);
    sendSuccess(res, { user, alreadyVerified: true }, 'Email already verified');
    return;
  }

  if (!user.otp || user.otp.purpose !== 'verify' || user.otp.expiresAt.getTime() < Date.now()) {
    throw ApiError.badRequest('This verification code has expired. Request a new one.', 'OTP_EXPIRED');
  }

  if (hashOtp(code) !== user.otp.hash) {
    throw ApiError.badRequest('That verification code is incorrect.', 'OTP_INVALID');
  }

  user.isVerified = true;
  user.otp = null;
  user.lastLoginAt = new Date();
  await user.save();

  await issueTokens(user._id.toString(), user.role, res);
  sendWelcomeEmail(user.email, user.name);
  sendSuccess(res, { user }, 'Email verified successfully. Welcome aboard!');
});

export const resendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, purpose } = req.body as { email: string; purpose: 'verify' | 'reset' };
  const user = await User.findOne({ email }).select('+otp');
  if (!user) {
    // Do not reveal whether an account exists for password reset requests.
    if (purpose === 'reset') {
      sendSuccess(res, { emailDeliveryConfigured: isSmtpConfigured() }, 'If that account exists, a code was sent.');
      return;
    }
    throw ApiError.notFound('No account found for this email', 'ACCOUNT_NOT_FOUND');
  }
  if (purpose === 'verify' && user.isVerified) {
    throw ApiError.badRequest('This email is already verified. Please sign in.', 'ALREADY_VERIFIED');
  }

  const code = generateOtp();
  user.otp = { hash: hashOtp(code), expiresAt: otpExpiryDate(10), purpose };
  await user.save();
  await sendOtpEmail(user.email, user.name, code, purpose);

  sendSuccess(
    res,
    { devOtp: devOtp(code), emailDeliveryConfigured: isSmtpConfigured() },
    'A new verification code has been sent.'
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  const user = await User.findOne({ email }).select('+password +refreshTokens');
  if (!user) throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');

  const matches = await user.comparePassword(password);
  if (!matches) throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  if (!user.isVerified) {
    throw new ApiError(403, 'Please verify your email before signing in.', 'EMAIL_NOT_VERIFIED');
  }
  if (!user.isActive) {
    throw new ApiError(403, 'Your account has been deactivated. Contact support.', 'ACCOUNT_DISABLED');
  }

  user.lastLoginAt = new Date();
  user.refreshTokens = user.refreshTokens.filter((token) => token.expiresAt.getTime() > Date.now());
  await user.save();

  await issueTokens(user._id.toString(), user.role, res);
  sendSuccess(res, { user }, 'Signed in successfully');
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = (req.cookies as Record<string, string> | undefined)?.refreshToken;
  if (!token) throw ApiError.unauthorized('No refresh token provided', 'REFRESH_MISSING');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    clearAuthCookies(res);
    throw ApiError.unauthorized('Your session has expired. Please sign in again.', 'REFRESH_INVALID');
  }

  const user = await User.findById(payload.sub).select('+refreshTokens');
  if (!user || !user.isActive) {
    clearAuthCookies(res);
    throw ApiError.unauthorized('Your session is no longer valid', 'REFRESH_INVALID');
  }

  const tokenHash = hashToken(token);
  const stored = user.refreshTokens.find((entry) => entry.tokenHash === tokenHash);
  if (!stored || stored.expiresAt.getTime() < Date.now()) {
    clearAuthCookies(res);
    throw ApiError.unauthorized('Your session has expired. Please sign in again.', 'REFRESH_INVALID');
  }

  user.refreshTokens = user.refreshTokens.filter((entry) => entry.tokenHash !== tokenHash);
  await user.save();
  await issueTokens(user._id.toString(), user.role, res);

  sendSuccess(res, { user }, 'Session refreshed');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = (req.cookies as Record<string, string> | undefined)?.refreshToken;
  if (token) {
    const tokenHash = hashToken(token);
    await User.updateOne({ 'refreshTokens.tokenHash': tokenHash }, { $pull: { refreshTokens: { tokenHash } } });
  }
  clearAuthCookies(res);
  sendSuccess(res, null, 'Signed out');
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, { user: req.user });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const { name, bio } = req.body as { name?: string; bio?: string };
  if (name !== undefined) user.name = name;
  if (bio !== undefined) user.bio = bio;
  await user.save();
  sendSuccess(res, { user }, 'Profile updated');
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword: string;
    newPassword: string;
  };
  const user = await User.findById(req.user!._id).select('+password');
  if (!user) throw ApiError.notFound('Account not found');

  const matches = await user.comparePassword(currentPassword);
  if (!matches) throw ApiError.badRequest('Current password is incorrect', 'INVALID_PASSWORD');

  user.password = newPassword;
  user.refreshTokens = [];
  await user.save();
  await issueTokens(user._id.toString(), user.role, res);
  sendSuccess(res, null, 'Password changed successfully');
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };
  const user = await User.findOne({ email }).select('+otp');

  if (user) {
    const code = generateOtp();
    user.otp = { hash: hashOtp(code), expiresAt: otpExpiryDate(10), purpose: 'reset' };
    await user.save();
    await sendOtpEmail(user.email, user.name, code, 'reset');
    sendSuccess(
      res,
      { devOtp: devOtp(code), emailDeliveryConfigured: isSmtpConfigured() },
      'If that account exists, a reset code has been sent.'
    );
    return;
  }

  sendSuccess(res, { emailDeliveryConfigured: isSmtpConfigured() }, 'If that account exists, a reset code has been sent.');
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, code, password } = req.body as { email: string; code: string; password: string };
  const user = await User.findOne({ email }).select('+otp');
  if (!user || !user.otp) throw ApiError.badRequest('Invalid or expired reset code', 'OTP_INVALID');

  if (user.otp.purpose !== 'reset' || user.otp.expiresAt.getTime() < Date.now()) {
    throw ApiError.badRequest('This reset code has expired. Request a new one.', 'OTP_EXPIRED');
  }
  if (hashOtp(code) !== user.otp.hash) {
    throw ApiError.badRequest('That reset code is incorrect.', 'OTP_INVALID');
  }

  user.password = password;
  user.otp = null;
  user.refreshTokens = [];
  await user.save();
  clearAuthCookies(res);
  sendPasswordResetNotice(user.email, user.name);
  sendSuccess(res, null, 'Password reset successfully. Please sign in with your new password.');
});

export const uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest('No image file was provided', 'FILE_REQUIRED');
  let result;
  try {
    result = await uploadImageBuffer(req.file.buffer, `${env.CLOUDINARY_FOLDER}/avatars`);
  } catch (error) {
    throw ApiError.serviceUnavailable(
      error instanceof Error ? error.message : 'Image hosting is not configured',
      'CLOUDINARY_UNAVAILABLE'
    );
  }
  const user = req.user!;
  user.avatar = { url: result.secure_url, publicId: result.public_id };
  await user.save();
  sendSuccess(res, { avatar: user.avatar, user }, 'Profile photo updated');
});

export const deleteMyAvatar = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  user.avatar = { url: '', publicId: '' };
  await user.save();
  sendSuccess(res, { user }, 'Profile photo removed');
});
