import { z } from 'zod';

export const createRoomSchema = {
	body: z.object({
		title: z.string().min(1, 'Tiêu đề không được để trống').max(255),
		
		// Vị trí
		address: z.string().min(1, 'Địa chỉ chi tiết không được để trống'),
		street: z.string().max(150).optional().nullable(),
		ward: z.string().max(100).optional().nullable(),
		latitude: z.number({ required_error: 'Vĩ độ là bắt buộc', invalid_type_error: 'Vĩ độ phải là số' }),
		longitude: z.number({ required_error: 'Kinh độ là bắt buộc', invalid_type_error: 'Kinh độ phải là số' }),
		distanceToBk: z.number().optional().nullable(),

		// Cơ bản
		price: z.number({ required_error: 'Giá thuê là bắt buộc' }).int().positive('Giá thuê phải lớn hơn 0'),
		area: z.number({ required_error: 'Diện tích là bắt buộc' }).positive('Diện tích phải lớn hơn 0'),
		electricityPrice: z.number().int().optional().nullable(),
		waterPrice: z.number().int().optional().nullable(),
		otherCosts: z.string().max(255).optional().nullable(),

		// Phân loại
		status: z.enum(['AVAILABLE', 'ALMOST_FULL', 'FULL']).optional().default('AVAILABLE'),
		sharedOwner: z.boolean().optional().default(false),
		curfew: z.string().max(100).optional().nullable(),
		description: z.string().optional().nullable(),

		// Thông tin chủ trọ
		ownerName: z.string().min(1, 'Tên chủ trọ không được để trống').max(100),
		ownerPhone: z.string().min(1, 'Số điện thoại chủ trọ không được để trống').max(20),

		// Ảnh & Tiện ích
		imageUrls: z.array(z.string().url('URL ảnh không hợp lệ')).optional().default([]),
		featureIds: z.array(z.string().uuid('ID tiện ích không hợp lệ')).optional().default([]),
		features: z.array(z.string()).optional().default([]),
	}),
};
