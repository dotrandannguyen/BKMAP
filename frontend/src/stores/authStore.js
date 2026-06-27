import { create } from 'zustand';
import { useUiStore } from './uiStore.js';

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'http://localhost:3000/api') {
    return import.meta.env.VITE_API_URL;
  }
  return `http://${window.location.hostname}:3000/api`;
};

export const useAuthStore = create((set) => ({
  isLoggedIn: !!localStorage.getItem('accessToken'),
  userEmail: localStorage.getItem('userEmail') || '',
  userName: localStorage.getItem('userName') || '',
  userAvatar: localStorage.getItem('userAvatar') || '',
  userRole: localStorage.getItem('userRole') || 'USER',

  // Khôi phục phiên đăng nhập từ localStorage khi F5
  restoreSession: () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Đọc role từ JWT payload (không cần verify, chỉ để hiển thị UI — backend vẫn verify)
      let role = 'USER';
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        role = payload.role || 'USER';
        localStorage.setItem('userRole', role);
      } catch (_) { /* ignore decode errors */ }

      set({
        isLoggedIn: true,
        userEmail: localStorage.getItem('userEmail') || '',
        userName: localStorage.getItem('userName') || '',
        userAvatar: localStorage.getItem('userAvatar') || '',
        userRole: role,
      });
    }
  },

  // Đăng nhập thành công
  login: (email, name, avatar, role = 'USER') => {
    set({
      isLoggedIn: true,
      userEmail: email,
      userName: name || email.split('@')[0],
      userAvatar: avatar || '',
      userRole: role,
    });
  },

  // Đăng xuất
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userAvatar');
    localStorage.removeItem('userRole');
    localStorage.removeItem('favoriteRoomIds');
    set({
      isLoggedIn: false,
      userEmail: '',
      userName: '',
      userAvatar: '',
      userRole: 'USER',
    });
    
    // Reset favorites/bookmarks to guest local state
    try {
      useUiStore.getState().loadSavedIds();
    } catch (e) {
      console.error('Failed to reset saved IDs on logout:', e);
    }
  },

  loading: false,
  error: null,
  message: null,

  forgotPassword: async (email) => {
    set({ loading: true, error: null, message: null });
    try {
      const response = await fetch(`${getApiUrl()}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Yêu cầu thất bại.');
      }
      set({ loading: false, message: data.message || data.data?.message });
    } catch (error) {
      set({ loading: false, error: error.message });
    }
  },

  resetPassword: async (token, password, onSuccess) => {
    set({ loading: true, error: null, message: null });
    try {
      const response = await fetch(`${getApiUrl()}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Đặt lại mật khẩu thất bại.');
      }
      set({ loading: false, message: data.message || data.data?.message });
      if (onSuccess) onSuccess();
    } catch (error) {
      set({ loading: false, error: error.message });
    }
  },

  changePassword: async ({ oldPassword, newPassword, confirmPassword }) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('Bạn chưa đăng nhập.');
    }

    const response = await fetch(`${getApiUrl()}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.errors) {
        // eslint-disable-next-line no-throw-literal
        throw { message: data.message, errors: data.errors };
      }
      throw new Error(data.message || 'Đã có lỗi xảy ra.');
    }

    return data;
  },
}));
