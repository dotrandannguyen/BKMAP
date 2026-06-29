import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { useAuthStore } from '../stores/authStore';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import './Auth.css';

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z
    .string()
    .min(1, 'Vui lòng xác nhận mật khẩu'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp.',
  path: ['confirmPassword'],
});

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  const { resetPassword, loading, error, message } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const getTokenFromURL = () => {
    const params = new URLSearchParams(location.search);
    return params.get('token');
  };

  const getPasswordStrength = (pw) => {
    if (!pw) return { level: 0, text: '', color: '' };
    const length = pw.length;
    const hasUpperCase = /[A-Z]/.test(pw);
    const hasNumber = /[0-9]/.test(pw);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pw);

    if (length < 6) return { level: 1, text: 'Mật khẩu quá ngắn', color: '#ef4444' };
    if (length >= 10 && hasUpperCase && hasNumber && hasSpecial) return { level: 4, text: 'Độ bảo mật: Rất mạnh', color: '#22c55e' };
    if (length >= 8 && (hasUpperCase || hasNumber || hasSpecial)) return { level: 3, text: 'Độ bảo mật: Mạnh', color: '#3b82f6' };
    return { level: 2, text: 'Độ bảo mật: Trung bình', color: '#f59e0b' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationErrors({});

    const result = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const fieldErrors = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0]] = err.message;
      });
      setValidationErrors(fieldErrors);
      toast.error(result.error.errors[0].message);
      return;
    }

    const token = getTokenFromURL();
    if (token) {
      resetPassword(token, password, () => {
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      });
    } else {
      toast.error('Không tìm thấy mã xác thực (token). Vui lòng kiểm tra lại liên kết từ email.');
      setValidationErrors({ token: 'Không tìm thấy mã xác thực (token).' });
    }
  };

  const token = getTokenFromURL();

  return (
    <div className="auth-container">
      <div className="auth-bg-decoration">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
      </div>
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="text-black">Đặt lại mật khẩu</h1>
          <p className="auth-subtitle">Tạo mật khẩu mới an toàn cho tài khoản của bạn.</p>
        </div>

        {/* Error Messages */}
        {error && (
          <div className="error-message mb-5">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Message */}
        {message && (
          <div className="success-message mb-5">
            <CheckCircle size={20} />
            <span>{message}</span>
          </div>
        )}

        {!token && !message && (
          <div className="error-message mb-5">
            <AlertCircle size={20} />
            <span>Liên kết không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu lại mã mới.</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">Mật khẩu mới</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Nhập mật khẩu mới"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setValidationErrors((prev) => ({ ...prev, password: '' })); }}
                required
                disabled={!token || !!message}
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
            {password && (
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
            {validationErrors.password && (
              <span className="field-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                {validationErrors.password}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password">Xác nhận mật khẩu mới</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                id="confirm-password"
                placeholder="Xác nhận lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setValidationErrors((prev) => ({ ...prev, confirmPassword: '' })); }}
                required
                disabled={!token || !!message}
              />
            </div>
            {validationErrors.confirmPassword && (
              <span className="field-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                {validationErrors.confirmPassword}
              </span>
            )}
          </div>

          <button 
            type="submit" 
            className="auth-btn primary-btn font-bold" 
            disabled={loading || !token || !!message}
          >
            {loading ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
          </button>
        </form>

        <div className="auth-footer">
          <button onClick={() => navigate('/login')} className="auth-link">
            Quay lại đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
