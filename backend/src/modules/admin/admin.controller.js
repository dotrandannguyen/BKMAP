import { HttpResponse } from '../../common/dtos/index.js';
import { adminService } from './admin.service.js';

export const adminController = {
	// ============ USER ============

	async getUsers(req, res, next) {
		try {
			const data = await adminService.getUsers(req.query);
			return new HttpResponse(res).success(data);
		} catch (error) {
			next(error);
		}
	},

	async getUserById(req, res, next) {
		try {
			const data = await adminService.getUserById(req.params.id);
			return new HttpResponse(res).success(data);
		} catch (error) {
			next(error);
		}
	},

	async getUserRooms(req, res, next) {
		try {
			const data = await adminService.getUserRooms(req.params.id);
			return new HttpResponse(res).success(data);
		} catch (error) {
			next(error);
		}
	},

	async banUser(req, res, next) {
		try {
			const data = await adminService.banUser(req.params.id, req.user.id);
			return new HttpResponse(res).success({ message: 'Đã khóa tài khoản thành công.', user: data });
		} catch (error) {
			next(error);
		}
	},

	async unbanUser(req, res, next) {
		try {
			const data = await adminService.unbanUser(req.params.id);
			return new HttpResponse(res).success({ message: 'Đã mở khóa tài khoản thành công.', user: data });
		} catch (error) {
			next(error);
		}
	},

	// ============ ROOM ============

	async getRooms(req, res, next) {
		try {
			const data = await adminService.getRooms(req.query);
			return new HttpResponse(res).success(data);
		} catch (error) {
			next(error);
		}
	},

	async getRoomById(req, res, next) {
		try {
			const data = await adminService.getRoomById(req.params.id);
			return new HttpResponse(res).success(data);
		} catch (error) {
			next(error);
		}
	},

	async hideRoom(req, res, next) {
		try {
			const data = await adminService.hideRoom(req.params.id);
			return new HttpResponse(res).success({ message: 'Đã ẩn phòng trọ thành công.', room: data });
		} catch (error) {
			next(error);
		}
	},

	async restoreRoom(req, res, next) {
		try {
			const data = await adminService.restoreRoom(req.params.id);
			return new HttpResponse(res).success({ message: 'Đã hiện lại phòng trọ thành công.', room: data });
		} catch (error) {
			next(error);
		}
	},

	async deleteRoom(req, res, next) {
		try {
			const data = await adminService.deleteRoom(req.params.id);
			return new HttpResponse(res).success(data);
		} catch (error) {
			next(error);
		}
	},

	async approveRoom(req, res, next) {
		try {
			const data = await adminService.approveRoom(req.params.id);
			return new HttpResponse(res).success({ message: 'Đã phê duyệt phòng trọ thành công.', room: data });
		} catch (error) {
			next(error);
		}
	},

	async rejectRoom(req, res, next) {
		try {
			const { rejectionReason } = req.body;
			const data = await adminService.rejectRoom(req.params.id, rejectionReason);
			return new HttpResponse(res).success({ message: 'Đã từ chối phòng trọ.', room: data });
		} catch (error) {
			next(error);
		}
	},

	// ============ DASHBOARD ============

	async getDashboard(req, res, next) {
		try {
			const data = await adminService.getDashboard();
			return new HttpResponse(res).success(data);
		} catch (error) {
			next(error);
		}
	},
};
