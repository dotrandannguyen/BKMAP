import express from 'express';
import { authController } from './auth.controller.js';

import {
	registerSchema,
	loginSchema,
	verifyEmailSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
} from './dto/requests/auth.request.js';
import { changePasswordSchema } from './dto/requests/change-password.request.js';
import { validateRequestMiddleware } from '../../common/middleware/index.js';
import { authMiddleware } from '../../common/middleware/auth.middleware.js';
import passport from '../../config/passport.js';

const router = express.Router();

router.post(
	'/register',
	validateRequestMiddleware(registerSchema),
	authController.register,
);
router.post('/login', validateRequestMiddleware(loginSchema), authController.login);

router.post(
	'/verify-email',
	validateRequestMiddleware(verifyEmailSchema),
	authController.verifyEmail,
);

// Dành cho việc bấm link trực tiếp từ Email (trình duyệt gửi GET request)
router.get('/verify-email', authController.verifyEmailGet);

router.post('/refresh-token', authController.refreshToken);
// authMiddleware đảm bảo req.user.id luôn tồn tại để xóa refreshToken trong DB
router.post('/logout', authMiddleware, authController.logout);

router.post(
	'/change-password',
	authMiddleware,
	validateRequestMiddleware(changePasswordSchema),
	authController.changePassword,
);

router.post(
	'/forgot-password',
	validateRequestMiddleware(forgotPasswordSchema),
	authController.forgotPassword,
);

router.post(
	'/reset-password',
	validateRequestMiddleware(resetPasswordSchema),
	authController.resetPassword,
);

// --- GOOGLE OAUTH ---
// Bước 1: Redirect user sang Google consent screen
router.get(
	'/google', passport.authenticate('google', { session: false, scope: ['profile', 'email'] }));

// Bước 2: Google redirect về đây sau khi user đồng ý
router.get(
	'/google/callback',
	passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_denied` }),
	authController.googleCallback,
);

export default router;
