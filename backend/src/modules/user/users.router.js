import { Router } from 'express';
import usersController from './users.controller.js';
import { authMiddleware } from '../../common/middleware/auth.middleware.js';

const userRouter = Router();

// Cần đăng nhập để xem danh sách user (không public)
userRouter.get('/', authMiddleware, usersController.getAllUser);

export default userRouter;
