import { jest } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../app.js';
import prisma from '../config/database.js';
import { redisClient, redisStatus } from '../config/redis.js';

// ==========================================
// 1. MOCKS SETUP
// ==========================================

// Mock Nodemailer email sender utility
jest.mock('../common/utils/email.util.js', () => ({
	sendVerificationEmail: jest.fn().mockResolvedValue(true),
	sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
}));

// Mock sharp image processing library
jest.mock('sharp', () => {
	const sharpMock = () => {
		return {
			resize: () => sharpMock(),
			webp: () => sharpMock(),
			toBuffer: () => Promise.resolve(Buffer.from('mock-processed-image')),
		};
	};
	sharpMock.default = sharpMock;
	return sharpMock;
});

// Mock Supabase Storage Client
jest.mock('../config/supabase.js', () => ({
	supabase: {
		storage: {
			from: jest.fn(() => ({
				upload: jest.fn((filePath) => Promise.resolve({
					data: { path: filePath },
					error: null,
				})),
				getPublicUrl: jest.fn((path) => ({
					data: { publicUrl: `https://iekarjrbxvjcyjvuqkdh.supabase.co/storage/v1/object/public/BKMAP-images/${path}` },
				})),
			})),
		},
	},
}));

// Mock Uuid package to prevent ES module syntax errors in node_modules
jest.mock('uuid', () => {
	return {
		v4: () => '11111111-2222-3333-4444-555555555555',
		validate: (str) => {
			const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
			return regex.test(str);
		}
	};
});

// Mock cleanup worker background processing to prevent race conditions during tests
jest.mock('../workers/cleanup.worker.js', () => ({
	processCleanup: jest.fn().mockResolvedValue(true),
}));

// Mock Passport globally for Google OAuth and Initialization
jest.mock('passport', () => {
	const passportActual = jest.requireActual('passport');
	const mockPassport = {
		...passportActual,
		use: jest.fn(),
		initialize: jest.fn(() => (req, res, next) => next()),
		authenticate: jest.fn((strategy, options) => {
			return (req, res, next) => {
				if (strategy === 'google') {
					req.user = {
						googleId: 'google-test-id-12345',
						email: 'google_test_user@bkmap.com',
						userName: 'Google Test User',
						avatar: 'https://lh3.googleusercontent.com/a/mock-avatar-id',
					};
				}
				next();
			};
		}),
	};
	mockPassport.default = mockPassport;
	return mockPassport;
});

// Mock local geocoding fetch call
const originalFetch = global.fetch;
beforeAll(() => {
	global.fetch = jest.fn((url) => {
		if (url.includes('nominatim.openstreetmap.org')) {
			return Promise.resolve({
				ok: true,
				status: 200,
				json: () => Promise.resolve([
					{
						place_id: 123456,
						lat: "16.07380",
						lon: "108.14990",
						display_name: "Ngô Sĩ Liên, Liên Chiểu, Đà Nẵng, Việt Nam",
						boundingbox: ["16.073", "16.074", "108.149", "108.150"],
					}
				]),
			});
		}
		return Promise.reject(new Error(`Unhandled URL fetch: ${url}`));
	});
});

afterAll(async () => {
	global.fetch = originalFetch;
	// Close prisma connections
	await prisma.$disconnect();
});

// Mock Redis configuration module
jest.mock('../config/redis.js');

// ==========================================
// 2. DATABASE CLEANUP UTILITIES
// ==========================================
async function cleanTestDb() {
	const testUsers = await prisma.user.findMany({
		where: {
			OR: [
				{ email: { startsWith: 'test_user_' } },
				{ email: { startsWith: 'test_admin_' } },
				{ email: { startsWith: 'google_test_' } },
				{ email: 'test_verified@bkmap.com' },
				{ email: 'test_change_pass@bkmap.com' },
				{ email: 'test_banned@bkmap.com' },
				{ email: 'google_user_only@bkmap.com' },
				{ googleId: 'google-oauth-subject-id-unique' },
				{ googleId: 'google-test-id-12345' },
			]
		}
	});
	const testUserIds = testUsers.map(u => u.id);

	if (testUserIds.length > 0) {
		await prisma.roomRevision.deleteMany({
			where: { createdBy: { in: testUserIds } }
		});

		const rooms = await prisma.room.findMany({
			where: { createdBy: { in: testUserIds } }
		});
		const roomIds = rooms.map(r => r.id);

		if (roomIds.length > 0) {
			await prisma.roomImage.deleteMany({ where: { roomId: { in: roomIds } } });
			await prisma.roomFeature.deleteMany({ where: { roomId: { in: roomIds } } });
			await prisma.userFavorite.deleteMany({ where: { roomId: { in: roomIds } } });
			await prisma.room.deleteMany({ where: { id: { in: roomIds } } });
		}

		await prisma.userFavorite.deleteMany({ where: { userId: { in: testUserIds } } });
		await prisma.user.deleteMany({ where: { id: { in: testUserIds } } });
	}

	await prisma.owner.deleteMany({
		where: {
			userName: { startsWith: 'Test Owner' }
		}
	});

	await prisma.outboxFileDelete.deleteMany({
		where: {
			storagePath: { startsWith: 'rooms/' }
		}
	});
}

