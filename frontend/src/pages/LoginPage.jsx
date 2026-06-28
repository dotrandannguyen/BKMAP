import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Auth.css';
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

const LoginPage = () => {
    const navigate = useNavigate();
    const login = useAuthStore((s) => s.login);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        localStorage.removeItem('favoriteRoomIds');
        try {
            useUiStore.getState().loadSavedIds();
        } catch (e) {
            console.error('Failed to reset saved IDs on login page mount:', e);
        }
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const googleError = params.get('error');

        if (googleError) {
            const friendlyError = (googleError === 'google_denied' || googleError === 'google_auth_failed')
                ? 'Đăng nhập Google thất bại. Vui lòng thử lại.'
                : googleError;
            setError(friendlyError);
            toast.error(friendlyError);
            window.history.replaceState({}, '', '/login');
            return;
        }

        if (token) {
            const email = params.get('email') || '';
            const name = params.get('name') || email.split('@')[0];
            const avatar = params.get('avatar') || '';

            localStorage.setItem('accessToken', token);
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userName', name);
            localStorage.setItem('userAvatar', avatar);
            localStorage.setItem('isGoogleLogin', 'true');

            login(email, name, avatar);
            window.history.replaceState({}, '', '/login');
            navigate('/profile');
        }
    }, []);

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
                credentials: 'include',
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
                localStorage.setItem('userAvatar', userData.avatar || '');
                localStorage.setItem('isGoogleLogin', 'false');

                let role = 'USER';
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    role = payload.role || 'USER';
                    localStorage.setItem('userRole', role);
                } catch (_) { /* ignore */ }

                login(userData.email, userData.userName || userData.email.split('@')[0], userData.avatar || '', role);

                if (role === 'ADMIN') {
                    navigate('/admin');
                } else {
                    navigate('/profile');
                }
            } else {
                localStorage.setItem('isGoogleLogin', 'false');
                login(userData.email, userData.userName || userData.email.split('@')[0], userData.avatar || '');
                navigate('/profile');
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-bg-decoration">
                <div className="bg-orb bg-orb-1"></div>
                <div className="bg-orb bg-orb-2"></div>
            </div>

            <div className="auth-card">
                <div className="auth-header">
                    <div className="notion-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                        <span>B</span>
                    </div>
                    <h1 className="text-black">Chào mừng quay trở lại</h1>
                    <p className="auth-subtitle">Đăng nhập tài khoản BK'S MAP</p>
                </div>

                {error && (
                    <div className="mb-5 py-3 px-4 bg-red-50/80 text-red-700 border border-red-200/60 rounded-2xl text-sm font-medium flex items-center gap-3 shadow-sm shadow-red-100/50 animate-fade-in relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500"></div>
                        <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
                        <span className="leading-snug">{error}</span>
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
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Mật khẩu</label>
                        <div className="input-wrapper">
                            <Lock className="input-icon" size={18} />
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder="Nhập mật khẩu của bạn..."
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="auth-btn primary-btn font-bold" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="btn-icon spinning" size={18} />
                                <span>Đang đăng nhập...</span>
                            </>
                        ) : (
                            <span>Đăng nhập</span>
                        )}
                    </button>

                    <div className="auth-divider">
                        <span>HOẶC</span>
                    </div>

                    <div className="social-login">
                        <button type="button" onClick={() => {
                            const backendUrl = import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'http://localhost:3000/api'
                                ? import.meta.env.VITE_API_URL
                                : `http://${window.location.hostname}:3000/api`;
                            window.location.href = `${backendUrl}/auth/google`;
                        }} className="social-btn google-btn">
                            <GoogleIcon />
                            <span>Đăng nhập bằng Google</span>
                        </button>
                    </div>
                </form>

                <div className="auth-footer">
                    <p>Chưa có tài khoản? <button onClick={() => navigate('/register')} className="auth-link font-bold">Đăng ký ngay</button></p>
                    <p><button onClick={() => navigate('/forgot-password')} className="auth-link">Quên mật khẩu?</button></p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
