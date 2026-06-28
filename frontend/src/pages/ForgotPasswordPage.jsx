import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { useAuthStore } from '../stores/authStore';
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import './Auth.css';

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Vui lòng nhập email')
    .email('Email không đúng định dạng (ví dụ: ten@gmail.com)'),
});

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState('');
  const { forgotPassword, loading, error, message } = useAuthStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    const result = forgotPasswordSchema.safeParse({ email: email.trim() });
    if (!result.success) {
      const msg = result.error.errors[0].message;
      setValidationError(msg);
      toast.error(msg);
      return;
    }

    forgotPassword(result.data.email);
  };

  return (
    <div className="auth-container">
      <div className="auth-bg-decoration">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
      </div>
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="text-black">Quên mật khẩu?</h1>
          <p className="auth-subtitle">
            Đừng lo! Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu.
          </p>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}
        {message && (
          <div className="success-message">
            <CheckCircle size={20} />
            <span>{message}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input
                type="text"
                id="email"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setValidationError(''); }}
                required
              />
            </div>
            {validationError && (
              <span className="field-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                {validationError}
              </span>
            )}
          </div>
          <button type="submit" className="auth-btn primary-btn" disabled={loading}>
            {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login" className="auth-link">
            <ArrowLeft size={16} />
            Quay lại trang đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
