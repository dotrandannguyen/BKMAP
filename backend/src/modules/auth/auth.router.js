import express from 'express';
import { authController } from './auth.controller.js';

import { registerSchema, loginSchema, verifyEmailSchema } from './dto/requests/auth.request.js';
import { validateRequestMiddleware } from '../../common/middleware/index.js';

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
router.post('/logout', authController.logout); // You can add authentication middleware here if desired

export default router;
