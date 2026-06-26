import { HttpResponse } from '../../common/dtos/index.js';
import { roomService } from './room.service.js';

export const roomController = {
	async createRoom(req, res, next) {
		try {
			const userId = req.user.id;
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
			// NÂNG CẤP: Truyền thêm req.user để phân quyền xem bài "của tôi" hoặc bài chưa duyệt
			const data = await roomService.getRooms(req.query, req.user);
			return new HttpResponse(res).success(data);
		} catch (error) {
			next(error);
		}
	},

	async getRoomById(req, res, next) {
		try {
			const { id } = req.params;
			const data = await roomService.getRoomById(id, req.user);
			return new HttpResponse(res).success(data);
		} catch (error) {
			next(error);
		}
	},

	async updateRoom(req, res, next) {
		try {
			const { id } = req.params;
			const userId = req.user.id;
			const role = req.user.role;
			const data = await roomService.updateRoom(id, userId, role, req.body);
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
			const role = req.user.role;
			const data = await roomService.deleteRoom(id, userId, role);
			return new HttpResponse(res).success(data);
		} catch (error) {
			next(error);
		}
	},

	async uploadImage(req, res, next) {
		try {
			const { id } = req.params;
			const userId = req.user.id;
			const role = req.user.role;
			const data = await roomService.uploadRoomImage(id, userId, role, req.file, req.body);
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
			const role = req.user.role;
			const data = await roomService.deleteRoomImage(id, imageId, userId, role);
			return new HttpResponse(res).success(data);
		} catch (error) {
			next(error);
		}
	},

	async reorderImages(req, res, next) {
		try {
			const { id } = req.params;
			const userId = req.user.id;
			const role = req.user.role;
			const data = await roomService.reorderImages(id, userId, role, req.body);
			return new HttpResponse(res).success(data);
		} catch (error) {
			next(error);
		}
	},
};
