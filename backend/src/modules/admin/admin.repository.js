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

	async findAllRooms({ search, creatorEmail, page = 1, limit = 20 }) {
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
			},
		});
	},

	async hideRoom(id) {
		return prisma.room.update({
			where: { id },
			data: { isHidden: true },
		});
	},

	async restoreRoom(id) {
		return prisma.room.update({
			where: { id },
			data: { isHidden: false },
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
		const [totalUsers, totalRooms, activeRooms, hiddenRooms, bannedUsers] = await prisma.$transaction([
			prisma.user.count(),
			prisma.room.count(),
			prisma.room.count({ where: { isHidden: false, creator: { isBanned: false } } }),
			prisma.room.count({ where: { OR: [{ isHidden: true }, { creator: { isBanned: true } }] } }),
			prisma.user.count({ where: { isBanned: true } }),
		]);

		return { totalUsers, totalRooms, activeRooms, hiddenRooms, bannedUsers };
	},
};
