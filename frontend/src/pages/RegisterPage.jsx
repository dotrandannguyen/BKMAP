import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RegisterPage.css';
import { Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';

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

const RegisterPage = ({ onRegisterSuccess }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [verifyToken, setVerifyToken] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAutoVerify = async () => {
        setIsVerifying(true);
        setError('');
        try {
            const apiUrl = import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'http://localhost:3000/api' ? import.meta.env.VITE_API_URL : `http://${window.location.hostname}:3000/api`;
            const response = await fetch(`${apiUrl}/auth/verify-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: verifyToken }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Xác thực tài khoản thất bại.');
            }

            setSuccessMsg('Kích hoạt tài khoản thành công! Đang chuyển hướng đến trang đăng nhập...');
            setTimeout(() => {
                if (onRegisterSuccess) {
                    onRegisterSuccess();
                } else {
                    navigate('/login');
                }
            }, 1500);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMsg('');
        setVerifyToken('');

        try {
            const apiUrl = import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'http://localhost:3000/api' ? import.meta.env.VITE_API_URL : `http://${window.location.hostname}:3000/api`;
            const response = await fetch(`${apiUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    userName: formData.name, // Expected field in registerSchema is userName
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại.');
            }

            const token = result.data?.verifyToken;
            if (token) {
                setVerifyToken(token);
                setSuccessMsg('Đăng ký thành công! Bạn có thể nhấn nút dưới đây để kích hoạt tài khoản Dev nhanh.');
            } else {
                setSuccessMsg('Đăng ký thành công! Hãy kiểm tra hòm thư email của bạn để xác thực tài khoản trước khi đăng nhập.');
                
                // Wait 3 seconds and redirect to login page
                setTimeout(() => {
                    if (onRegisterSuccess) {
                        onRegisterSuccess();
                    } else {
                        navigate('/login');
                    }
                }, 3000);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const getPasswordStrength = (password) => {
        if (!password) return { level: 0, text: '', color: '' };
        if (password.length < 6) return { level: 1, text: 'Quá ngắn', color: '#ef4444' };
        if (password.length < 8) return { level: 2, text: 'Yếu', color: '#f59e0b' };
        if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
            return { level: 4, text: 'Mạnh', color: '#22c55e' };
        }
        return { level: 3, text: 'Tốt', color: '#3b82f6' };
    };

    const strength = getPasswordStrength(formData.password);

    return (
        <div className="auth-container">
            {/* Decorative background elements */}
            <div className="auth-bg-decoration">
                <div className="bg-orb bg-orb-1"></div>
                <div className="bg-orb bg-orb-2"></div>
                <div className="bg-orb bg-orb-3"></div>
            </div>

            <div className="auth-card">
                <div className="auth-header">
                    <div className="notion-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                        <span>B</span>
                    </div>
                    <h1>Tạo tài khoản mới</h1>
                    <p className="auth-subtitle">Bắt đầu hành trình tìm trọ cùng BK'S MAP</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold">
                        ⚠️ {error}
                    </div>
                )}

                {successMsg && (
                    <div className="mb-4 p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex flex-col items-start gap-2 w-full">
                        <span>🎉 {successMsg}</span>
                        {verifyToken && (
                            <button
                                type="button"
                                onClick={handleAutoVerify}
                                disabled={isVerifying}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-1.5 px-3 rounded-lg text-[10px] uppercase tracking-wide cursor-pointer transition-colors active:scale-95 disabled:opacity-50"
                            >
                                {isVerifying ? 'Đang kích hoạt...' : '⚡ Kích hoạt tài khoản Dev nhanh'}
                            </button>
                        )}
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                    {/* Name Field */}
                    <div className="form-group">
                        <label htmlFor="name">Họ và Tên</label>
                        <div className="input-wrapper">
                            <User className="input-icon" size={18} />
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                placeholder="Nhập họ và tên đầy đủ..."
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Email Field */}
                    <div className="form-group">
                        <label htmlFor="email">Email sinh viên / Chủ nhà</label>
                        <div className="input-wrapper">
                            <Mail className="input-icon" size={18} />
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                placeholder="Nhập địa chỉ email của bạn..."
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div className="form-group">
                        <label htmlFor="password">Mật khẩu</label>
                        <div className="input-wrapper">
                            <Lock className="input-icon" size={18} />
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder="Tạo mật khẩu mạnh..."
                                value={formData.password}
                                onChange={handleChange}
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

                        {/* Password Strength Indicator */}
                        {formData.password && (
                            <div className="password-strength">
                                <div className="strength-bars">
                                    {[1, 2, 3, 4].map((level) => (
                                        <div
                                            key={level}
                                            className={`strength-bar ${strength.level >= level ? 'active' : ''}`}
                                            style={{ backgroundColor: strength.level >= level ? strength.color : undefined }}
                                        />
                                    ))}
                                </div>
                                <span className="strength-text" style={{ color: strength.color }}>
                                    {strength.text}
                                </span>
                            </div>
                        )}
                    </div>

                    <button type="submit" className="auth-btn primary-btn font-bold" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="btn-icon spinning" size={18} />
                                <span>Đang đăng ký...</span>
                            </>
                        ) : (
                            <>
                                <span>Đăng ký</span>
                                <ArrowRight className="btn-icon-right" size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Đã có tài khoản? <button onClick={() => navigate('/login')} className="auth-link hover:underline bg-transparent border-none cursor-pointer text-primary p-0 font-bold">Đăng nhập</button></p>
                </div>

                <p className="terms-text">
                    Bằng việc đăng ký, bạn đồng ý với <a href="#" className="terms-link">Điều khoản dịch vụ</a> và <a href="#" className="terms-link">Chính sách bảo mật</a> của chúng tôi.
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
