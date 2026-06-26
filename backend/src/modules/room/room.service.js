import { roomRepository } from './room.repository.js';
import { ClientException } from '../../common/exceptions/index.js';
import { supabase } from '../../config/supabase.js';
import sharp from 'sharp';
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';
import { processCleanup } from '../../workers/cleanup.worker.js';
import { del as delFromCache, invalidate } from '../../common/services/cache.service.js';

// Helper function for cache invalidation
const invalidateRoomCaches = async (roomId) => {
    if (roomId) {
        await delFromCache(`room:detail:${roomId}`);
    }
    // Invalidate homepage cache
    await invalidate('rooms:list:*');
};


export const roomService = {
	async createRoom(dto, userId) {
		try {
			const newRoom = await roomRepository.createRoom(dto, userId);
			
			// Invalidate Cache
			await invalidateRoomCaches();

			return newRoom;
		} catch (error) {
			if (error.code === 'P2003') {
				throw new ClientException(400, 'Dữ liệu liên kết không hợp lệ (User, Owner hoặc Tiện ích không tồn tại).');
			}
			throw error;
		}
	},

	async getRooms(query, user = null) {
		const page = query.page || 1;
		const limit = query.limit || 10;
		const skip = (page - 1) * limit;

		const filters = {
			minPrice: query.minPrice,
			maxPrice: query.maxPrice,
			minArea: query.minArea,
			maxArea: query.maxArea,
			distanceToBk: query.distanceToBk,
			status: query.status,
			ward: query.ward,
			search: query.search,
			ownerEmail: query.ownerEmail,
			approvalStatus: query.approvalStatus,
		};

		// Nếu là Admin, có thể xem mọi trạng thái. 
		// Nếu là User thường, chỉ có thể xem 'APPROVED' (mặc định trong repo) 
		// hoặc xem chính bài của họ.
		if (user) {
			if (user.role === 'ADMIN') {
				// Admin filter tự do
			} else if (query.mine === 'true') {
				filters.userId = user.id; // Repo sẽ bỏ qua filter approvalStatus nếu có userId
			}
		}

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

	async getRoomById(id, user = null) {
		if (!uuidValidate(id)) {
			throw new ClientException(400, 'ID phòng trọ không hợp lệ.');
		}
		const room = await roomRepository.findById(id);
		if (!room) {
			throw new ClientException(404, 'Không tìm thấy phòng trọ.');
		}

		// Logic check quyền xem
		if (room.approvalStatus !== 'APPROVED') {
			// Nếu bài đăng không được duyệt, chỉ Admin hoặc chủ bài đăng mới được xem
			if (!user || (user.role !== 'ADMIN' && room.createdBy !== user.id)) {
				throw new ClientException(404, 'Không tìm thấy phòng trọ.');
			}
		}

		return room;
	},

	async updateRoom(id, userId, role, dto) {
		if (!uuidValidate(id)) {
			throw new ClientException(400, 'ID phòng trọ không hợp lệ.');
		}

		const room = await roomRepository.findById(id);
		if (!room) {
			throw new ClientException(404, 'Không tìm thấy phòng trọ.');
		}

		if (room.createdBy !== userId && role !== 'ADMIN') {
			throw new ClientException(403, 'Bạn không có quyền chỉnh sửa phòng trọ này.');
		}

		// Nếu là Admin, cho phép sửa trực tiếp và xóa revision cũ (nếu có)
		if (role === 'ADMIN') {
			const updatedRoom = await roomRepository.updateRoom(id, dto, false);
			// Nếu admin tự sửa trực tiếp thì xóa revision cũ đang chờ (nếu có)
			if (room.revision) {
				await roomRepository.deleteRevisionByRoomId(id);
			}
			await invalidateRoomCaches(id);
			return updatedRoom;
		}

		// Nếu là người dùng thường: tạo/đè bản nháp revision và ẩn phòng chờ duyệt
		try {
			// upsertRevision đảm bảo mỗi phòng chỉ có đúng 1 revision tại 1 thời điểm.
			// Nếu đã có revision cũ, payload mới sẽ ghi đè hoàn toàn (không tạo thêm bản mới).
			await roomRepository.upsertRevision(id, userId, dto);

			// Nếu phòng đã APPROVED, giữ nguyên trạng thái → phòng vẫn hiển thị
			// public với dữ liệu cũ cho đến khi Admin approve revision.
			// Chỉ chuyển về PENDING nếu bài chưa từng được duyệt.
			if (room.approvalStatus !== 'APPROVED') {
				await roomRepository.updateApprovalStatus(id, 'PENDING_APPROVAL');
			}

			// Invalidate Cache
			await invalidateRoomCaches(id);

			return await roomRepository.findById(id);
		} catch (error) {
			console.error('Error creating/updating revision:', error);
			throw new ClientException(500, 'Lỗi khi gửi yêu cầu chỉnh sửa.');
		}
	},


	async deleteRoom(id, userId, role) {
		if (!uuidValidate(id)) {
			throw new ClientException(400, 'ID phòng trọ không hợp lệ.');
		}

		const room = await roomRepository.findById(id);
		if (!room) {
			throw new ClientException(404, 'Không tìm thấy phòng trọ.');
		}

		if (room.createdBy !== userId && role !== 'ADMIN') {
			throw new ClientException(403, 'Bạn không có quyền xóa phòng trọ này.');
		}
		
		await roomRepository.deleteRoom(id);

		processCleanup().catch(console.error);

        // Invalidate Cache
        await invalidateRoomCaches(id);

		return { message: 'Xóa phòng trọ thành công.' };
	},

	async uploadRoomImage(roomId, userId, role, file, body) {
		const displayOrder = body && body.displayOrder ? parseInt(body.displayOrder, 10) : 0;
		if (!uuidValidate(roomId)) {
			throw new ClientException(400, 'ID phòng trọ không hợp lệ.');
		}
		const room = await roomRepository.findById(roomId);
		if (!room) {
			throw new ClientException(404, 'Không tìm thấy phòng trọ.');
		}
		if (room.createdBy !== userId && role !== 'ADMIN') {
			throw new ClientException(403, 'Bạn không có quyền thêm ảnh cho phòng trọ này.');
		}
		const currentImageCount = await roomRepository.countImagesByRoomId(roomId);
		if (currentImageCount >= 10) {
			throw new ClientException(400, 'Phòng trọ này đã đạt giới hạn tối đa 10 ảnh.');
		}
		if (!file || !file.buffer) {
			throw new ClientException(400, 'Không tìm thấy file ảnh.');
		}
        
		const processedImageBuffer = await sharp(file.buffer)
			.resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
			.webp({ quality: 80 })
			.toBuffer();

		const fileName = `${roomId}/${uuidv4()}.webp`;

		const { data, error } = await supabase.storage
			.from('BKMAP-images')
			.upload(`rooms/${fileName}`, processedImageBuffer, {
				contentType: 'image/webp',
				upsert: true,
			});

		if (error) {
			throw new Error(`Upload ảnh lên Supabase thất bại: ${error.message}`);
		}

		const storagePath = data.path;

		const { data: publicUrlData } = supabase.storage
			.from('BKMAP-images')
			.getPublicUrl(storagePath);

		const imageUrl = publicUrlData.publicUrl;

        const newImage = await roomRepository.addImageToRoom(roomId, imageUrl, displayOrder, storagePath);

		// Không reset approvalStatus khi upload ảnh để tránh ẩn phòng đã duyệt

        // Invalidate Cache
        await invalidateRoomCaches(roomId);

        return newImage;
	},

	async deleteRoomImage(roomId, imageId, userId, role) {
		if (!uuidValidate(roomId) || !uuidValidate(imageId)) {
			throw new ClientException(400, 'ID không hợp lệ.');
		}

		const room = await roomRepository.findById(roomId);
		if (!room) {
			throw new ClientException(404, 'Không tìm thấy phòng trọ.');
		}
		if (room.createdBy !== userId && role !== 'ADMIN') {
			throw new ClientException(403, 'Bạn không có quyền xóa ảnh của phòng trọ này.');
		}

		const image = await roomRepository.findImageById(imageId);
		if (!image || image.roomId !== roomId) {
			throw new ClientException(404, 'Không tìm thấy ảnh.');
		}

		await roomRepository.deleteImageById(imageId);

		// Không reset approvalStatus khi xóa ảnh để tránh ẩn phòng đã duyệt

		processCleanup().catch(console.error);

        // Invalidate Cache
        await invalidateRoomCaches(roomId);

		return { message: 'Xóa ảnh thành công.' };
	},

	async reorderImages(roomId, userId, role, payload) {
		if (!uuidValidate(roomId)) {
			throw new ClientException(400, 'ID phòng trọ không hợp lệ.');
		}

		const room = await roomRepository.findById(roomId);
		if (!room) {
			throw new ClientException(404, 'Không tìm thấy phòng trọ.');
		}
		if (room.createdBy !== userId && role !== 'ADMIN') {
			throw new ClientException(403, 'Bạn không có quyền sửa đổi phòng trọ này.');
		}

		const imagesData = payload.images;
		if (!Array.isArray(imagesData) || imagesData.length === 0) {
			throw new ClientException(400, 'Danh sách ảnh không hợp lệ.');
		}

		await roomRepository.updateImagesOrder(imagesData);

        // Invalidate Cache
        await invalidateRoomCaches(roomId);

		return { message: 'Cập nhật thứ tự ảnh thành công.' };
	},
};
