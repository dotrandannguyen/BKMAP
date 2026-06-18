import prisma from '../../config/database.js';

class UserRepository {
	async getAllUserRepository() {
		// Chỉ trả về các trường an toàn — KHÔNG trả passwordHash, refreshToken, verifyToken
		return prisma.user.findMany({
			select: {
				id: true,
				email: true,
				userName: true,
				avatar: true,
				isVerified: true,
				createdAt: true,
			},
		});
	}
}

export default new UserRepository();
