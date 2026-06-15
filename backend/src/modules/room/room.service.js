import { roomRepository } from './room.repository.js';
import { ClientException } from '../../common/exceptions/index.js';

export const roomService = {
	async createRoom(dto, userId) {
		try {
			// Xử lý logic nghiệp vụ ở đây nếu có (ví dụ check data hợp lệ, format lại title...)
			// Hiện tại đẩy thẳng xuống repository để thực thực thi transaction
			const newRoom = await roomRepository.createRoom(dto, userId);

			// Format lại kết quả trả về cho client (loại bỏ bớt cấu trúc lồng nhau nếu cần thiết)
			return newRoom;
		} catch (error) {
			// Catch Prisma constraint errors or throw unexpected ones
			if (error.code === 'P2003') {
				// Foreign key constraint failed (ví dụ: featureId không tồn tại)
				throw new ClientException(400, 'Dữ liệu liên kết không hợp lệ (Tiện ích không tồn tại).');
			}
			throw error;
		}
	},

	async getRooms(query) {
		// Tính toán pagination
		const page = query.page || 1;
		const limit = query.limit || 10;
		const skip = (page - 1) * limit;

		// Extract filters
		const filters = {
			minPrice: query.minPrice,
			maxPrice: query.maxPrice,
			minArea: query.minArea,
			maxArea: query.maxArea,
			distanceToBk: query.distanceToBk,
			status: query.status,
			ward: query.ward,
		};

		const { total, rooms } = await roomRepository.findAll(filters, skip, limit);

		return {
			data: rooms,
			meta: {
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
			},
		};
	},

	async getRoomById(id) {
		const room = await roomRepository.findById(id);
		if (!room) {
			throw new ClientException(404, 'Không tìm thấy phòng trọ.');
		}
		return room;
	},

	async updateRoom(id, userId, dto) {
		// 1. Kiểm tra phòng có tồn tại không
		const room = await roomRepository.findById(id);
		if (!room) {
			throw new ClientException(404, 'Không tìm thấy phòng trọ.');
		}

		// 2. Authorization: Kiểm tra quyền sửa (Chỉ người tạo mới được sửa)
		if (room.createdBy !== userId) {
			throw new ClientException(403, 'Bạn không có quyền chỉnh sửa phòng trọ này.');
		}

		// 3. Thực hiện update
		try {
			return await roomRepository.updateRoom(id, dto);
		} catch (error) {
			if (error.code === 'P2003') {
				throw new ClientException(400, 'Dữ liệu liên kết không hợp lệ.');
			}
			throw error;
		}
	},

	async deleteRoom(id, userId) {
		// 1. Kiểm tra phòng có tồn tại không
		const room = await roomRepository.findById(id);
		if (!room) {
			throw new ClientException(404, 'Không tìm thấy phòng trọ.');
		}

		// 2. Authorization: Kiểm tra quyền xóa (Chỉ người tạo mới được xóa)
		if (room.createdBy !== userId) {
			throw new ClientException(403, 'Bạn không có quyền xóa phòng trọ này.');
		}

		// 3. Thực hiện xóa
		await roomRepository.deleteRoom(id);
		return { message: 'Xóa phòng trọ thành công.' };
	},
};
