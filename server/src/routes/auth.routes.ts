import { Router } from 'express';
import * as auth from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { uploadImage } from '../middleware/upload';
import { authLimiter } from '../middleware/rateLimit';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendOtpSchema,
  resetPasswordSchema,
  updateProfileSchema,
  verifyOtpSchema,
} from '../validators/auth.validator';

const router = Router();

router.post('/register', authLimiter, validate({ body: registerSchema }), auth.register);
router.post('/login', authLimiter, validate({ body: loginSchema }), auth.login);
router.post('/refresh', auth.refresh);
router.post('/logout', auth.logout);
router.post('/verify-otp', authLimiter, validate({ body: verifyOtpSchema }), auth.verifyOtp);
router.post('/resend-otp', authLimiter, validate({ body: resendOtpSchema }), auth.resendOtp);
router.post('/forgot-password', authLimiter, validate({ body: forgotPasswordSchema }), auth.forgotPassword);
router.post('/reset-password', authLimiter, validate({ body: resetPasswordSchema }), auth.resetPassword);

router.get('/me', authenticate, auth.getMe);
router.patch('/me', authenticate, validate({ body: updateProfileSchema }), auth.updateProfile);
router.patch('/me/password', authenticate, validate({ body: changePasswordSchema }), auth.changePassword);
router.post('/me/avatar', authenticate, uploadImage, auth.uploadAvatar);
router.delete('/me/avatar', authenticate, auth.deleteMyAvatar);

export default router;
