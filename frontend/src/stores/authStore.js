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
}));
