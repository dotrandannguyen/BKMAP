import express from 'express';
import { roomController } from './room.controller.js';
import { createRoomSchema } from './dto/requests/create-room.request.js';
import { validateRequestMiddleware } from '../../common/middleware/index.js';
import { authMiddleware } from '../../common/middleware/auth.middleware.js';

import { getRoomsSchema, updateRoomSchema } from './dto/requests/room.request.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Cấu hình Multer để lưu file vào bộ nhớ tạm (RAM)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// GET /rooms: Lấy danh sách (Public)
router.get(
	'/',
	validateRequestMiddleware(getRoomsSchema),
	roomController.getRooms
);

// GET /rooms/:id: Lấy chi tiết (Public)
router.get('/:id', roomController.getRoomById);

// POST /rooms: Tạo mới (Cần đăng nhập)
router.post(
	'/',
	authMiddleware,
	validateRequestMiddleware(createRoomSchema),
	roomController.createRoom
);

// PATCH /rooms/:id: Cập nhật (Cần đăng nhập & Là người tạo)
router.patch(
	'/:id',
	authMiddleware,
	validateRequestMiddleware(updateRoomSchema),
	roomController.updateRoom
);

// DELETE /rooms/:id: Xóa (Cần đăng nhập & Là người tạo)
router.delete(
	'/:id',
	authMiddleware,
	roomController.deleteRoom
);

// --- QUẢN LÝ ẢNH TRỰC TIẾP (Theo Room ID) ---

// POST /rooms/:id/images: Tải thêm 1 ảnh cho phòng
router.post(
	'/:id/images',
	authMiddleware,
	upload.single('image'),
	roomController.uploadImage
);

// PATCH /rooms/:id/images/reorder: Sắp xếp lại thứ tự ảnh
router.patch(
	'/:id/images/reorder',
	authMiddleware,
	roomController.reorderImages
);

// DELETE /rooms/:id/images/:imageId: Xóa 1 ảnh của phòng
router.delete(
	'/:id/images/:imageId',
	authMiddleware,
	roomController.deleteImage
);

export default router;
