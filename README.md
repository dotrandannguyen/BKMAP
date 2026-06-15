# BKMAP - Bản đồ Phòng trọ Bách Khoa 🗺️

Chào mừng bạn đến với dự án **BKMAP** - Hệ thống Bản đồ tương tác giúp sinh viên Bách Khoa dễ dàng tra cứu, tìm kiếm và đăng tải thông tin phòng trọ xung quanh khu vực trường.

Dự án được cấu trúc theo dạng Monorepo gồm 2 phần chính:
- **`backend`**: Node.js, Express, Prisma, PostgreSQL.
- **`frontend`**: React, Vite, Tailwind CSS.

---

## 🛠 Yêu cầu hệ thống (Prerequisites)

Trước khi bắt đầu, đảm bảo máy bạn đã cài đặt các công cụ sau:
1. **Node.js**: Phiên bản >= 18.x (Khuyên dùng v20 LTS).
2. **PostgreSQL**: Đã cài đặt và đang chạy ở máy tính của bạn (Hoặc bạn có thể dùng một DB URL Online như Supabase / Neon / Render).
3. **Git**: Để lấy code và quản lý phiên bản.

---

## 🚀 Hướng dẫn cài đặt & Chạy dự án (Dành cho Devs)

### 1. Cài đặt Backend

Mở terminal và trỏ vào thư mục `backend`:

```bash
cd backend
npm install
```

**Cấu hình Biến môi trường:**
Tạo file `.env` ở trong thư mục `backend` (Bạn có thể copy từ `.env.example` nếu có) và cấu hình các biến sau:

```env
# Cấu hình cổng chạy Server
PORT=3000

# Chuỗi kết nối Database PostgreSQL
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/bkmap_db?schema=public"

# Secret Key để mã hóa JWT Token (Có thể tự gõ bừa 1 chuỗi dài)
ACCESS_JWT_SECRET="bkmap_access_super_secret_key"
REFRESH_JWT_SECRET="bkmap_refresh_super_secret_key"

# Môi trường chạy (dev / production)
NODE_ENV="development"
CLIENT_URL="http://localhost:5173"
```

**Khởi tạo Database (Prisma):**
Chạy lệnh sau để đồng bộ Schema trong code xuống Database của bạn:

```bash
npx prisma db push
```
**Chạy Server:**
```bash
npm run dev
```
👉 Backend sẽ chạy ở `http://localhost:3000`

---

### 2. Cài đặt Frontend

Mở một tab terminal mới và trỏ vào thư mục `frontend`:

```bash
cd frontend
npm install
```

**Cấu hình Biến môi trường:**
Tạo file `.env` ở trong thư mục `frontend` và điền cấu hình (ví dụ kết nối Supabase, API URL):

```env
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_ANON_KEY=sb_publishable_... (Hỏi Leader để lấy Key thật)
```

**Chạy App:**
```bash
npm run dev
```
👉 Frontend sẽ chạy ở `http://localhost:5173`

---

## 🤝 Hướng dẫn làm việc nhóm (Collab Workflow)

Để tránh xung đột (Conflict) trong quá trình làm việc, team hãy tuân thủ luồng Git cơ bản sau:

**1. Luôn kéo code mới nhất trước khi làm việc**
```bash
git checkout master
git pull origin master
```

**2. Tạo Branch mới cho mỗi tính năng / bug fix**
Ví dụ bạn được giao làm tính năng Search:
```bash
git checkout -b feat/search-rooms
```

**3. Lưu thay đổi và Commit**
Commit Message nên rõ ràng, ngắn gọn:
```bash
git add .
git commit -m "feat: Thêm API tìm kiếm phòng trọ theo giá"
```
*(Tiền tố tham khảo: `feat:` (Tính năng mới), `fix:` (Sửa lỗi), `refactor:` (Tối ưu code), `docs:` (Tài liệu))*

**4. Đẩy (Push) Branch lên Github và tạo Pull Request (PR)**
```bash
git push origin feat/search-rooms
```
Lên Github -> Nhấn **Compare & pull request** -> Nhờ 1 bạn khác Review code và Merge vào nhánh `master`.

---

## 💡 Lưu ý khi làm việc với Prisma (Database)

- Nếu bạn **sửa đổi file `prisma/schema.prisma`** (Ví dụ thêm bảng, thêm cột), hãy chạy lại lệnh `npx prisma db push` để update xuống Database ở máy bạn.
- Sau khi chạy push xong, Prisma sẽ tự động generate ra client mới để code có gợi ý autocomplete.

🎉 **Happy Coding!** Nếu gặp lỗi gì khó hiểu, hãy nhắn ngay lên Group để mọi người cùng fix nhé!
