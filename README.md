# BKMAP - Bản đồ Phòng trọ Bách Khoa 🗺️

Chào mừng bạn đến với dự án **BKMAP** - Nền tảng bản đồ tương tác giúp sinh viên Bách Khoa và các trường Đại học khu vực dễ dàng tra cứu, tìm kiếm, đánh giá và đăng tải thông tin phòng trọ.

---

## 🏗️ Kiến trúc Công nghệ (Tech Stack)

Dự án được xây dựng theo mô hình Monorepo hiện đại, bao gồm:

*   **Frontend:** React, Vite, Tailwind CSS, Zustand, Leaflet (Maps).
*   **Backend:** Node.js, Express, Prisma ORM.
*   **Database & Storage:** PostgreSQL (Supabase), Redis (Caching).
*   **Deployment (Production):** AWS EC2, Docker Compose, Caddy (Auto HTTPS), GitHub Actions (CI/CD).

---

## 🛠️ Yêu cầu Hệ thống (Prerequisites)

Để chạy dự án trên máy cá nhân, bạn cần cài đặt:
1. **Node.js**: >= 18.x (Khuyên dùng v20 LTS).
2. **PostgreSQL**: DB Local hoặc sử dụng Database Cloud như Supabase.
3. **Redis**: (Tùy chọn cho local) Dùng để test tính năng cache/rate-limit.
4. **Git**: Quản lý phiên bản.

---

## 💻 Hướng dẫn Chạy Local (Dành cho Devs)

### 1. Khởi động Backend

```bash
cd backend
npm install
```

**Cấu hình Biến môi trường (`backend/.env`):**
Tạo file `.env` và thiết lập các biến cơ bản:
```env
PORT=3000
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/bkmap_db"
ACCESS_JWT_SECRET="mat_khau_bi_mat_access"
REFRESH_JWT_SECRET="mat_khau_bi_mat_refresh"
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
REDIS_HOST="localhost"
```

**Khởi tạo Database & Chạy Server:**
```bash
# Đồng bộ Schema từ Prisma xuống DB
npx prisma db push

# Chạy backend server (Cổng 3000)
npm run dev
```

### 2. Khởi động Frontend

Mở một Terminal mới:
```bash
cd frontend
npm install
```

**Cấu hình Biến môi trường (`frontend/.env`):**
Tạo file `.env`:
```env
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

**Chạy Ứng dụng:**
```bash
# Chạy frontend web (Cổng 5173)
npm run dev
```
Truy cập: `http://localhost:5173`

---

## 🚀 Triển khai Production (CI/CD)

BKMAP được tự động hóa triển khai (CI/CD) thông qua **GitHub Actions**.

1.  **Kiến trúc:** Giao diện tĩnh (Frontend) và API Server (Backend) cùng được host trên AWS EC2 (`t3.small`).
2.  **Web Server:** Sử dụng **Caddy** làm Reverse Proxy để phục vụ file tĩnh và chuyển tiếp API. Caddy tự động cấp phát và gia hạn chứng chỉ SSL (HTTPS) cho tên miền `bksmap-tvsv-dut.id.vn`.
3.  **Luồng Hoạt động:**
    *   Push code lên nhánh `main`/`master`.
    *   Action `deploy-frontend` sẽ build giao diện và SCP trực tiếp vào EC2.
    *   Action `deploy-backend` sẽ kéo code mới và chạy lại Docker Compose (`backend` + `caddy` + `redis`).

*(Để xem hướng dẫn setup server từ đầu, vui lòng tham khảo cẩm nang cơ sở hạ tầng nội bộ).*

---

## 🤝 Quy trình Làm việc Nhóm (Git Workflow)

1.  **Luôn cập nhật code mới nhất trước khi làm việc:**
    ```bash
    git checkout master
    git pull origin master
    ```
2.  **Tạo nhánh (Branch) mới cho mỗi tính năng / bug:**
    ```bash
    git checkout -b feat/search-rooms
    ```
3.  **Commit thay đổi với message rõ ràng:**
    ```bash
    git add .
    git commit -m "feat: Thêm API tìm kiếm phòng trọ theo giá"
    ```
    *Quy tắc tiền tố: `feat:` (Tính năng mới), `fix:` (Sửa lỗi), `refactor:` (Tối ưu code), `docs:` (Tài liệu).*
4.  **Đẩy (Push) nhánh và tạo Pull Request (PR):**
    ```bash
    git push origin feat/search-rooms
    ```
    Lên GitHub, tạo Pull Request và tag đồng đội vào Review Code trước khi Merge.

---
*Happy Coding! ☕*
