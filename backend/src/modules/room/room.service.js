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

	async getRooms(query) {
		// ... (rest of the function is unchanged)
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
		if (!uuidValidate(id)) {
			throw new ClientException(400, 'ID phòng trọ không hợp lệ.');
		}
		const room = await roomRepository.findById(id);
		if (!room) {
			throw new ClientException(404, 'Không tìm thấy phòng trọ.');
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

		try {
			const updatedRoom = await roomRepository.updateRoom(id, dto);
			processCleanup().catch(console.error);

            // Invalidate Cache
            await invalidateRoomCaches(id);

			return updatedRoom;
		} catch (error) {
			if (error.code === 'P2003') {
				throw new ClientException(400, 'Dữ liệu liên kết không hợp lệ.');
			}
			throw error;
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
        // ... (validation logic is unchanged)
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
