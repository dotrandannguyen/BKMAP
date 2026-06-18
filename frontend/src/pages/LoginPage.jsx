import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

const AppleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
);

const LoginPage = ({ onLoginSuccess }) => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const apiUrl = import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'http://localhost:3000/api' ? import.meta.env.VITE_API_URL : `http://${window.location.hostname}:3000/api`;
            const response = await fetch(`${apiUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Bắt buộc để trình duyệt nhận HttpOnly Cookie (refreshToken)
                body: JSON.stringify({ email, password }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.');
            }

            const userData = result.data?.user || result.user || { email };
            const token = result.data?.accessToken || result.accessToken;

            if (token) {
                localStorage.setItem('accessToken', token);
                localStorage.setItem('userEmail', userData.email);
                localStorage.setItem('userName', userData.userName || userData.email.split('@')[0]);
            }
            
            if (onLoginSuccess) {
                onLoginSuccess(userData.email, userData.userName || userData.email.split('@')[0]);
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            {/* Decorative background elements */}
            <div className="auth-bg-decoration">
                <div className="bg-orb bg-orb-1"></div>
                <div className="bg-orb bg-orb-2"></div>
            </div>

            <div className="auth-card">
                <div className="auth-header">
                    <div className="notion-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                        <span>B</span>
                    </div>
                    <h1>Chào mừng quay trở lại</h1>
                    <p className="auth-subtitle">Đăng nhập tài khoản BK'S MAP</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold">
                        ⚠️ {error}
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email sinh viên / Chủ nhà</label>
                        <div className="input-wrapper">
                            <Mail className="input-icon" size={18} />
                            <input
                                id="email"
                                type="email"
                                required
                                placeholder="Nhập địa chỉ email của bạn..."
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="focus-glow"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Mật khẩu</label>
                        <div className="input-wrapper">
                            <Lock className="input-icon" size={18} />
                            <input
                                id="password"
                                type="password"
                                required
                                placeholder="Nhập mật khẩu của bạn..."
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="focus-glow"
                            />
                        </div>
                    </div>

                    <button type="submit" className="auth-btn primary-btn font-bold" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="btn-icon spinning" size={18} />
                                <span>Đang đăng nhập...</span>
                            </>
                        ) : (
                            <>
                                <span>Đăng nhập</span>
                                <ArrowRight className="btn-icon-right" size={18} />
                            </>
                        )}
                    </button>

                    <div className="auth-divider">
                        <span>HOẶC</span>
                    </div>

                    <div className="social-login">
                        <button type="button" onClick={() => { setEmail('dannguyen@dut.udn.vn'); setPassword('123456'); }} className="social-btn google-btn">
                            <GoogleIcon />
                            <span>Tài khoản Test nhanh</span>
                        </button>
                    </div>
                </form>

                <div className="auth-footer">
                    <p>Chưa có tài khoản? <button onClick={() => navigate('/register')} className="auth-link hover:underline bg-transparent border-none cursor-pointer text-primary p-0 font-bold">Đăng ký ngay</button></p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
