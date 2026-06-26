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
			// Không interpolate error.message vào HTML — tránh XSS
			const safeMessage = error.message === 'Token Expired.' ? 'Link xác thực đã hết hạn.' : 'Token không hợp lệ hoặc đã được sử dụng.';
			return res.status(400).send(`
				<div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
					<h2 style="color: #dc3545;">Xác thực thất bại </h2>
					<p>${safeMessage}</p>
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

	// GOOGLE OAUTH CALLBACK
	async googleCallback(req, res) {
		try {
			const googleProfile = req.user; // Passport truyền profile vào req.user

			if (!googleProfile) {
				const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
				return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
			}

			const data = await authService.googleLogin(googleProfile);
			const { refreshToken, accessToken, user } = data;

			// Set refreshToken vào HttpOnly Cookie (giống hệt luồng login thường)
			res.cookie('refreshToken', refreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax', // Dùng 'lax' thay vì 'strict' vì đây là cross-site redirect từ Google
				maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
			});

			// Redirect về Frontend kèm token + user info trong query params
			const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
			const params = new URLSearchParams({
				token: accessToken,
				email: user.email,
				name: user.userName || '',
				avatar: user.avatar || '',
			});

			return res.redirect(`${frontendUrl}/login?${params.toString()}`);
		} catch (error) {
			console.error('[Google OAuth] Callback error:', error.message);
			const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
			return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
		}
	},

	async changePassword(req, res, next) {
		try {
			const userId = req.user?.id;
			const { oldPassword, newPassword } = req.body;
			const data = await authService.changePassword({ userId, oldPassword, newPassword });
			return new HttpResponse(res).success(data);
		} catch (error) {
			next(error);
		}
	},

	async forgotPassword(req, res, next) {
		try {
			const data = await authService.forgotPassword(req.body);
			return new HttpResponse(res).success(data);
		} catch (error) {
			next(error);
		}
	},

	async resetPassword(req, res, next) {
		try {
			const data = await authService.resetPassword(req.body);
			return new HttpResponse(res).success(data);
		} catch (error) {
			next(error);
		}
	},
};
