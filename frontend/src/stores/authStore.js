import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  isLoggedIn: !!localStorage.getItem('accessToken'),
  userEmail: localStorage.getItem('userEmail') || '',
  userName: localStorage.getItem('userName') || '',
  userAvatar: localStorage.getItem('userAvatar') || '',

  // Khôi phục phiên đăng nhập từ localStorage khi F5
  restoreSession: () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      set({
        isLoggedIn: true,
        userEmail: localStorage.getItem('userEmail') || '',
        userName: localStorage.getItem('userName') || '',
        userAvatar: localStorage.getItem('userAvatar') || '',
      });
    }
  },

  // Đăng nhập thành công
  login: (email, name, avatar) => {
    set({
      isLoggedIn: true,
      userEmail: email,
      userName: name || email.split('@')[0],
      userAvatar: avatar || '',
    });
  },

  // Đăng xuất
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userAvatar');
    set({
      isLoggedIn: false,
      userEmail: '',
      userName: '',
      userAvatar: '',
    });
  },

  changePassword: async ({ oldPassword, newPassword, confirmPassword }) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('Bạn chưa đăng nhập.');
    }

    const response = await fetch('/api/auth/change-password', {
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
