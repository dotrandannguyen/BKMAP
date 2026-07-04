/**
 * Cấu hình API URL tập trung cho toàn bộ Frontend.
 *
 * - Production (CloudFront): VITE_API_URL="/api" → gọi relative path cùng domain.
 * - Development (Local):     Không set VITE_API_URL → fallback về localhost:3000.
 *
 * Khi build cho production, CI/CD pipeline sẽ set biến:
 *   VITE_API_URL=/api
 */

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'http://localhost:3000/api') {
    return import.meta.env.VITE_API_URL;
  }
  return `http://${window.location.hostname}:3000/api`;
};

/**
 * Trả về Backend base URL (KHÔNG có /api suffix).
 * Dùng cho Google OAuth redirect và các trường hợp cần URL gốc.
 */
const getBackendUrl = () => {
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'http://localhost:3000/api') {
    // Nếu VITE_API_URL = "/api", thì backend base = "" (cùng domain)
    return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
  }
  return `http://${window.location.hostname}:3000`;
};

export { getApiUrl, getBackendUrl };
