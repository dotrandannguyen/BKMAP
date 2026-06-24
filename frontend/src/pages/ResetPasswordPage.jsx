import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ArrowLeft, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import './LoginPage.css';

const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Liên kết khôi phục mật khẩu không hợp lệ. Vui lòng thử yêu cầu lại.');
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!token) {
            setError('Không tìm thấy mã xác nhận đặt lại mật khẩu.');
            return;
        }

        if (newPassword.length < 6) {
            setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Xác nhận mật khẩu mới không trùng khớp.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const apiUrl = import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'http://localhost:3000/api' ? import.meta.env.VITE_API_URL : `http://${window.location.hostname}:3000/api`;
            const response = await fetch(`${apiUrl}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, newPassword }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại hoặc yêu cầu link mới.');
            }

            setIsSuccess(true);
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
                    <h1>Đặt lại mật khẩu</h1>
                    <p className="auth-subtitle">Nhập mật khẩu mới cho tài khoản của bạn</p>
                </div>

                {error && (
                    <div className="mb-5 py-3 px-4 bg-red-50/80 text-red-700 border border-red-200/60 rounded-2xl text-sm font-medium flex items-center gap-3 shadow-sm shadow-red-100/50 animate-fade-in relative overflow-hidden text-left">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500"></div>
                        <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
                        <span className="leading-snug">{error}</span>
                    </div>
                )}

                {isSuccess ? (
                    <div className="space-y-6 text-center animate-fade-in">
                        <div className="flex justify-center">
                            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-500 shadow-sm shadow-emerald-100">
                                <CheckCircle size={32} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-base font-bold text-on-surface">Đặt lại mật khẩu thành công!</h3>
                            <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                                Mật khẩu của bạn đã được thay đổi. Bây giờ bạn có thể đăng nhập bằng mật khẩu mới này.
                            </p>
                        </div>
                        <button 
                            onClick={() => navigate('/login')}
                            className="auth-btn primary-btn font-bold mt-2"
                        >
                            Đăng nhập ngay
                        </button>
                    </div>
                ) : (
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="newPassword">Mật khẩu mới</label>
                            <div className="input-wrapper">
                                <Lock className="input-icon" size={18} />
                                <input
                                    id="newPassword"
                                    type="password"
                                    required
                                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)..."
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    disabled={!token}
                                    className="focus-glow"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
                            <div className="input-wrapper">
                                <Lock className="input-icon" size={18} />
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    required
                                    placeholder="Nhập lại mật khẩu mới..."
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={!token}
                                    className="focus-glow"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="auth-btn primary-btn font-bold mt-2" 
                            disabled={isLoading || !token}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="btn-icon spinning" size={18} />
                                    <span>Đang cập nhật...</span>
                                </>
                            ) : (
                                <span>Đặt lại mật khẩu</span>
                            )}
                        </button>

                        <div className="auth-footer mt-6">
                            <button 
                                type="button" 
                                onClick={() => navigate('/login')} 
                                className="auth-link hover:underline bg-transparent border-none cursor-pointer text-slate-500 p-0 font-semibold flex items-center gap-1.5 justify-center w-full"
                            >
                                <ArrowLeft size={16} />
                                <span>Hủy bỏ và quay lại</span>
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPasswordPage;
