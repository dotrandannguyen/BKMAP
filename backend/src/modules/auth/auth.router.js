import express from 'express';
import { authController } from './auth.controller.js';

import { registerSchema, loginSchema, verifyEmailSchema } from './dto/requests/auth.request.js';
import { validateRequestMiddleware } from '../../common/middleware/index.js';
import { authMiddleware } from '../../common/middleware/auth.middleware.js';

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

export default router;
