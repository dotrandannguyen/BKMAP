import { HttpResponse } from '../../common/dtos/index.js';
import { roomService } from './room.service.js';

export const roomController = {
	async createRoom(req, res, next) {
		try {
			const userId = req.user.id; // Lấy ID người dùng từ auth.middleware
			const data = await roomService.createRoom(req.body, userId);

			return new HttpResponse(res).created({
				message: 'Tạo phòng trọ thành công',
				room: data,
			});
		} catch (error) {
			next(error);
		}
	},

	async getRooms(req, res, next) {
		try {
			const data = await roomService.getRooms(req.query);
			return new HttpResponse(res).success(data);
		} catch (error) {
			next(error);
		}
	},

	async getRoomById(req, res, next) {
		try {
			const { id } = req.params;
			const data = await roomService.getRoomById(id);
			return new HttpResponse(res).success(data);
		} catch (error) {
			next(error);
		}
	},

	async updateRoom(req, res, next) {
		try {
			const { id } = req.params;
			const userId = req.user.id;
			const data = await roomService.updateRoom(id, userId, req.body);
			return new HttpResponse(res).success({
				message: 'Cập nhật phòng trọ thành công',
				room: data,
			});
		} catch (error) {
			next(error);
		}
	},

	async deleteRoom(req, res, next) {
		try {
			const { id } = req.params;
			const userId = req.user.id;
			const data = await roomService.deleteRoom(id, userId);
			return new HttpResponse(res).success(data);
		} catch (error) {
			next(error);
		}
	},

	async uploadImage(req, res, next) {
		try {
			const { id } = req.params;
			const userId = req.user.id;
			
			// Build baseUrl manually if needed, or pass it via req.body
			req.body.baseUrl = `${req.protocol}://${req.get('host')}`;
			
			const data = await roomService.uploadRoomImage(id, userId, req.file, req.body);
			return new HttpResponse(res).success({
				message: 'Tải ảnh lên thành công',
				image: data,
			});
		} catch (error) {
			next(error);
		}
	},

	async deleteImage(req, res, next) {
		try {
			const { id, imageId } = req.params;
			const userId = req.user.id;
			const data = await roomService.deleteRoomImage(id, imageId, userId);
			return new HttpResponse(res).success(data);
		} catch (error) {
			next(error);
		}
	},

	async reorderImages(req, res, next) {
		try {
			const { id } = req.params;
			const userId = req.user.id;
			const data = await roomService.reorderImages(id, userId, req.body);
			return new HttpResponse(res).success(data);
		} catch (error) {
			next(error);
		}
	},
};
