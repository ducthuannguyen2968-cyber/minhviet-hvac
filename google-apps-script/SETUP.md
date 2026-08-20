# Kích hoạt Google Sheets + email

Google Sheet đích: `MINH VIỆT - LEADS WEBSITE`.

1. Mở Google Sheet, chọn **Tiện ích mở rộng → Apps Script**.
2. Xóa mã mẫu và dán toàn bộ nội dung file `Code.gs`.
3. Chọn **Triển khai → Lượt triển khai mới → Ứng dụng web**.
4. Thiết lập **Thực thi với tư cách: Tôi** và **Ai có quyền truy cập: Bất kỳ ai**.
5. Cho phép quyền Google Sheets, Google Drive và gửi email khi Google hỏi.
6. Sao chép URL ứng dụng web dạng `https://script.google.com/macros/s/.../exec`.
7. URL triển khai hiện tại đã được cấu hình sẵn trong Netlify Function. Có thể tạo biến môi trường `GOOGLE_APPS_SCRIPT_URL` để ghi đè URL này khi triển khai lại Apps Script sau này.

Sau khi kích hoạt, cần gửi một lead thử và kiểm tra đủ ba kết quả: một dòng mới trong tab `Leads Website`, email tới `ducthuannguyen2968@gmail.com`, và file đính kèm trong thư mục Drive `MINH VIỆT - BẢN VẼ WEBSITE`.
