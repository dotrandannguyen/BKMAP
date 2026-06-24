import { adminRepository } from './admin.repository.js';
import { ClientException } from '../../common/exceptions/index.js';
import { validate as uuidValidate } from 'uuid';
import { processCleanup } from '../../workers/cleanup.worker.js';
import { invalidate, del as delFromCache } from '../../common/services/cache.service.js';

export const adminService = {
	// ============ USER ============

	async getUsers(query) {
		const page = parseInt(query.page) || 1;
		const limit = parseInt(query.limit) || 20;
		const { search } = query;

		const { total, users } = await adminRepository.findAllUsers({ search, page, limit });

		return {
			data: users,
			meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
		};
	},

	async getUserById(id) {
		if (!uuidValidate(id)) throw new ClientException(400, 'ID người dùng không hợp lệ.');
		const user = await adminRepository.findUserById(id);
		if (!user) throw new ClientException(404, 'Không tìm thấy người dùng.');
		return user;
	},

	async getUserRooms(userId) {
		if (!uuidValidate(userId)) throw new ClientException(400, 'ID người dùng không hợp lệ.');
		const user = await adminRepository.findUserById(userId);
		if (!user) throw new ClientException(404, 'Không tìm thấy người dùng.');
		return adminRepository.findRoomsByUserId(userId);
	},

	async banUser(targetId, adminId) {
		if (!uuidValidate(targetId)) throw new ClientException(400, 'ID không hợp lệ.');
		if (targetId === adminId) throw new ClientException(400, 'Không thể tự khóa tài khoản của chính mình.');

		const target = await adminRepository.findUserById(targetId);
		if (!target) throw new ClientException(404, 'Không tìm thấy người dùng.');
		if (target.role === 'ADMIN') throw new ClientException(403, 'Không thể khóa tài khoản Admin khác.');
		if (target.isBanned) throw new ClientException(400, 'Tài khoản này đã bị khóa rồi.');

		const updatedUser = await adminRepository.banUser(targetId);
		// Invalidate cache since banned user's rooms are no longer visible
		await invalidate('rooms:list:*');
		return updatedUser;
	},

	async unbanUser(targetId) {
		if (!uuidValidate(targetId)) throw new ClientException(400, 'ID không hợp lệ.');

		const target = await adminRepository.findUserById(targetId);
		if (!target) throw new ClientException(404, 'Không tìm thấy người dùng.');
		if (!target.isBanned) throw new ClientException(400, 'Tài khoản này chưa bị khóa.');

		const updatedUser = await adminRepository.unbanUser(targetId);
		// Invalidate cache since unbanned user's rooms are visible again
		await invalidate('rooms:list:*');
		return updatedUser;
	},

	// ============ ROOM ============

	async getRooms(query) {
		const page = parseInt(query.page) || 1;
		const limit = parseInt(query.limit) || 20;
		const { search, creatorEmail } = query;

		const { total, rooms } = await adminRepository.findAllRooms({ search, creatorEmail, page, limit });

		return {
			data: rooms,
			meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
		};
	},

	async getRoomById(id) {
		if (!uuidValidate(id)) throw new ClientException(400, 'ID phòng trọ không hợp lệ.');
		const room = await adminRepository.findRoomById(id);
		if (!room) throw new ClientException(404, 'Không tìm thấy phòng trọ.');
		return room;
	},

	async hideRoom(id) {
		if (!uuidValidate(id)) throw new ClientException(400, 'ID phòng trọ không hợp lệ.');
		const room = await adminRepository.findRoomById(id);
		if (!room) throw new ClientException(404, 'Không tìm thấy phòng trọ.');
		if (room.isHidden) throw new ClientException(400, 'Phòng trọ này đã bị ẩn rồi.');

		const updated = await adminRepository.hideRoom(id);
		// Invalidate cache
		await delFromCache(`room:detail:${id}`);
		await invalidate('rooms:list:*');
		return updated;
	},

	async restoreRoom(id) {
		if (!uuidValidate(id)) throw new ClientException(400, 'ID phòng trọ không hợp lệ.');
		const room = await adminRepository.findRoomById(id);
		if (!room) throw new ClientException(404, 'Không tìm thấy phòng trọ.');
		if (room.creator?.isBanned) throw new ClientException(400, 'Tài khoản người đăng đã bị khóa. Vui lòng mở khóa người dùng trước khi hiện lại phòng.');
		if (!room.isHidden) throw new ClientException(400, 'Phòng trọ này đang hiển thị, không cần khôi phục.');

		const updated = await adminRepository.restoreRoom(id);
		await invalidate('rooms:list:*');
		return updated;
	},

	async deleteRoom(id) {
		if (!uuidValidate(id)) throw new ClientException(400, 'ID phòng trọ không hợp lệ.');
		const room = await adminRepository.findRoomById(id);
		if (!room) throw new ClientException(404, 'Không tìm thấy phòng trọ.');

		await adminRepository.deleteRoom(id);

		// Trigger cleanup worker để xóa ảnh trên Supabase
		processCleanup().catch(console.error);

		// Invalidate cache
		await delFromCache(`room:detail:${id}`);
		await invalidate('rooms:list:*');

		return { message: 'Xóa phòng trọ thành công.' };
	},

	// ============ DASHBOARD ============

	async getDashboard() {
		return adminRepository.getDashboardStats();
	},
};
