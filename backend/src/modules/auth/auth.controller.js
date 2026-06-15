import { HttpResponse } from '../../common/dtos/index.js';
import { authService } from './auth.service.js';

export const authController = {
	async register(req, res, next) {
		try {
			const data = await authService.register(req.body);
			return new HttpResponse(res).created(data);
		} catch (error) {
			next(error);
		}
	},

	async login(req, res, next) {
		try {
			const data = await authService.login(req.body);

			// Tách refreshToken ra khỏi response body và lưu vào cookie HttpOnly
			const { refreshToken, accessToken, user } = data;

			res.cookie('refreshToken', refreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'strict',
				maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
			});

			return new HttpResponse(res).success({ user, accessToken });
		} catch (error) {
			next(error);
		}
	},

	async verifyEmail(req, res, next) {
		try {
			const data = await authService.verifyEmail(req.body);
			return new HttpResponse(res).success(data);
		} catch (error) {
			next(error);
		}
	},

	// Dành cho GET request khi click từ email
	async verifyEmailGet(req, res, next) {
		try {
			const token = req.query.token;
			if (!token) {
				return res.status(400).send(`<h2>Lỗi: Không tìm thấy token xác thực.</h2>`);
			}
			await authService.verifyEmail({ token });
			return res.send(`
				<div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
					<h2 style="color: #28a745;">Xác thực tài khoản thành công! 🎉</h2>
					<p>Bây giờ bạn đã có thể quay lại ứng dụng để đăng nhập.</p>
				</div>
			`);
		} catch (error) {
			return res.status(400).send(`
				<div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
					<h2 style="color: #dc3545;">Xác thực thất bại ❌</h2>
					<p>${error.message}</p>
				</div>
			`);
		}
	},

	async refreshToken(req, res, next) {
		try {
			// Lấy refreshToken từ cookie do client gửi lên
			const oldRefreshToken = req.cookies.refreshToken;
			
			const { accessToken, refreshToken } = await authService.refreshToken(oldRefreshToken);

			// Cập nhật lại cookie với refreshToken mới
			res.cookie('refreshToken', refreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'strict',
				maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
			});

			return new HttpResponse(res).success({ accessToken });
		} catch (error) {
			next(error);
		}
	},

	async logout(req, res, next) {
		try {
			// Lấy userId từ user (middleware auth guard truyền vào req.user)
			const userId = req.user?.id; 
			
			if (userId) {
				await authService.logout(userId);
			}

			// Xóa cookie refreshToken
			res.clearCookie('refreshToken', {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'strict',
			});

			return new HttpResponse(res).success({ message: 'Đăng xuất thành công.' });
		} catch (error) {
			next(error);
		}
	},
};
