# Kế hoạch Triển khai Redis Caching (Trang chủ & Chi tiết phòng)

Bản kế hoạch này mô tả chi tiết kiến trúc, luồng đi của dữ liệu và các quy tắc để triển khai hệ thống Redis Cache an toàn cho dự án BKMAP.

## I. Mục tiêu Cache trong Redis

Mục tiêu cốt lõi của việc áp dụng Redis là **tối ưu hóa hiệu suất cho 2 API có tần suất ĐỌC (GET) cao nhất hệ thống**, cụ thể:

### 1. Cache Trang chủ (Danh sách phòng mặc định)
- **Endpoint:** `GET /rooms?page=1&limit=10` (hoặc limit default của FE).
- **Mục tiêu:** Trả về kết quả ngay lập tức cho các Guest (người dùng chưa đăng nhập) khi họ vừa truy cập vào website, giảm thiểu query quét toàn bộ bảng `Room` trong PostgreSQL.
- **Điều kiện Cache (Bypass):**
  - **CHỈ** cache khi là Guest (không truyền Header `Authorization`).
  - **KHÔNG** cache khi có các tham số filter (giá, diện tích, khoảng cách, phường, search...).
  - **KHÔNG** cache khi có sắp xếp đặc biệt (nếu có).
  - Chỉ cache với query đúng mặc định.
- **Thời gian sống (TTL):** 3 - 5 phút (Do danh sách phòng trang chủ có thể thay đổi liên tục).

### 2. Cache Chi tiết phòng
- **Endpoint:** `GET /rooms/:id`
- **Mục tiêu:** Tăng tốc độ load chi tiết một phòng trọ, giảm thiểu chi phí truy xuất dữ liệu từ các bảng liên kết (User, RoomImage, Amenities...).
- **Điều kiện Cache (Bypass):**
  - **KHÔNG** cache nếu người dùng đã đăng nhập (để đảm bảo trạng thái cá nhân như "Đã lưu phòng", "Thả tim" luôn được chính xác). Tương lai nếu FE tách riêng API lấy trạng thái cá nhân thì sẽ điều chỉnh sau. Hiện tại để an toàn nhất: bypass nếu có Token.
- **Thời gian sống (TTL):** 30 phút - 2 giờ (Thông tin phòng ít khi thay đổi).

---

## II. Luồng Hệ Thống Tổng Thể (Flow)

Dữ liệu Database PostgreSQL vẫn là nguồn gốc (Source of truth). Redis chỉ đóng vai trò tăng tốc.

```
Request từ Client
       ↓
[Tầng 1] Auth Middleware (Kiểm tra Token)
       ↓
[Tầng 2] Cache Middleware (Redis Check)
       ├──> Có Cache (Hit) ──> Trả về Response ngay lập tức (Xong)
       │
       └──> Không Cache (Miss) / Bypass
                ↓
[Tầng 3] Room Controller
                ↓
[Tầng 4] Room Service
                ↓
[Tầng 5] Prisma ORM ──> PostgreSQL
                ↓
       Controller bắt dữ liệu 
                ├──> Ghi đè res.json() để lưu ngầm vào Redis
                └──> Trả về Client
```

---

## III. Cơ chế Xóa Cache (Invalidation)

Đây là phần quan trọng nhất để đảm bảo dữ liệu không bị sai lệch (Stale data). Khi chủ trọ thực hiện **BẤT KỲ** hành động làm thay đổi dữ liệu phòng, hệ thống phải tự xóa Cache.

### Các hành động kích hoạt Invalidation:
1. Sửa thông tin phòng (Giá, diện tích, trạng thái, mô tả...).
2. Thêm ảnh mới.
3. Xóa ảnh.
4. Thay đổi thứ tự ảnh.
5. Xóa phòng.
6. Đăng phòng mới.

### Flow Invalidation:
```
Client gửi PUT/PATCH/DELETE /rooms/:id
               ↓
Service xử lý Logic & Ghi vào PostgreSQL thành công
               ↓
[Cache Service] Kích hoạt xóa Cache:
   1. Xóa Cache Chi tiết: DEL `cache:room_detail:{id}`
   2. Xóa Cache Danh sách: Dùng SCAN để xóa toàn bộ `cache:rooms:home:*`
               ↓
Trả về Response cho Client (Các Request đọc tiếp theo sẽ tự query DB và sinh ra Cache mới).
```

---

## IV. Chi tiết Kỹ thuật Triển khai

1. **Thư viện:** Sử dụng `ioredis` (Mạnh mẽ, hỗ trợ pipeline và auto-reconnect).
2. **`cache.service.js`**: Service chịu trách nhiệm GET, SET (với TTL), DEL, và Invalidate theo pattern.
3. **`cache.middleware.js`**: 
   - Hàm `cacheGuestRooms`: Phân tích request query, nếu đúng quy tắc mặc định -> chặn request lấy từ cache.
   - Hàm `cacheRoomDetail`: Lấy `:id` -> chặn request lấy từ cache.
   - Sử dụng kĩ thuật Monkey-patching `res.json()`: Nếu cache miss, middleware sẽ tự can thiệp vào hàm trả response của Controller để bắt dữ liệu và lưu ngầm (async) vào Redis mà không làm chậm request.

## User Review Required

> [!IMPORTANT]
> - Các mục tiêu và rules của bạn đã được phản ánh đầy đủ trong bản plan này chưa?
> - **Câu hỏi hạ tầng:** Trên máy tính dev của bạn hiện tại đã chạy Redis Server chưa? Mình có cần hỗ trợ tạo thêm file `docker-compose.yml` để bạn cài đặt Redis nhanh không?
