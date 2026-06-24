import express from 'express';
import { adminController } from './admin.controller.js';
import { authMiddleware, requireAdmin } from '../../common/middleware/index.js';

const router = express.Router();

// Tất cả routes admin đều yêu cầu đăng nhập VÀ có role ADMIN
router.use(authMiddleware, requireAdmin);

// ============ DASHBOARD ============
// GET /admin/dashboard
router.get('/dashboard', adminController.getDashboard);

// ============ QUẢN LÝ USER ============
// GET /admin/users
router.get('/users', adminController.getUsers);

// GET /admin/users/:id
router.get('/users/:id', adminController.getUserById);

// GET /admin/users/:id/rooms
router.get('/users/:id/rooms', adminController.getUserRooms);

// PATCH /admin/users/:id/ban
router.patch('/users/:id/ban', adminController.banUser);

// PATCH /admin/users/:id/unban
router.patch('/users/:id/unban', adminController.unbanUser);

// ============ QUẢN LÝ PHÒNG TRỌ ============
// GET /admin/rooms
router.get('/rooms', adminController.getRooms);

// GET /admin/rooms/:id
router.get('/rooms/:id', adminController.getRoomById);

// PATCH /admin/rooms/:id/hide
router.patch('/rooms/:id/hide', adminController.hideRoom);

// PATCH /admin/rooms/:id/restore
router.patch('/rooms/:id/restore', adminController.restoreRoom);

// DELETE /admin/rooms/:id
router.delete('/rooms/:id', adminController.deleteRoom);

export default router;
