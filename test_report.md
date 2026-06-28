# BÁO CÁO KẾT QUẢ KIỂM THỬ HỆ THỐNG CHI TIẾT (BKMAP) 🗺️

*Thời gian kiểm thử:* 14:00:51 28/6/2026
*Tổng số test case:* **61** | *Đạt:* **61** ✅ | *Thất bại:* **0** ❌
*Thời gian thực thi:* **3.97 giây**

## I. BẢNG TỔNG HỢP CHI TIẾT CÁC KỊCH BẢN

| Nhóm | Kịch bản | Trạng thái | Chi tiết lỗi (nếu có) |
| :--- | :--- | :---: | :--- |
| BKMAP System Integration Automated Tests > A. Authentication & Account Management | A1.1 Đăng ký thành công với thông tin hợp lệ | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > A. Authentication & Account Management | A1.2 Đăng ký với email đã tồn tại | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > A. Authentication & Account Management | A1.3 Đăng ký thiếu trường bắt buộc | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > A. Authentication & Account Management | A1.4 Đăng ký với mật khẩu quá ngắn | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > A. Authentication & Account Management | A1.5 Đăng ký với userName quá ngắn | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > A. Authentication & Account Management | A1.6 Đăng ký với email sai định dạng | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > A. Authentication & Account Management | A2.1 Xác thực thành công bằng token hợp lệ | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > A. Authentication & Account Management | A2.2 Xác thực bằng token đã hết hạn (> 24 giờ) | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > A. Authentication & Account Management | A2.3 Xác thực bằng token sai / không tồn tại | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > A. Authentication & Account Management | A2.4 Xác thực qua link GET trong email | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > A. Authentication & Account Management | A3.1 Đăng nhập thành công | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > A. Authentication & Account Management | A3.2 Đăng nhập sai mật khẩu | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > A. Authentication & Account Management | A3.3 Đăng nhập với email chưa đăng ký | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > A. Authentication & Account Management | A3.5 Đăng nhập tài khoản bị khóa (isBanned: true) | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > A. Authentication & Account Management | A3.6 Đăng nhập bằng email Google (không có mật khẩu local) | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > A. Authentication & Account Management | A4.1 - A4.2 Luồng Google OAuth hoàn chỉnh và liên kết email | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > A. Authentication & Account Management | A5.1 Đổi mật khẩu thành công | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > A. Authentication & Account Management | A5.2 Đổi mật khẩu sai mật khẩu cũ | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > A. Authentication & Account Management | A5.4 Mật khẩu mới và xác nhận không khớp | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > A. Authentication & Account Management | A6.1 Refresh token hợp lệ (từ cookie) | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > A. Authentication & Account Management | A6.2 Refresh token hết hạn hoặc bị thu hồi | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > A. Authentication & Account Management | A7.1 Đăng xuất thành công | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > B. Room Management (Host) | B1.1 - B1.2 Đăng tin thành công với vị trí & autocomplete địa chỉ | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > B. Room Management (Host) | B1.3 Validation Zod chặn ngay khi điền sai | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > B. Room Management (Host) | B2.1 Chỉnh sửa phòng trọ thành công | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > B. Room Management (Host) | B2.2 Chỉnh sửa phòng của người khác (không phải chủ, không phải ADMIN) | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > B. Room Management (Host) | B4.1 Upload ảnh phòng thành công | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > B. Room Management (Host) | B5.1 Xóa ảnh thành công | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > B. Room Management (Host) | B3.2 Xóa phòng của người khác (không phải chủ, không phải ADMIN) | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > B. Room Management (Host) | B3.1 Chủ trọ xóa phòng thành công | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > C. Saved / Favorites List | C1.1 Lấy danh sách yêu thích khi đã đăng nhập (Chưa có gì) | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > C. Saved / Favorites List | C2.1 Thêm phòng vào yêu thích thành công | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > C. Saved / Favorites List | C2.2 Thêm phòng đã yêu thích rồi (trùng lặp / Upsert) | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > C. Saved / Favorites List | C1.1 Lấy danh sách yêu thích khi đã đăng nhập (Có 1 phòng) | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > C. Saved / Favorites List | C3.1 Bỏ yêu thích thành công | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > C. Saved / Favorites List | C4.1 Đồng bộ yêu thích khi phòng bị xóa (Cascade) | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > D. Admin Management | D1.1 Thống kê Dashboard hiển thị đúng chỉ số | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > D. Admin Management | D1.2 User thường truy cập trang Admin (Bị chặn 403) | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > D. Admin Management | D2.3 Khóa tài khoản user (Ban) | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > D. Admin Management | D2.4 Admin tự khóa chính mình (Bị chặn 400) | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > D. Admin Management | D2.7 Mở khóa user (Unban) | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > D. Admin Management | D3.3 Ẩn phòng vi phạm (Admin Hide) | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > D. Admin Management | D3.5 Khôi phục phòng (Restore) | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > D. Admin Management | D3.7 Admin xóa phòng vĩnh viễn | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > E. Search, Filter & Public Display | E1.1 Hiển thị danh sách phòng mới nhất trên Trang chủ | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > E. Search, Filter & Public Display | E2.3 - E2.4 Lọc danh sách phòng theo khoảng giá và tên đường | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > E. Search, Filter & Public Display | E3.1 Hiển thị đầy đủ thông tin chi tiết phòng | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > F & G. Interactive Map & Host Dashboard | F1 - F2 Vị trí bản đồ và marker giá tiền format | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > F & G. Interactive Map & Host Dashboard | G1 Chỉ hiển thị phòng do chính user tạo ở Dashboard | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > H. Caching & Performance | H1.1 - H1.2 Redis Cache - Miss & Hit cho Guest | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > H. Caching & Performance | H1.3 Cache chỉ áp dụng cho guest, không áp dụng cho user đăng nhập | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > H. Caching & Performance | H3.1 Tắt Redis → Graceful Degradation | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > I. Security & Rate Limiting | I1.1 Global Rate Limit headers | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > I. Security & Rate Limiting | I2.1 Gọi API yêu cầu auth mà không có token (Bị chặn 401) | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > I. Security & Rate Limiting | I2.3 Gọi API với token giả mạo (Bị chặn 401) | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > I. Security & Rate Limiting | I3.1 CORS origin headers | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > I. Security & Rate Limiting | I4.1 Helmet Security Headers | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > J. Error Handling & Edge Cases | J1.1 Gửi roomId là UUID hợp lệ nhưng không tồn tại (404) | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > J. Error Handling & Edge Cases | J1.2 Gửi ID không phải UUID (400) | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > J. Error Handling & Edge Cases | J3.1 Proxy Geocoding hoạt động đúng | **🟢 PASS** | - |
| BKMAP System Integration Automated Tests > J. Error Handling & Edge Cases | J3.2 Gọi geocode với query rỗng (400) | **🟢 PASS** | - |

---
*Báo cáo được sinh tự động bởi BKMAP Test Automation Runner.*
