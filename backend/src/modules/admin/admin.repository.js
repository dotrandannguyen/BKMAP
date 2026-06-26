import prisma from '../../config/database.js';

const SAFE_USER_SELECT = {
	id: true,
	email: true,
	userName: true,
	avatar: true,
	isVerified: true,
	role: true,
	isBanned: true,
	createdAt: true,
	updatedAt: true,
};

const ROOM_INCLUDE = {
	owner: true,
	images: { orderBy: { displayOrder: 'asc' }, take: 1 }, // chỉ lấy ảnh đầu
	creator: { select: { id: true, userName: true, email: true, isBanned: true } },
};

export const adminRepository = {
	// ============ USER ============

	async findAllUsers({ search, page = 1, limit = 20 }) {
		const skip = (page - 1) * limit;
		const where = {};

		if (search) {
			where.OR = [
				{ email: { contains: search, mode: 'insensitive' } },
				{ userName: { contains: search, mode: 'insensitive' } },
			];
		}

		const [total, users] = await prisma.$transaction([
			prisma.user.count({ where }),
			prisma.user.findMany({
				where,
				select: {
					...SAFE_USER_SELECT,
					_count: { select: { roomsCreated: true } },
				},
				skip,
				take: limit,
				orderBy: { createdAt: 'desc' },
			}),
		]);

		return { total, users };
	},

	async findUserById(id) {
		return prisma.user.findUnique({
			where: { id },
			select: {
				...SAFE_USER_SELECT,
				_count: { select: { roomsCreated: true, favorites: true } },
			},
		});
	},

	async findRoomsByUserId(userId) {
		return prisma.room.findMany({
			where: { createdBy: userId },
			include: ROOM_INCLUDE,
			orderBy: { createdAt: 'desc' },
		});
	},

	async banUser(id) {
		return prisma.user.update({
			where: { id },
			data: { isBanned: true },
			select: SAFE_USER_SELECT,
		});
	},

	async unbanUser(id) {
		return prisma.user.update({
			where: { id },
			data: { isBanned: false },
			select: SAFE_USER_SELECT,
		});
	},

	// ============ ROOM ============

	async findAllRooms({ search, creatorEmail, approvalStatus, page = 1, limit = 20 }) {
		const skip = (page - 1) * limit;
		const where = {};

		if (creatorEmail) {
			where.creator = { email: { contains: creatorEmail, mode: 'insensitive' } };
		}

		if (search) {
			where.OR = [
				{ title: { contains: search, mode: 'insensitive' } },
				{ address: { contains: search, mode: 'insensitive' } },
			];
		}

		if (approvalStatus && ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ADMIN_HIDDEN'].includes(approvalStatus)) {
			where.approvalStatus = approvalStatus;
		}

		const [total, rooms] = await prisma.$transaction([
			prisma.room.count({ where }),
			prisma.room.findMany({
				where,
				include: ROOM_INCLUDE,
				skip,
				take: limit,
				orderBy: { createdAt: 'desc' },
			}),
		]);

		return { total, rooms };
	},

	async findRoomById(id) {
		return prisma.room.findUnique({
			where: { id },
			include: {
				owner: true,
				creator: { select: { id: true, userName: true, email: true, avatar: true, isBanned: true } },
				images: { orderBy: { displayOrder: 'asc' } },
				features: { include: { feature: true } },
				revision: true, // Include revision để biết có yêu cầu chỉnh sửa đang chờ không
			},
		});
	},

	async hideRoom(id) {
		return prisma.room.update({
			where: { id },
			data: { approvalStatus: 'ADMIN_HIDDEN' },
		});
	},

	async restoreRoom(id) {
		return prisma.room.update({
			where: { id },
			data: { approvalStatus: 'APPROVED' },
		});
	},

	async updateRoomStatus(id, status, rejectionReason = null) {
		return prisma.room.update({
			where: { id },
			data: {
				approvalStatus: status,
				rejectionReason: status === 'REJECTED' ? rejectionReason : null,
			},
		});
	},

	// Tái sử dụng logic xóa phòng kèm cascade + outbox file delete
	async deleteRoom(id) {
		return prisma.$transaction(async (tx) => {
			const roomImages = await tx.roomImage.findMany({ where: { roomId: id } });
			const paths = roomImages.map((img) => img.storagePath).filter(Boolean);

			const deletedRoom = await tx.room.delete({ where: { id } });

			if (paths.length > 0) {
				await tx.outboxFileDelete.createMany({
					data: paths.map((path) => ({ storagePath: path, status: 'PENDING' })),
				});
			}

			return deletedRoom;
		});
	},

	// ============ DASHBOARD ============

	async getDashboardStats() {
		const now = new Date();
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

		const [
			totalUsers,
			totalRooms,
			approvedRooms,
			pendingRooms,
			rejectedRooms,
			adminHiddenRooms,
			bannedUsers,
			newUsersThisMonth,
			newRoomsThisMonth,
		] = await prisma.$transaction([
			prisma.user.count(),
			prisma.room.count(),
			prisma.room.count({ where: { approvalStatus: 'APPROVED' } }),
			prisma.room.count({ where: { approvalStatus: 'PENDING_APPROVAL' } }),
			prisma.room.count({ where: { approvalStatus: 'REJECTED' } }),
			prisma.room.count({ where: { approvalStatus: 'ADMIN_HIDDEN' } }),
			prisma.user.count({ where: { isBanned: true } }),
			prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
			prisma.room.count({ where: { createdAt: { gte: startOfMonth } } }),
		]);

		return {
			totalUsers,
			totalRooms,
			approvedRooms,
			pendingRooms,
			rejectedRooms,
			hiddenRooms: adminHiddenRooms,
			adminHiddenRooms,
			bannedUsers,
			newUsersThisMonth,
			newRoomsThisMonth,
			// Legacy compat
			activeRooms: approvedRooms,
		};
	},
};