// ==========================================
// 3. SYSTEM TEST SUITE
// ==========================================
describe('BKMAP System Integration Automated Tests', () => {

	beforeEach(async () => {
		// Mock Redis state
		redisStatus.isReady = true;
		if (redisClient.__clear) redisClient.__clear();
		jest.clearAllMocks();
	});

	// Global test states to share IDs & tokens between scenarios
	let verifiedUserToken = '';
	let verifiedUserRefreshToken = '';
	let verifiedUserId = '';
	let adminUserToken = '';
	let adminUserId = '';
	let testRoomId = '';
	let testOwnerId = '';
	let testImageId = '';

	// Setup initial system state: Admin, User, Owner, etc.
	beforeAll(async () => {
		await cleanTestDb();

		// Create standard test admin
		const passwordHash = await bcrypt.hash('adminpassword123', 10);
		const adminUser = await prisma.user.create({
			data: {
				email: 'test_admin_super@bkmap.com',
				passwordHash,
				userName: 'Test Admin Super',
				role: 'ADMIN',
				isVerified: true,
			}
		});
		adminUserId = adminUser.id;

		// Get Admin Token via login
		const adminLoginRes = await request(app)
			.post('/api/auth/login')
			.send({ email: 'test_admin_super@bkmap.com', password: 'adminpassword123' });
		adminUserToken = adminLoginRes.body.data.accessToken;
	});

	afterAll(async () => {
		await cleanTestDb();
	});

	// ==========================================
	// GROUP A: AUTHENTICATION & ACCOUNT MANAGEMENT
	// ==========================================
	describe('A. Authentication & Account Management', () => {

		it('A1.1 Đăng ký thành công với thông tin hợp lệ', async () => {
			const res = await request(app)
				.post('/api/auth/register')
				.send({
					email: 'test_verified@bkmap.com',
					password: 'securepassword123',
					userName: 'Test User Verified'
				});

			expect(res.status).toBe(201);
			expect(res.body.success).toBe(true);
			expect(res.body.data).toHaveProperty('id');
			expect(res.body.data.email).toBe('test_verified@bkmap.com');

			const userInDb = await prisma.user.findUnique({ where: { email: 'test_verified@bkmap.com' } });
			expect(userInDb).not.toBeNull();
			expect(userInDb.isVerified).toBe(false);
			expect(userInDb.verifyToken).not.toBeNull();
			verifiedUserId = userInDb.id;
		});

		it('A1.2 Đăng ký với email đã tồn tại', async () => {
			const res = await request(app)
				.post('/api/auth/register')
				.send({
					email: 'test_verified@bkmap.com',
					password: 'securepassword123',
					userName: 'Test User Duplicate'
				});

			expect(res.status).toBe(409);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toContain('Email đã tồn tại.');
		});

		it('A1.3 Đăng ký thiếu trường bắt buộc', async () => {
			const res = await request(app)
				.post('/api/auth/register')
				.send({
					email: 'test_missing@bkmap.com',
					password: ''
				});

			expect(res.status).toBe(422);
			expect(res.body.success).toBe(false);
		});

		it('A1.4 Đăng ký với mật khẩu quá ngắn', async () => {
			const res = await request(app)
				.post('/api/auth/register')
				.send({
					email: 'test_short_pass@bkmap.com',
					password: '123',
					userName: 'Short Pass User'
				});

			expect(res.status).toBe(422);
		});

		it('A1.5 Đăng ký với userName quá ngắn', async () => {
			const res = await request(app)
				.post('/api/auth/register')
				.send({
					email: 'test_short_name@bkmap.com',
					password: 'securepassword123',
					userName: 'A'
				});

			expect(res.status).toBe(422);
		});

		it('A1.6 Đăng ký với email sai định dạng', async () => {
			const res = await request(app)
				.post('/api/auth/register')
				.send({
					email: 'invalid_email_format',
					password: 'securepassword123',
					userName: 'Invalid Email User'
				});

			expect(res.status).toBe(422);
		});

		it('A2.1 Xác thực thành công bằng token hợp lệ', async () => {
			const user = await prisma.user.findUnique({ where: { email: 'test_verified@bkmap.com' } });
			const token = user.verifyToken;

			const res = await request(app)
				.post('/api/auth/verify-email')
				.send({ token });

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);

			const updatedUser = await prisma.user.findUnique({ where: { email: 'test_verified@bkmap.com' } });
			expect(updatedUser.isVerified).toBe(true);
		});

		it('A2.2 Xác thực bằng token đã hết hạn (> 24 giờ)', async () => {
			const user = await prisma.user.create({
				data: {
					email: 'test_user_expired@bkmap.com',
					passwordHash: 'dummyhash',
					userName: 'Expired Token User',
					verifyToken: 'expired-token-uuid-1234',
					tokenExpires: new Date(Date.now() - 3600 * 1000 * 25), // 25 hours ago
				}
			});

			const res = await request(app)
				.post('/api/auth/verify-email')
				.send({ token: 'expired-token-uuid-1234' });

			expect(res.status).toBe(400);
			expect(res.body.message).toContain('Token Expired.');
		});

		it('A2.3 Xác thực bằng token sai / không tồn tại', async () => {
			const res = await request(app)
				.post('/api/auth/verify-email')
				.send({ token: 'wrong-and-nonexistent-token' });

			expect(res.status).toBe(400);
			expect(res.body.message).toContain('Invalid Token.');
		});

		it('A2.4 Xác thực qua link GET trong email', async () => {
			const user = await prisma.user.create({
				data: {
					email: 'test_user_get_verify@bkmap.com',
					passwordHash: 'dummyhash',
					userName: 'Get Verify User',
					verifyToken: 'get-verify-token-123',
					tokenExpires: new Date(Date.now() + 3600 * 1000 * 2), // 2 hours expiry
				}
			});

			const res = await request(app)
				.get('/api/auth/verify-email?token=get-verify-token-123');

			expect(res.status).toBe(200);
			expect(res.text).toContain('Xác thực tài khoản thành công!');
		});

		it('A3.1 Đăng nhập thành công', async () => {
			const res = await request(app)
				.post('/api/auth/login')
				.send({
					email: 'test_verified@bkmap.com',
					password: 'securepassword123'
				});

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data).toHaveProperty('accessToken');
			verifiedUserToken = res.body.data.accessToken;

			// Extract refresh token from Set-Cookie header
			const cookieHeader = res.headers['set-cookie'] || [];
			const refreshTokenCookie = cookieHeader.find(cookie => cookie.startsWith('refreshToken='));
			expect(refreshTokenCookie).toBeDefined();
			verifiedUserRefreshToken = refreshTokenCookie.split(';')[0].split('=')[1];
		});

		it('A3.2 Đăng nhập sai mật khẩu', async () => {
			const res = await request(app)
				.post('/api/auth/login')
				.send({
					email: 'test_verified@bkmap.com',
					password: 'wrongpassword'
				});

			expect(res.status).toBe(401);
			expect(res.body.success).toBe(false);
		});

		it('A3.3 Đăng nhập với email chưa đăng ký', async () => {
			const res = await request(app)
				.post('/api/auth/login')
				.send({
					email: 'unregistered_email@bkmap.com',
					password: 'securepassword123'
				});

			expect(res.status).toBe(401);
		});

		it('A3.5 Đăng nhập tài khoản bị khóa (isBanned: true)', async () => {
			const passwordHash = await bcrypt.hash('banneduserpassword', 10);
			await prisma.user.create({
				data: {
					email: 'test_banned@bkmap.com',
					passwordHash,
					userName: 'Banned User',
					isVerified: true,
					isBanned: true,
				}
			});

			const res = await request(app)
				.post('/api/auth/login')
				.send({
					email: 'test_banned@bkmap.com',
					password: 'banneduserpassword'
				});

			expect(res.status).toBe(401);
			expect(res.body.message).toContain('Tài khoản của bạn đã bị khóa.');
		});

		it('A3.6 Đăng nhập bằng email Google (không có mật khẩu local)', async () => {
			await prisma.user.create({
				data: {
					email: 'google_test_user_only@bkmap.com',
					userName: 'Google User Only',
					isVerified: true,
					authProvider: 'google',
					googleId: 'google-oauth-subject-id-unique'
				}
			});

			const res = await request(app)
				.post('/api/auth/login')
				.send({
					email: 'google_test_user_only@bkmap.com',
					password: 'anypassword123'
				});

			expect(res.status).toBe(401);
			expect(res.body.message).toContain('Tài khoản này sử dụng đăng nhập Google.');
		});

		it('A4.1 - A4.2 Luồng Google OAuth hoàn chỉnh và liên kết email', async () => {
			const res = await request(app)
				.get('/api/auth/google/callback');

			expect(res.status).toBe(302); // Redirect to Frontend
			expect(res.headers.location).toContain('/login?');
			expect(res.headers.location).toContain('google_test_user%40bkmap.com');
		});

		it('A5.1 Đổi mật khẩu thành công', async () => {
			const passwordHash = await bcrypt.hash('oldpassword123', 10);
			const changePassUser = await prisma.user.create({
				data: {
					email: 'test_change_pass@bkmap.com',
					passwordHash,
					userName: 'Change Password User',
					isVerified: true,
				}
			});

			const loginRes = await request(app)
				.post('/api/auth/login')
				.send({ email: 'test_change_pass@bkmap.com', password: 'oldpassword123' });
			const token = loginRes.body.data.accessToken;

			const changeRes = await request(app)
				.post('/api/auth/change-password')
				.set('Authorization', `Bearer ${token}`)
				.send({
					oldPassword: 'oldpassword123',
					newPassword: 'newsecurepassword123',
					confirmPassword: 'newsecurepassword123'
				});

			expect(changeRes.status).toBe(200);
			expect(changeRes.body.success).toBe(true);

			// Re-login with new password
			const newLoginRes = await request(app)
				.post('/api/auth/login')
				.send({ email: 'test_change_pass@bkmap.com', password: 'newsecurepassword123' });
			expect(newLoginRes.status).toBe(200);
		});

		it('A5.2 Đổi mật khẩu sai mật khẩu cũ', async () => {
			const loginRes = await request(app)
				.post('/api/auth/login')
				.send({ email: 'test_change_pass@bkmap.com', password: 'newsecurepassword123' });
			const token = loginRes.body.data.accessToken;

			const changeRes = await request(app)
				.post('/api/auth/change-password')
				.set('Authorization', `Bearer ${token}`)
				.send({
					oldPassword: 'wrongoldpassword',
					newPassword: 'anothernewpassword123',
					confirmPassword: 'anothernewpassword123'
				});

			expect(changeRes.status).toBe(401);
		});

		it('A5.4 Mật khẩu mới và xác nhận không khớp', async () => {
			const loginRes = await request(app)
				.post('/api/auth/login')
				.send({ email: 'test_change_pass@bkmap.com', password: 'newsecurepassword123' });
			const token = loginRes.body.data.accessToken;

			const changeRes = await request(app)
				.post('/api/auth/change-password')
				.set('Authorization', `Bearer ${token}`)
				.send({
					oldPassword: 'newsecurepassword123',
					newPassword: 'anothernewpassword123',
					confirmPassword: 'mismatchpassword'
				});

			expect(changeRes.status).toBe(422);
		});

		it('A6.1 Refresh token hợp lệ (từ cookie)', async () => {
			const res = await request(app)
				.post('/api/auth/refresh-token')
				.set('Cookie', [`refreshToken=${verifiedUserRefreshToken}`]);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data).toHaveProperty('accessToken');
		});

		it('A6.2 Refresh token hết hạn hoặc bị thu hồi', async () => {
			const res = await request(app)
				.post('/api/auth/refresh-token')
				.set('Cookie', ['refreshToken=invalidrefreshtokenstring']);

			expect(res.status).toBe(401);
		});

		it('A7.1 Đăng xuất thành công', async () => {
			const res = await request(app)
				.post('/api/auth/logout')
				.set('Authorization', `Bearer ${verifiedUserToken}`);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.message).toContain('Đăng xuất thành công.');
		});

	});

	// ==========================================
	// GROUP B: ROOM MANAGEMENT (HOST)
	// ==========================================
	describe('B. Room Management (Host)', () => {

		beforeAll(async () => {
			const loginRes = await request(app)
				.post('/api/auth/login')
				.send({ email: 'test_verified@bkmap.com', password: 'securepassword123' });
			verifiedUserToken = loginRes.body.data.accessToken;
		});

		it('B1.1 - B1.2 Đăng tin thành công với vị trí & autocomplete địa chỉ', async () => {
			const res = await request(app)
				.post('/api/rooms')
				.set('Authorization', `Bearer ${verifiedUserToken}`)
				.send({
					title: 'Phòng trọ giá tốt ngõ Ngô Sĩ Liên gần trường Bách Khoa',
					address: '15 Ngô Sĩ Liên, Liên Chiểu, Đà Nẵng',
					street: 'Ngô Sĩ Liên',
					ward: 'Hòa Khánh Bắc',
					latitude: 16.07380,
					longitude: 108.14990,
					distanceToBk: 0.8,
					price: 1500000,
					area: 25.5,
					electricityPrice: '3,500đ/kWh',
					waterPrice: '10,000đ/m3',
					otherCosts: 'Wifi 50k/tháng',
					status: 'AVAILABLE',
					sharedOwner: false,
					curfew: '23:00',
					description: 'Phòng trọ đầy đủ tiện nghi, an ninh tốt, gần chợ Hòa Khánh và trường đại học Bách Khoa.',
					ownerName: 'Test Owner A',
					ownerPhone: '0987654321',
					features: ['WiFi', 'Điều hòa', 'Gác lửng']
				});

			expect(res.status).toBe(201);
			expect(res.body.success).toBe(true);
			expect(res.body.data.room).toHaveProperty('id');
			testRoomId = res.body.data.room.id;
			testOwnerId = res.body.data.room.ownerId;
		});

		it('B1.3 Validation Zod chặn ngay khi điền sai', async () => {
			const res = await request(app)
				.post('/api/rooms')
				.set('Authorization', `Bearer ${verifiedUserToken}`)
				.send({
					title: '', 
					address: '15 Ngô Sĩ Liên, Liên Chiểu, Đà Nẵng',
					price: -1000, 
					ownerPhone: 'abc' 
				});

			expect(res.status).toBe(422);
			expect(res.body.success).toBe(false);
		});

		it('B2.1 Chỉnh sửa phòng trọ thành công', async () => {
			const res = await request(app)
				.patch(`/api/rooms/${testRoomId}`)
				.set('Authorization', `Bearer ${verifiedUserToken}`)
				.send({
					title: 'Phòng trọ giá tốt ngõ Ngô Sĩ Liên - Cập Nhật',
					price: 1600000,
				});

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);

			// Standard user edits create a RoomRevision in the DB
			const revision = await prisma.roomRevision.findUnique({ where: { roomId: testRoomId } });
			expect(revision).not.toBeNull();
			expect(revision.payload.price).toBe(1600000);
			expect(revision.payload.title).toBe('Phòng trọ giá tốt ngõ Ngô Sĩ Liên - Cập Nhật');
		});

		it('B2.2 Chỉnh sửa phòng của người khác (không phải chủ, không phải ADMIN)', async () => {
			await request(app)
				.post('/api/auth/register')
				.send({
					email: 'test_user_other@bkmap.com',
					password: 'securepassword123',
					userName: 'Test User Other'
				});
			const userObj = await prisma.user.findUnique({ where: { email: 'test_user_other@bkmap.com' } });
			await prisma.user.update({ where: { id: userObj.id }, data: { isVerified: true } });

			const otherLoginRes = await request(app)
				.post('/api/auth/login')
				.send({ email: 'test_user_other@bkmap.com', password: 'securepassword123' });
			const otherToken = otherLoginRes.body.data.accessToken;

			const res = await request(app)
				.patch(`/api/rooms/${testRoomId}`)
				.set('Authorization', `Bearer ${otherToken}`)
				.send({
					price: 1800000,
				});

			expect(res.status).toBe(403);
		});

		it('B4.1 Upload ảnh phòng thành công', async () => {
			const dummyFileBuffer = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63601805a360148c00000000ffff03000006000557bfabd40000000049454e44ae426082', 'hex');

			const res = await request(app)
				.post(`/api/rooms/${testRoomId}/image`)
				.set('Authorization', `Bearer ${verifiedUserToken}`)
				.attach('file', dummyFileBuffer, 'pixel.png')
				.field('displayOrder', 1);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.image).toHaveProperty('id');
			testImageId = res.body.data.image.id;
		});

		it('B5.1 Xóa ảnh thành công', async () => {
			const res = await request(app)
				.delete(`/api/rooms/${testRoomId}/images/${testImageId}`)
				.set('Authorization', `Bearer ${verifiedUserToken}`);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);

			const imageInDb = await prisma.roomImage.findUnique({ where: { id: testImageId } });
			expect(imageInDb).toBeNull();

			const outboxInDb = await prisma.outboxFileDelete.findFirst({
				where: { storagePath: { contains: testRoomId } }
			});
			expect(outboxInDb).not.toBeNull();
			expect(outboxInDb.status).toBe('PENDING');
		});

		it('B3.2 Xóa phòng của người khác (không phải chủ, không phải ADMIN)', async () => {
			const otherLoginRes = await request(app)
				.post('/api/auth/login')
				.send({ email: 'test_user_other@bkmap.com', password: 'securepassword123' });
			const otherToken = otherLoginRes.body.data.accessToken;

			const res = await request(app)
				.delete(`/api/rooms/${testRoomId}`)
				.set('Authorization', `Bearer ${otherToken}`);

			expect(res.status).toBe(403);
		});

		it('B3.1 Chủ trọ xóa phòng thành công', async () => {
			const res = await request(app)
				.delete(`/api/rooms/${testRoomId}`)
				.set('Authorization', `Bearer ${verifiedUserToken}`);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);

			const roomInDb = await prisma.room.findUnique({ where: { id: testRoomId } });
			expect(roomInDb).toBeNull();
		});

	});

	// ==========================================
	// GROUP C: SAVED / FAVORITES LIST
	// ==========================================
	describe('C. Saved / Favorites List', () => {

		let roomAId = '';

		beforeAll(async () => {
			const owner = await prisma.owner.create({
				data: { userName: 'Test Owner C', phoneNumber: '0912345678' }
			});

			const room = await prisma.room.create({
				data: {
					title: 'Phòng trọ ngõ C, Hòa Khánh Nam',
					address: 'Hòa Khánh Nam, Liên Chiểu, Đà Nẵng',
					latitude: 16.075,
					longitude: 108.150,
					price: 1800000,
					area: 20,
					createdBy: verifiedUserId,
					ownerId: owner.id,
					approvalStatus: 'APPROVED',
				}
			});
			roomAId = room.id;
		});

		it('C1.1 Lấy danh sách yêu thích khi đã đăng nhập (Chưa có gì)', async () => {
			const res = await request(app)
				.get('/api/favorites')
				.set('Authorization', `Bearer ${verifiedUserToken}`);

			expect(res.status).toBe(200);
			expect(res.body.data.rooms).toHaveLength(0);
		});

		it('C2.1 Thêm phòng vào yêu thích thành công', async () => {
			const res = await request(app)
				.post('/api/favorites')
				.set('Authorization', `Bearer ${verifiedUserToken}`)
				.send({ roomId: roomAId });

			expect(res.status).toBe(201);
			expect(res.body.success).toBe(true);

			const favorite = await prisma.userFavorite.findUnique({
				where: { userId_roomId: { userId: verifiedUserId, roomId: roomAId } }
			});
			expect(favorite).not.toBeNull();
		});

		it('C2.2 Thêm phòng đã yêu thích rồi (trùng lặp / Upsert)', async () => {
			const res = await request(app)
				.post('/api/favorites')
				.set('Authorization', `Bearer ${verifiedUserToken}`)
				.send({ roomId: roomAId });

			expect(res.status).toBe(201);
			expect(res.body.success).toBe(true);
		});

		it('C1.1 Lấy danh sách yêu thích khi đã đăng nhập (Có 1 phòng)', async () => {
			const res = await request(app)
				.get('/api/favorites')
				.set('Authorization', `Bearer ${verifiedUserToken}`);

			expect(res.status).toBe(200);
			expect(res.body.data.rooms).toHaveLength(1);
			expect(res.body.data.rooms[0].id).toBe(roomAId);
		});

		it('C3.1 Bỏ yêu thích thành công', async () => {
			const res = await request(app)
				.delete(`/api/favorites/${roomAId}`)
				.set('Authorization', `Bearer ${verifiedUserToken}`);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);

			const favorite = await prisma.userFavorite.findUnique({
				where: { userId_roomId: { userId: verifiedUserId, roomId: roomAId } }
			});
			expect(favorite).toBeNull();
		});

		it('C4.1 Đồng bộ yêu thích khi phòng bị xóa (Cascade)', async () => {
			await prisma.userFavorite.create({
				data: { userId: verifiedUserId, roomId: roomAId }
			});

			await prisma.room.delete({ where: { id: roomAId } });

			const favorite = await prisma.userFavorite.findUnique({
				where: { userId_roomId: { userId: verifiedUserId, roomId: roomAId } }
			});
			expect(favorite).toBeNull();
		});

	});

	// ==========================================
	// GROUP D: ADMIN MANAGEMENT
	// ==========================================
	describe('D. Admin Management', () => {

		let userToBanId = '';
		let roomToHideId = '';

		beforeAll(async () => {
			const userToBan = await prisma.user.create({
				data: {
					email: 'test_user_ban_target@bkmap.com',
					passwordHash: 'dummyhash',
					userName: 'Target Ban User',
					isVerified: true,
				}
			});
			userToBanId = userToBan.id;

			const owner = await prisma.owner.create({
				data: { userName: 'Test Owner D', phoneNumber: '0977665544' }
			});

			const room = await prisma.room.create({
				data: {
					title: 'Phòng trọ cần ẩn của target ban user',
					address: 'Đà Nẵng',
					latitude: 16.0,
					longitude: 108.0,
					price: 2000000,
					area: 18,
					createdBy: userToBanId,
					ownerId: owner.id,
					approvalStatus: 'APPROVED',
				}
			});
			roomToHideId = room.id;
		});

		it('D1.1 Thống kê Dashboard hiển thị đúng chỉ số', async () => {
			const res = await request(app)
				.get('/api/admin/dashboard')
				.set('Authorization', `Bearer ${adminUserToken}`);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data).toHaveProperty('totalUsers');
			expect(res.body.data).toHaveProperty('totalRooms');
		});

		it('D1.2 User thường truy cập trang Admin (Bị chặn 403)', async () => {
			const res = await request(app)
				.get('/api/admin/dashboard')
				.set('Authorization', `Bearer ${verifiedUserToken}`);

			expect(res.status).toBe(403);
		});

		it('D2.3 Khóa tài khoản user (Ban)', async () => {
			const res = await request(app)
				.patch(`/api/admin/users/${userToBanId}/ban`)
				.set('Authorization', `Bearer ${adminUserToken}`);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);

			const user = await prisma.user.findUnique({ where: { id: userToBanId } });
			expect(user.isBanned).toBe(true);
		});

		it('D2.4 Admin tự khóa chính mình (Bị chặn 400)', async () => {
			const res = await request(app)
				.patch(`/api/admin/users/${adminUserId}/ban`)
				.set('Authorization', `Bearer ${adminUserToken}`);

			expect(res.status).toBe(400);
		});

		it('D2.7 Mở khóa user (Unban)', async () => {
			const res = await request(app)
				.patch(`/api/admin/users/${userToBanId}/unban`)
				.set('Authorization', `Bearer ${adminUserToken}`);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);

			const user = await prisma.user.findUnique({ where: { id: userToBanId } });
			expect(user.isBanned).toBe(false);
		});

		it('D3.3 Ẩn phòng vi phạm (Admin Hide)', async () => {
			const res = await request(app)
				.patch(`/api/admin/rooms/${roomToHideId}/hide`)
				.set('Authorization', `Bearer ${adminUserToken}`);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);

			const room = await prisma.room.findUnique({ where: { id: roomToHideId } });
			expect(room.approvalStatus).toBe('ADMIN_HIDDEN');
		});

		it('D3.5 Khôi phục phòng (Restore)', async () => {
			const res = await request(app)
				.patch(`/api/admin/rooms/${roomToHideId}/restore`)
				.set('Authorization', `Bearer ${adminUserToken}`);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);

			const room = await prisma.room.findUnique({ where: { id: roomToHideId } });
			expect(room.approvalStatus).toBe('APPROVED');
		});

		it('D3.7 Admin xóa phòng vĩnh viễn', async () => {
			const res = await request(app)
				.delete(`/api/admin/rooms/${roomToHideId}`)
				.set('Authorization', `Bearer ${adminUserToken}`);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);

			const room = await prisma.room.findUnique({ where: { id: roomToHideId } });
			expect(room).toBeNull();
		});

	});

	// ==========================================
	// GROUP E: SEARCH, FILTER & PUBLIC DISPLAY
	// ==========================================
	describe('E. Search, Filter & Public Display', () => {

		let listRoomId = '';

		beforeAll(async () => {
			const owner = await prisma.owner.create({
				data: { userName: 'Test Owner E', phoneNumber: '0905544332' }
			});

			const room = await prisma.room.create({
				data: {
					title: 'Phòng trọ Âu Cơ có điều hòa đầy đủ',
					address: '30 Âu Cơ, Liên Chiểu, Đà Nẵng',
					latitude: 16.072,
					longitude: 108.148,
					price: 1200000,
					area: 22,
					createdBy: verifiedUserId,
					ownerId: owner.id,
					approvalStatus: 'APPROVED',
				}
			});
			listRoomId = room.id;
		});

		it('E1.1 Hiển thị danh sách phòng mới nhất trên Trang chủ', async () => {
			const res = await request(app)
				.get('/api/rooms?limit=10');

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.data.length).toBeGreaterThan(0);
		});

		it('E2.3 - E2.4 Lọc danh sách phòng theo khoảng giá và tên đường', async () => {
			const res = await request(app)
				.get('/api/rooms?minPrice=1000000&maxPrice=2000000&search=Âu Cơ');

			expect(res.status).toBe(200);
			expect(res.body.data.data).not.toHaveLength(0);
			expect(res.body.data.data[0].title).toContain('Âu Cơ');
		});

		it('E3.1 Hiển thị đầy đủ thông tin chi tiết phòng', async () => {
			const res = await request(app)
				.get(`/api/rooms/${listRoomId}`);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.id).toBe(listRoomId);
			expect(res.body.data).toHaveProperty('owner');
		});

	});

	// ==========================================
	// GROUP F & G: INTERACTIVE MAP & HOST DASHBOARD
	// ==========================================
	describe('F & G. Interactive Map & Host Dashboard', () => {

		it('F1 - F2 Vị trí bản đồ và marker giá tiền format', async () => {
			const res = await request(app)
				.get('/api/rooms');

			expect(res.status).toBe(200);
			const firstRoom = res.body.data.data[0];
			expect(firstRoom).toHaveProperty('latitude');
			expect(firstRoom).toHaveProperty('longitude');
			expect(firstRoom).toHaveProperty('price');
		});

		it('G1 Chỉ hiển thị phòng do chính user tạo ở Dashboard', async () => {
			const res = await request(app)
				.get('/api/rooms?mine=true')
				.set('Authorization', `Bearer ${verifiedUserToken}`);

			expect(res.status).toBe(200);
			const rooms = res.body.data.data;
			rooms.forEach(room => {
				expect(room.createdBy).toBe(verifiedUserId);
			});
		});

	});

	// ==========================================
	// GROUP H: CACHING & PERFORMANCE
	// ==========================================
	describe('H. Caching & Performance', () => {

		it('H1.1 - H1.2 Redis Cache - Miss & Hit cho Guest', async () => {
			const res1 = await request(app).get('/api/rooms?page=1&limit=10');
			expect(res1.status).toBe(200);

			const res2 = await request(app).get('/api/rooms?page=1&limit=10');
			expect(res2.status).toBe(200);

			expect(redisClient.get).toHaveBeenCalled();
		});

		it('H1.3 Cache chỉ áp dụng cho guest, không áp dụng cho user đăng nhập', async () => {
			const res = await request(app)
				.get('/api/rooms?page=1&limit=10')
				.set('Authorization', `Bearer ${verifiedUserToken}`);

			expect(res.status).toBe(200);
		});

		it('H3.1 Tắt Redis → Graceful Degradation', async () => {
			redisStatus.isReady = false;

			const res = await request(app).get('/api/rooms?page=1&limit=10');
			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
		});

	});

	// ==========================================
	// GROUP I: SECURITY & RATE LIMITING
	// ==========================================
	describe('I. Security & Rate Limiting', () => {

		it('I1.1 Global Rate Limit headers', async () => {
			const res = await request(app).get('/api/rooms');
			expect(res.headers).toHaveProperty('ratelimit-limit');
			expect(res.headers).toHaveProperty('ratelimit-remaining');
		});

		it('I2.1 Gọi API yêu cầu auth mà không có token (Bị chặn 401)', async () => {
			const res = await request(app)
				.post('/api/rooms')
				.send({ title: 'Unauthorized Room' });

			expect(res.status).toBe(401);
		});

		it('I2.3 Gọi API với token giả mạo (Bị chặn 401)', async () => {
			const res = await request(app)
				.post('/api/rooms')
				.set('Authorization', 'Bearer fake-invalid-token')
				.send({ title: 'Invalid Token Room' });

			expect(res.status).toBe(401);
		});

		it('I3.1 CORS origin headers', async () => {
			const res = await request(app)
				.get('/api/rooms')
				.set('Origin', 'http://localhost:5173');

			expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
		});

		it('I4.1 Helmet Security Headers', async () => {
			const res = await request(app).get('/api/rooms');
			expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
			expect(res.headers).toHaveProperty('x-frame-options');
		});

	});

	// ==========================================
	// GROUP J: ERROR HANDLING & EDGE CASES
	// ==========================================
	describe('J. Error Handling & Edge Cases', () => {

		it('J1.1 Gửi roomId là UUID hợp lệ nhưng không tồn tại (404)', async () => {
			const res = await request(app)
				.get('/api/rooms/00000000-0000-0000-0000-000000000000');

			expect(res.status).toBe(404);
		});

		it('J1.2 Gửi ID không phải UUID (400)', async () => {
			const res = await request(app)
				.get('/api/rooms/invalid-uuid-format');

			expect(res.status).toBe(400);
			expect(res.body.message).toContain('ID phòng trọ không hợp lệ.');
		});

		it('J3.1 Proxy Geocoding hoạt động đúng', async () => {
			const res = await request(app)
				.get('/api/geocode?q=Ngô Sĩ Liên');

			expect(res.status).toBe(200);
			expect(res.body[0]).toHaveProperty('display_name');
			expect(res.body[0].display_name).toContain('Ngô Sĩ Liên');
		});

		it('J3.2 Gọi geocode với query rỗng (400)', async () => {
			const res = await request(app)
				.get('/api/geocode?q=');

			expect(res.status).toBe(400);
		});

	});

});
