const originalFetch = window.fetch;

let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = (accessToken) => {
  refreshSubscribers.map(cb => cb(accessToken));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (cb) => {
  refreshSubscribers.push(cb);
};

window.fetch = async (input, init = {}) => {
  let response;
  try {
    response = await originalFetch(input, init);
  } catch (error) {
    throw error;
  }
  
  const apiUrl = import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'http://localhost:3000/api' ? import.meta.env.VITE_API_URL : `http://${window.location.hostname}:3000/api`;
  const url = typeof input === 'string' ? input : input.url;
  
  // Chỉ can thiệp nếu là lỗi 401 và gọi vào API của chính mình (bỏ qua external api)
  // Và tránh can thiệp vào chính request refresh/login để không lặp vô hạn
  if (response.status === 401 && url.includes(apiUrl) && !url.includes('/auth/refresh-token') && !url.includes('/auth/login')) {
    
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await originalFetch(`${apiUrl}/auth/refresh-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          // Gửi kèm refreshToken HttpOnly cookie
          credentials: 'include' 
        });
        
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          // Cập nhật accessToken mới
          localStorage.setItem('accessToken', data.accessToken);
          onRefreshed(data.accessToken);
        } else {
          // Refresh thất bại (hết hạn 7 ngày, đổi pass, etc.)
          localStorage.removeItem('accessToken');
          localStorage.removeItem('userRole');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userName');
          window.location.href = '/login?expired=true';
        }
      } catch (error) {
        console.error('Lỗi khi gọi api refresh token:', error);
        localStorage.removeItem('accessToken');
        window.location.href = '/login?expired=true';
      } finally {
        isRefreshing = false;
      }
    }
    
    // Đợi token mới (hoặc nếu đã có sẵn thì chạy luôn)
    return new Promise(resolve => {
      addRefreshSubscriber(async (newToken) => {
        // Retry request cũ với token mới
        // Tạo object headers mới hoặc ghi đè
        const headers = new Headers(init.headers || {});
        if (headers.has('Authorization') || localStorage.getItem('accessToken')) {
           headers.set('Authorization', `Bearer ${newToken}`);
        }
        
        init.headers = headers;
        
        // Gọi lại original fetch
        resolve(await originalFetch(input, init));
      });
    });
  }
  
  return response;
};
