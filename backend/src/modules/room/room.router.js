import express from 'express';
import { roomController } from './room.controller.js';
import { createRoomSchema } from './dto/requests/create-room.request.js';
import { validateRequestMiddleware } from '../../common/middleware/index.js';
import { authMiddleware } from '../../common/middleware/auth.middleware.js';
import { uploadMiddleware } from '../../common/middleware/upload.middleware.js';

import { getRoomsSchema, updateRoomSchema } from './dto/requests/room.request.js';

const router = express.Router();

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

// POST /rooms/:id/image: Upload ảnh (Cần đăng nhập & Là người tạo)
router.post(
	'/:id/image',
	authMiddleware,
	uploadMiddleware.single('file'),
	roomController.uploadImage
);

// DELETE /rooms/:id/images/:imageId: Xóa 1 ảnh (Cần đăng nhập & Là người tạo)
router.delete(
	'/:id/images/:imageId',
	authMiddleware,
	roomController.deleteImage
);

// PATCH /rooms/:id/images/reorder: Sắp xếp lại thứ tự ảnh (Cần đăng nhập & Là người tạo)
router.patch(
	'/:id/images/reorder',
	authMiddleware,
	roomController.reorderImages
);
export default router;
