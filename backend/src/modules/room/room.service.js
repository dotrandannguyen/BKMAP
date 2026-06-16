import { roomRepository } from './room.repository.js';
import { ClientException } from '../../common/exceptions/index.js';
import { supabase } from '../../config/supabase.js';
import sharp from 'sharp';
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

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
		if (!uuidValidate(id)) {
			throw new ClientException(400, 'ID phòng trọ không hợp lệ.');
		}
		const room = await roomRepository.findById(id);
		if (!room) {
			throw new ClientException(404, 'Không tìm thấy phòng trọ.');
		}
		return room;
	},

	async updateRoom(id, userId, dto) {
		if (!uuidValidate(id)) {
			throw new ClientException(400, 'ID phòng trọ không hợp lệ.');
		}

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
		if (!uuidValidate(id)) {
			throw new ClientException(400, 'ID phòng trọ không hợp lệ.');
		}

		// 1. Kiểm tra phòng có tồn tại không
		const room = await roomRepository.findById(id);
		if (!room) {
			throw new ClientException(404, 'Không tìm thấy phòng trọ.');
		}

		// 2. Authorization: Kiểm tra quyền xóa
		if (room.createdBy !== userId) {
			throw new ClientException(403, 'Bạn không có quyền xóa phòng trọ này.');
		}

		// 3. Thực hiện xóa DB trước (Cascade sẽ xóa RoomImage)
		await roomRepository.deleteRoom(id);

		// 4. Nếu xóa DB thành công, tiến hành xóa file trên Supabase để dọn dẹp storage
		if (room.images && room.images.length > 0) {
			const storagePaths = room.images
				.map((img) => img.storagePath)
				.filter((path) => path != null); // Lọc bỏ những ảnh cũ không có storagePath

			if (storagePaths.length > 0) {
				const { error } = await supabase.storage.from('BKMAP-images').remove(storagePaths);
				if (error) {
					console.error('Lỗi khi xóa ảnh trên Supabase (deleteRoom):', error);
					// Không throw error vì thao tác chính (xóa room) đã thành công
				}
			}
		}

		return { message: 'Xóa phòng trọ thành công.' };
	},

	async uploadRoomImage(roomId, userId, file, body) {
		const displayOrder = body && body.displayOrder ? parseInt(body.displayOrder, 10) : 0;

		// Kiểm tra id hợp lệ
		if (!uuidValidate(roomId)) {
			throw new ClientException(400, 'ID phòng trọ không hợp lệ.');
		}

		// 1. Kiểm tra quyền sở hữu phòng
		const room = await roomRepository.findById(roomId);
		if (!room) {
			throw new ClientException(404, 'Không tìm thấy phòng trọ.');
		}
		if (room.createdBy !== userId) {
			throw new ClientException(403, 'Bạn không có quyền thêm ảnh cho phòng trọ này.');
		}

		// Kiểm tra số lượng ảnh tối đa (Ví dụ: 10 ảnh/phòng)
		const currentImageCount = await roomRepository.countImagesByRoomId(roomId);
		if (currentImageCount >= 10) {
			throw new ClientException(400, 'Phòng trọ này đã đạt giới hạn tối đa 10 ảnh.');
		}

		if (!file || !file.buffer) {
			throw new ClientException(400, 'Không tìm thấy file ảnh.');
		}

		// 2. Xử lý ảnh: Resize max 1200px, convert to WebP, quality 80
		const processedImageBuffer = await sharp(file.buffer)
			.resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
			.webp({ quality: 80 })
			.toBuffer();

		const fileName = `${roomId}/${uuidv4()}.webp`;

		// 3. Upload lên Supabase
		const { data, error } = await supabase.storage
			.from('BKMAP-images')
			.upload(`rooms/${fileName}`, processedImageBuffer, {
				contentType: 'image/webp',
				upsert: true,
			});

		if (error) {
			throw new Error(`Upload ảnh lên Supabase thất bại: ${error.message}`);
		}

		const storagePath = data.path; // Đường dẫn tương đối lưu trên storage

		// Lấy URL public
		const { data: publicUrlData } = supabase.storage
			.from('BKMAP-images')
			.getPublicUrl(storagePath);

		const imageUrl = publicUrlData.publicUrl;

		// 4. Lưu database
		return await roomRepository.addImageToRoom(roomId, imageUrl, displayOrder, storagePath);
	},

	async deleteRoomImage(roomId, imageId, userId) {
		if (!uuidValidate(roomId) || !uuidValidate(imageId)) {
			throw new ClientException(400, 'ID không hợp lệ.');
		}

		// 1. Kiểm tra quyền sở hữu phòng
		const room = await roomRepository.findById(roomId);
		if (!room) {
			throw new ClientException(404, 'Không tìm thấy phòng trọ.');
		}
		if (room.createdBy !== userId) {
			throw new ClientException(403, 'Bạn không có quyền xóa ảnh của phòng trọ này.');
		}

		// 2. Tìm ảnh cần xóa
		const image = await roomRepository.findImageById(imageId);
		if (!image || image.roomId !== roomId) {
			throw new ClientException(404, 'Không tìm thấy ảnh.');
		}

		// 3. Xóa record trong Database trước để đảm bảo tính nhất quán
		await roomRepository.deleteImageById(imageId);

		// 4. Xóa file thực tế trên Supabase nếu có storagePath
		if (image.storagePath) {
			const { error } = await supabase.storage.from('BKMAP-images').remove([image.storagePath]);
			if (error) {
				// Chỉ log lỗi để xử lý dọn dẹp sau, không văng lỗi ra cho client
				// vì giao diện đã không còn thấy ảnh (do xóa DB thành công)
				console.error(`Lỗi khi xóa ảnh trên Supabase: ${image.storagePath}`, error);
			}
		}

		return { message: 'Xóa ảnh thành công.' };
	},

	async reorderImages(roomId, userId, payload) {
		if (!uuidValidate(roomId)) {
			throw new ClientException(400, 'ID phòng trọ không hợp lệ.');
		}

		// 1. Kiểm tra quyền sở hữu phòng
		const room = await roomRepository.findById(roomId);
		if (!room) {
			throw new ClientException(404, 'Không tìm thấy phòng trọ.');
		}
		if (room.createdBy !== userId) {
			throw new ClientException(403, 'Bạn không có quyền sửa đổi phòng trọ này.');
		}

		const imagesData = payload.images;
		if (!Array.isArray(imagesData) || imagesData.length === 0) {
			throw new ClientException(400, 'Danh sách ảnh không hợp lệ.');
		}

		// 2. Thực hiện update thứ tự ảnh
		await roomRepository.updateImagesOrder(imagesData);
		return { message: 'Cập nhật thứ tự ảnh thành công.' };
	},
};
