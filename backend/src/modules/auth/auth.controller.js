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
		const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
		const loginUrl = `${frontendUrl}/login`;

		const renderPage = (isSuccess, message, hasExpiredToken = false) => {
			const primaryColor = '#004ac6';
			const successColor = '#10b981';
			const errorColor = '#ef4444';
			
			const iconHtml = isSuccess 
				? `<div class="icon-wrapper success">
						<svg viewBox="0 0 52 52" class="checkmark">
							<circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
							<path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
						</svg>
				   </div>`
				: `<div class="icon-wrapper error">
						<svg viewBox="0 0 52 52" class="cross">
							<circle class="cross__circle" cx="26" cy="26" r="25" fill="none"/>
							<path class="cross__path-1" fill="none" d="M16 16 36 36"/>
							<path class="cross__path-2" fill="none" d="M36 16 16 36"/>
						</svg>
				   </div>`;

			const title = isSuccess ? 'Xác thực tài khoản thành công!' : 'Xác thực thất bại';
			const buttonText = 'Đăng nhập ngay';

			return `
				<!DOCTYPE html>
				<html lang="vi">
				<head>
					<meta charset="UTF-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>${title} | BK'S MAP</title>
					<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
					<style>
						* {
							box-sizing: border-box;
							margin: 0;
							padding: 0;
						}
						body {
							font-family: 'Inter', system-ui, -apple-system, sans-serif;
							background: radial-gradient(circle at 10% 20%, rgba(37, 99, 235, 0.04) 0%, transparent 40%),
							            radial-gradient(circle at 90% 80%, rgba(0, 74, 198, 0.04) 0%, transparent 40%),
							            #f8f9ff;
							color: #0b1c30;
							min-height: 100vh;
							display: flex;
							align-items: center;
							justify-content: center;
							padding: 20px;
						}
						.container {
							width: 100%;
							max-width: 440px;
							background: rgba(255, 255, 255, 0.85);
							backdrop-filter: saturate(180%) blur(20px);
							-webkit-backdrop-filter: saturate(180%) blur(20px);
							border: 1px solid rgba(255, 255, 255, 0.5);
							border-radius: 24px;
							padding: 40px 30px;
							text-align: center;
							box-shadow: 0px 20px 40px rgba(0, 74, 198, 0.05);
							animation: fadeIn 0.6s ease-out;
						}
						@keyframes fadeIn {
							from { opacity: 0; transform: translateY(15px); }
							to { opacity: 1; transform: translateY(0); }
						}
						
						.icon-wrapper {
							width: 80px;
							height: 80px;
							margin: 0 auto 24px;
							display: flex;
							align-items: center;
							justify-content: center;
						}

						/* Success Checkmark Animation */
						.checkmark__circle {
							stroke-dasharray: 166;
							stroke-dashoffset: 166;
							stroke-width: 3;
							stroke-miterlimit: 10;
							stroke: ${successColor};
							fill: none;
							animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
						}
						.checkmark {
							width: 80px;
							height: 80px;
							border-radius: 50%;
							display: block;
							stroke-width: 3;
							stroke: ${successColor};
							stroke-miterlimit: 10;
							box-shadow: inset 0px 0px 0px ${successColor};
							animation: fillSuccess 0.4s ease-in-out 0.4s forwards, scale 0.3s ease-in-out 0.9s both;
						}
						.checkmark__check {
							transform-origin: 50% 50%;
							stroke-dasharray: 48;
							stroke-dashoffset: 48;
							stroke-width: 3;
							stroke-linecap: round;
							animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
						}

						/* Error Cross Animation */
						.cross__circle {
							stroke-dasharray: 166;
							stroke-dashoffset: 166;
							stroke-width: 3;
							stroke-miterlimit: 10;
							stroke: ${errorColor};
							fill: none;
							animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
						}
						.cross {
							width: 80px;
							height: 80px;
							border-radius: 50%;
							display: block;
							stroke-width: 3;
							stroke: ${errorColor};
							stroke-miterlimit: 10;
							box-shadow: inset 0px 0px 0px ${errorColor};
							animation: fillError 0.4s ease-in-out 0.4s forwards, scale 0.3s ease-in-out 0.9s both;
						}
						.cross__path-1, .cross__path-2 {
							transform-origin: 50% 50%;
							stroke-dasharray: 48;
							stroke-dashoffset: 48;
							stroke-width: 3;
							stroke-linecap: round;
						}
						.cross__path-1 {
							animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.7s forwards;
						}
						.cross__path-2 {
							animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.9s forwards;
						}

						@keyframes stroke {
							100% { stroke-dashoffset: 0; }
						}
						@keyframes scale {
							0%, 100% { transform: none; }
							50% { transform: scale3d(1.1, 1.1, 1); }
						}
						@keyframes fillSuccess {
							100% { box-shadow: inset 0px 0px 0px 40px rgba(16, 185, 129, 0.1); }
						}
						@keyframes fillError {
							100% { box-shadow: inset 0px 0px 0px 40px rgba(239, 68, 68, 0.1); }
						}

						h1 {
							font-size: 22px;
							font-weight: 700;
							color: #0b1c30;
							margin-bottom: 12px;
							line-height: 1.3;
						}
						p {
							font-size: 15px;
							color: #555c68;
							line-height: 1.6;
							margin-bottom: 30px;
						}
						
						.btn {
							display: inline-flex;
							align-items: center;
							justify-content: center;
							width: 100%;
							padding: 14px 24px;
							font-size: 15px;
							font-weight: 600;
							text-decoration: none;
							border-radius: 12px;
							transition: all 0.25s ease;
							cursor: pointer;
							border: none;
							outline: none;
						}
						
						.btn-primary {
							background: ${primaryColor};
							color: #ffffff;
							box-shadow: 0 4px 14px rgba(0, 74, 198, 0.25);
						}
						
						.btn-primary:hover {
							background: #003fa8;
							transform: translateY(-2px);
							box-shadow: 0 6px 20px rgba(0, 74, 198, 0.35);
						}

						.btn-primary:active {
							transform: translateY(0);
						}

						.btn-secondary {
							background: rgba(11, 28, 48, 0.05);
							color: #0b1c30;
						}
						
						.btn-secondary:hover {
							background: rgba(11, 28, 48, 0.1);
							transform: translateY(-2px);
						}

						.btn-secondary:active {
							transform: translateY(0);
						}
						
						.footer {
							margin-top: 24px;
							font-size: 12px;
							color: #a0a5b0;
						}
					</style>
				</head>
				<body>
					<div class="container">
						${iconHtml}
						<h1>${title}</h1>
						<p>${message}</p>
						
						${hasExpiredToken 
							? `<button id="btn-resend" class="btn btn-primary" style="margin-bottom: 12px;">Gửi lại email xác thực</button>
							   <a href="${loginUrl}" class="btn btn-secondary">Quay lại đăng nhập</a>`
							: `<a href="${loginUrl}" class="btn btn-primary">${buttonText}</a>`
						}

						<div class="footer">
							&copy; ${new Date().getFullYear()} BK'S MAP. All rights reserved.
						</div>
					</div>

					${hasExpiredToken ? `
					<script>
						const btnResend = document.getElementById('btn-resend');
						if (btnResend) {
							btnResend.addEventListener('click', async () => {
								const urlParams = new URLSearchParams(window.location.search);
								const token = urlParams.get('token');
								if (!token) {
									alert('Không tìm thấy mã token hợp lệ để gửi lại.');
									return;
								}
								
								btnResend.disabled = true;
								btnResend.innerText = 'Đang gửi lại...';
								
								try {
									const response = await fetch('/api/auth/resend-verification', {
										method: 'POST',
										headers: {
											'Content-Type': 'application/json'
										},
										body: JSON.stringify({ token })
									});
									
									const result = await response.json();
									if (response.ok) {
										const container = document.querySelector('.container');
										container.innerHTML = \`
											<div class="icon-wrapper success">
												<svg viewBox="0 0 52 52" class="checkmark">
													<circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
													<path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
												</svg>
											</div>
											<h1>Gửi lại thành công! ✉️</h1>
											<p>Hệ thống đã gửi một email xác thực mới đến hòm thư của bạn. Vui lòng kiểm tra lại hộp thư chính hoặc thư rác.</p>
											<a href="${loginUrl}" class="btn btn-secondary" style="width: 100%;">Quay lại đăng nhập</a>
										\`;
									} else {
										alert(result.message || 'Gửi lại email thất bại. Vui lòng đăng ký lại tài khoản.');
										btnResend.disabled = false;
										btnResend.innerText = 'Gửi lại email xác thực';
									}
								} catch (err) {
									console.error(err);
									alert('Lỗi mạng. Vui lòng kiểm tra lại kết nối của bạn.');
									btnResend.disabled = false;
									btnResend.innerText = 'Gửi lại email xác thực';
								}
							});
						}
					</script>
					` : ''}
				</body>
				</html>
			`;
		};

		try {
			const token = req.query.token;
			if (!token) {
				return res.status(400).send(renderPage(false, 'Không tìm thấy token xác thực hợp lệ. Vui lòng thử lại.'));
			}
			await authService.verifyEmail({ token });
			return res.send(renderPage(true, 'Kích hoạt tài khoản thành công! Bây giờ bạn đã có thể bắt đầu khám phá và đăng tin phòng trọ.'));
		} catch (error) {
			const isExpired = error.message === 'Token Expired.';
			const safeMessage = isExpired ? 'Đường link kích hoạt tài khoản của bạn đã hết hạn. Bạn có thể yêu cầu gửi lại email mới bên dưới.' : 'Token xác thực không hợp lệ hoặc đã được sử dụng.';
			return res.status(400).send(renderPage(false, safeMessage, isExpired));
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
			const errorMsg = error.message || 'google_auth_failed';
			return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(errorMsg)}`);
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

	async resendVerification(req, res, next) {
		try {
			const data = await authService.resendVerification(req.body);
			return new HttpResponse(res).success(data);
		} catch (error) {
			next(error);
		}
	},
};
