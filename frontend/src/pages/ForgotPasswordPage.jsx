import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import './LoginPage.css';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const apiUrl = import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'http://localhost:3000/api' ? import.meta.env.VITE_API_URL : `http://${window.location.hostname}:3000/api`;
            const response = await fetch(`${apiUrl}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Gửi yêu cầu thất bại. Vui lòng kiểm tra lại.');
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
                    <h1>Quên mật khẩu</h1>
                    <p className="auth-subtitle">Nhập email để nhận liên kết khôi phục mật khẩu</p>
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
                            <h3 className="text-base font-bold text-on-surface">Yêu cầu đã được gửi!</h3>
                            <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                                Vui lòng kiểm tra hộp thư đến của email <strong>{email}</strong> và làm theo hướng dẫn để đặt lại mật khẩu của bạn.
                            </p>
                        </div>
                        <button 
                            onClick={() => navigate('/login')}
                            className="auth-btn primary-btn font-bold mt-2"
                        >
                            Quay lại đăng nhập
                        </button>
                    </div>
                ) : (
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">Email tài khoản của bạn</label>
                            <div className="input-wrapper">
                                <Mail className="input-icon" size={18} />
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    placeholder="Nhập email đăng ký tài khoản..."
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="focus-glow"
                                />
                            </div>
                        </div>

                        <button type="submit" className="auth-btn primary-btn font-bold mt-2" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="btn-icon spinning" size={18} />
                                    <span>Đang gửi yêu cầu...</span>
                                </>
                            ) : (
                                <span>Gửi yêu cầu khôi phục</span>
                            )}
                        </button>

                        <div className="auth-footer mt-6">
                            <button 
                                type="button" 
                                onClick={() => navigate('/login')} 
                                className="auth-link hover:underline bg-transparent border-none cursor-pointer text-slate-500 p-0 font-semibold flex items-center gap-1.5 justify-center w-full"
                            >
                                <ArrowLeft size={16} />
                                <span>Quay lại đăng nhập</span>
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
