import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import './Auth.css';
import { Mail, Lock, User, Loader2, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

const registerSchema = z.object({
    name: z.string()
        .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
        .max(100, 'Họ và tên không được vượt quá 100 ký tự')
        .refine(val => val.trim().length > 0, 'Họ và tên không được để trống'),
    email: z.string()
        .min(1, 'Email không được để trống')
        .email('Định dạng email không hợp lệ')
        .trim(),
    password: z.string()
        .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
        .max(50, 'Mật khẩu không được vượt quá 50 ký tự'),
});

const RegisterPage = ({ onRegisterSuccess }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });
    const [validationErrors, setValidationErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [verifyToken, setVerifyToken] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const validateSingleField = (name, value) => {
        const fieldSchema = registerSchema.pick({ [name]: true });
        const result = fieldSchema.safeParse({ [name]: value });
        if (!result.success) {
            const msg = result.error.issues[0]?.message || 'Không hợp lệ';
            setValidationErrors(prev => ({ ...prev, [name]: msg }));
        } else {
            setValidationErrors(prev => {
                const copy = { ...prev };
                delete copy[name];
                return copy;
            });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        validateSingleField(name, value);
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
        
        // Full form validation with Zod
        const validationResult = registerSchema.safeParse(formData);
        if (!validationResult.success) {
            const errorsMap = {};
            validationResult.error.issues.forEach(issue => {
                const path = issue.path[0];
                if (path) {
                    errorsMap[path] = issue.message;
                }
            });
            setValidationErrors(errorsMap);
            
            // Set the first error to the main error block
            const firstMsg = validationResult.error.issues[0]?.message || 'Thông tin đăng ký không hợp lệ.';
            setError(firstMsg);
            return;
        }

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
                    userName: formData.name,
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
        
        const length = password.length;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (length < 6) {
            return { level: 1, text: 'Mật khẩu quá ngắn', color: '#ef4444' };
        }
        
        if (length >= 10 && hasUpperCase && hasNumber && hasSpecial) {
            return { level: 4, text: 'Mật khẩu rất mạnh', color: '#22c55e' };
        }
        
        if (length >= 8 && (hasUpperCase || hasNumber || hasSpecial)) {
            return { level: 3, text: 'Mật khẩu mạnh', color: '#3b82f6' };
        }
        
        return { level: 2, text: 'Mật khẩu trung bình', color: '#f59e0b' };
    };

    const strength = getPasswordStrength(formData.password);

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
                    <h1>Tạo tài khoản mới</h1>
                    <p className="auth-subtitle">Bắt đầu hành trình tìm trọ cùng BK'S MAP</p>
                </div>

                {error && (
                    <div className="mb-5 py-3 px-4 bg-red-50/80 text-red-700 border border-red-200/60 rounded-2xl text-sm font-medium flex items-center gap-3 shadow-sm shadow-red-100/50 animate-fade-in relative overflow-hidden w-full">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500"></div>
                        <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
                        <span className="leading-snug">{error}</span>
                    </div>
                )}

                {successMsg && (
                    <div className="mb-5 py-3 px-4 bg-emerald-50/80 text-emerald-700 border border-emerald-200/60 rounded-2xl text-sm font-medium flex flex-col items-start gap-3 shadow-sm shadow-emerald-100/50 animate-fade-in relative overflow-hidden w-full">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500"></div>
                        <div className="flex items-start gap-3 w-full">
                            <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span className="leading-snug flex-1">{successMsg}</span>
                        </div>
                        {verifyToken && (
                            <button
                                type="button"
                                onClick={handleAutoVerify}
                                disabled={isVerifying}
                                className="ml-8 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-1.5 px-3 rounded-lg text-[10px] uppercase tracking-wider cursor-pointer transition-colors active:scale-95 disabled:opacity-50"
                            >
                                {isVerifying ? 'Đang kích hoạt...' : '⚡ Kích hoạt tài khoản Dev nhanh'}
                            </button>
                        )}
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name" style={{ color: validationErrors.name ? '#ef4444' : '' }}>Họ và Tên</label>
                        <div className="input-wrapper">
                            <User className="input-icon" size={18} style={{ color: validationErrors.name ? '#ef4444' : '' }} />
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                placeholder="Nhập họ và tên đầy đủ..."
                                value={formData.name}
                                onChange={handleChange}
                                style={{
                                    borderColor: validationErrors.name ? '#ef4444' : '',
                                    boxShadow: validationErrors.name ? '0 0 0 1px #fca5a5' : '',
                                }}
                            />
                        </div>
                        {validationErrors.name && (
                            <span className="text-[11px] text-red-500 font-semibold mt-1 block animate-fade-in">
                                {validationErrors.name}
                            </span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="email" style={{ color: validationErrors.email ? '#ef4444' : '' }}>Email sinh viên / Chủ nhà</label>
                        <div className="input-wrapper">
                            <Mail className="input-icon" size={18} style={{ color: validationErrors.email ? '#ef4444' : '' }} />
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                placeholder="Nhập địa chỉ email của bạn..."
                                value={formData.email}
                                onChange={handleChange}
                                style={{
                                    borderColor: validationErrors.email ? '#ef4444' : '',
                                    boxShadow: validationErrors.email ? '0 0 0 1px #fca5a5' : '',
                                }}
                            />
                        </div>
                        {validationErrors.email && (
                            <span className="text-[11px] text-red-500 font-semibold mt-1 block animate-fade-in">
                                {validationErrors.email}
                            </span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" style={{ color: validationErrors.password ? '#ef4444' : '' }}>Mật khẩu</label>
                        <div className="input-wrapper">
                            <Lock className="input-icon" size={18} style={{ color: validationErrors.password ? '#ef4444' : '' }} />
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder="Tạo mật khẩu mạnh..."
                                value={formData.password}
                                onChange={handleChange}
                                style={{
                                    borderColor: validationErrors.password ? '#ef4444' : '',
                                    boxShadow: validationErrors.password ? '0 0 0 1px #fca5a5' : '',
                                }}
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
                        {validationErrors.password && (
                            <span className="text-[11px] text-red-500 font-semibold mt-1 block animate-fade-in">
                                {validationErrors.password}
                            </span>
                        )}

                        {formData.password && (
                            <div className="password-strength">
                                <div className="strength-bars">
                                    {[1, 2, 3, 4].map((level) => (
                                        <div
                                            key={level}
                                            className="strength-bar"
                                            style={{ backgroundColor: strength.level >= level ? strength.color : '#e5e7eb' }}
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
                            <span>Đăng ký</span>
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
                            <span>Đăng ký bằng Google</span>
                        </button>
                    </div>
                </form>

                <div className="auth-footer">
                    <p>Đã có tài khoản? <button onClick={() => navigate('/login')} className="auth-link font-bold">Đăng nhập</button></p>
                </div>

                <p className="terms-text">
                    Bằng việc đăng ký, bạn đồng ý với <a href="#" className="terms-link">Điều khoản dịch vụ</a> và <a href="#" className="terms-link">Chính sách bảo mật</a> của chúng tôi.
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
