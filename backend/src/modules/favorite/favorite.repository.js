import prisma from '../../config/database.js';

const roomInclude = {
	owner: true,
	images: {
		orderBy: { displayOrder: 'asc' },
	},
	features: {
		include: { feature: true },
	},
	creator: {
		select: { id: true, userName: true, email: true, avatar: true },
	},
};

export const favoriteRepository = {
	async findByUserId(userId) {
		return await prisma.userFavorite.findMany({
			where: { userId },
			orderBy: { createdAt: 'desc' },
			include: {
				room: {
					include: roomInclude,
				},
			},
		});
	},

	async findRoomById(roomId) {
		return await prisma.room.findUnique({
			where: { id: roomId },
			select: { id: true },
		});
	},

	async upsert(userId, roomId) {
		return await prisma.userFavorite.upsert({
			where: {
				userId_roomId: {
					userId,
					roomId,
				},
			},
			update: {},
			create: {
				userId,
				roomId,
			},
			include: {
				room: {
					include: roomInclude,
				},
			},
		});
	},

	async delete(userId, roomId) {
		return await prisma.userFavorite.deleteMany({
			where: {
				userId,
				roomId,
			},
		});
	},
};
