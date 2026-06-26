import { adminRepository } from './admin.repository.js';
import { roomRepository } from '../room/room.repository.js';
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
		const { search, creatorEmail, approvalStatus } = query;

		const { total, rooms } = await adminRepository.findAllRooms({
			search,
			creatorEmail,
			approvalStatus,
			page,
			limit,
		});

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
		if (room.approvalStatus === 'ADMIN_HIDDEN') throw new ClientException(400, 'Phòng trọ này đã bị ẩn rồi.');

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
		if (room.approvalStatus !== 'ADMIN_HIDDEN') throw new ClientException(400, 'Phòng trọ này đang hiển thị hoặc không bị admin ẩn, không cần khôi phục.');

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

	async approveRoom(id) {
		if (!uuidValidate(id)) throw new ClientException(400, 'ID phòng trọ không hợp lệ.');
		const room = await adminRepository.findRoomById(id);
		if (!room) throw new ClientException(404, 'Không tìm thấy phòng trọ.');

		// Kiểm tra xem đây là duyệt bài mới hay duyệt yêu cầu chỉnh sửa (revision)
		const revision = room.revision || (await roomRepository.findRevisionByRoomId(id));

		if (revision) {
			// === LUỒNG B: Duyệt yêu cầu chỉnh sửa ===
			// 1. Apply payload từ revision vào phòng gốc
			await roomRepository.updateRoom(id, revision.payload, false);

			// 2. Xóa revision sau khi đã apply — đảm bảo không còn revision cũ
			await roomRepository.deleteRevisionByRoomId(id);

			// 3. Đảm bảo phòng gốc ở trạng thái APPROVED (có thể đã APPROVED rồi)
			const updated = await adminRepository.updateRoomStatus(id, 'APPROVED');

			// 4. Invalidate cache
			await delFromCache(`room:detail:${id}`);
			await invalidate('rooms:list:*');

			return updated;
		} else {
			// === LUỒNG A: Duyệt bài đăng mới ===
			if (room.approvalStatus !== 'PENDING_APPROVAL' && room.approvalStatus !== 'REJECTED') {
				throw new ClientException(400, `Phòng trọ này không ở trạng thái chờ duyệt hoặc từ chối. Trạng thái hiện tại: ${room.approvalStatus}`);
			}

			const updated = await adminRepository.updateRoomStatus(id, 'APPROVED');

			// Invalidate cache để cập nhật danh sách và chi tiết
			await delFromCache(`room:detail:${id}`);
			await invalidate('rooms:list:*');

			return updated;
		}
	},

	async rejectRoom(id, rejectionReason) {
		if (!uuidValidate(id)) throw new ClientException(400, 'ID phòng trọ không hợp lệ.');
		if (!rejectionReason || typeof rejectionReason !== 'string' || rejectionReason.trim().length < 10) {
			throw new ClientException(400, 'Lý do từ chối là bắt buộc và phải dài ít nhất 10 ký tự.');
		}

		const room = await adminRepository.findRoomById(id);
		if (!room) throw new ClientException(404, 'Không tìm thấy phòng trọ.');

		// Kiểm tra xem đây là từ chối bài mới hay từ chối yêu cầu chỉnh sửa (revision)
		const revision = room.revision || (await roomRepository.findRevisionByRoomId(id));

		if (revision) {
			// === LUỒNG B: Từ chối yêu cầu chỉnh sửa ===
			// Phòng gốc vẫn APPROVED — chỉ cần xóa revision và không apply gì cả
			await roomRepository.deleteRevisionByRoomId(id);

			// Ghi lý do từ chối vào phòng gốc (trường rejectionReason)
			const updated = await adminRepository.updateRoomStatus(id, 'APPROVED', rejectionReason.trim());

			// Invalidate cache
			await delFromCache(`room:detail:${id}`);
			await invalidate('rooms:list:*');

			return updated;
		} else {
			// === LUỒNG A: Từ chối bài đăng mới ===
			if (room.approvalStatus !== 'PENDING_APPROVAL') {
				throw new ClientException(400, `Phòng trọ này không ở trạng thái chờ duyệt. Trạng thái hiện tại: ${room.approvalStatus}`);
			}

			const updated = await adminRepository.updateRoomStatus(id, 'REJECTED', rejectionReason.trim());

			// Invalidate cache
			await delFromCache(`room:detail:${id}`);
			await invalidate('rooms:list:*');

			return updated;
		}
	},


	// ============ DASHBOARD ============

	async getDashboard() {
		return adminRepository.getDashboardStats();
	},
};
