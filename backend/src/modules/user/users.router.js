import { Router } from 'express';
import usersController from './users.controller.js';
import { authMiddleware, requireAdmin } from '../../common/middleware/index.js';

const userRouter = Router();

// Cần đăng nhập và phải là ADMIN để xem danh sách user
userRouter.get('/', authMiddleware, requireAdmin, usersController.getAllUser);

export default userRouter;
