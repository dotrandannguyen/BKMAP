import { z } from 'zod';
import { createRoomSchema } from './create-room.request.js';

export const getRoomsSchema = {
	query: z.object({
		page: z.coerce.number().int().positive().optional().default(1),
		limit: z.coerce.number().int().positive().max(100).optional().default(10),
		
		// Filters
		minPrice: z.coerce.number().int().nonnegative().optional(),
		maxPrice: z.coerce.number().int().positive().optional(),
		minArea: z.coerce.number().positive().optional(),
		maxArea: z.coerce.number().positive().optional(),
		distanceToBk: z.coerce.number().positive().optional(),
		status: z.enum(['AVAILABLE', 'ALMOST_FULL', 'FULL']).optional(),
		ward: z.string().optional(),
		
		// Feature filtering (ví dụ: ?features=wifi,ac hoặc mảng tuỳ setup, ở đây xử lý dạng chuỗi phẩy)
		features: z.string().optional(),
	}),
};

// Sử dụng chung schema tạo mới nhưng biến tất cả thành optional (trừ ID không sửa)
export const updateRoomSchema = {
	body: createRoomSchema.body.partial().extend({
		// Có thể thêm id kiểm tra ở param nếu muốn, nhưng mình bắt ở router parameter rồi
	}),
};
