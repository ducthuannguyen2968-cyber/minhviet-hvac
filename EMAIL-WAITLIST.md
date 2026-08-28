# Chuỗi email waitlist (Resend)

Khi khách điền form "Đăng Ký Khảo Sát" (`#quoteForm` → `/api/submit-lead`) **và có nhập email hợp lệ**,
[netlify/functions/submit-lead.js](netlify/functions/submit-lead.js) gửi ngay 3 email qua Resend,
tuần tự 1 → 2 → 3:

| # | Vai trò | Ghi chú |
|---|---------|---------|
| 1 | Xác nhận đã nhận yêu cầu khảo sát | Gửi ngay |
| 2 | Nuôi dưỡng — vì sao khảo sát sớm có lợi | Gửi ngay (trước đây +2 ngày, **delay đã bỏ**) |
| 3 | Chốt — kèm link trang thanh toán `https://minhviethvac.asia/thanhtoan/` | Gửi ngay (trước đây +1 ngày) |

Người gửi: `Cơ Điện Lạnh Minh Việt <cskh@minhviethvac.asia>` (domain riêng, cùng domain đã verify với `no-reply@`).
Email báo lead cho team vẫn gửi từ `no-reply@minhviethvac.asia` như cũ.

## Chế độ test

Email có chuỗi `+test` ở phần trước dấu `@` (vd `tenmình+test@gmail.com`) → vẫn gửi cả 3 email ngay,
subject được thêm tiền tố `[TEST]` để dễ lọc trong hộp thư khi kiểm thử. (Do delay đã bỏ nên hành vi
gửi giống hệt luồng thường.)

## Biến môi trường (Netlify → Site settings → Environment variables)

| Biến | Bắt buộc | Mặc định (fallback trong code) |
|------|----------|-------------------------------|
| `RESEND_API_KEY` | Nên set | key trong `resend_config.txt` |
| `RESEND_WAITLIST_FROM` | Không | `Cơ Điện Lạnh Minh Việt <cskh@minhviethvac.asia>` |
| `RESEND_FROM` | Không | `Minh Việt HVAC <no-reply@minhviethvac.asia>` |
| `PAYMENT_URL` | Không | `https://minhviethvac.asia/thanhtoan/` |
| `LEAD_NOTIFY_EMAIL` | Không | `ducthuannguyen2968@gmail.com` |

## Nội dung email

Đã viết sẵn 3 email tiếng Việt theo giọng `sales_script.md` (xưng "Minh Việt", gọi khách "anh/chị",
câu ngắn, không từ corporate). Sửa trực tiếp `subject`/`html` của 3 phần tử trong hàm
`buildWaitlistEmails()` trong [submit-lead.js](netlify/functions/submit-lead.js).

**Lưu ý cần rà lại:** Email 3 gọi khoản thanh toán là *"phí giữ chỗ, được trừ vào giá trị hợp đồng"*.
Nếu sản phẩm/dịch vụ đang cấu hình trên trang `/thanhtoan/` (bảng `products`) là thứ khác
(vd phí thiết kế, phí khảo sát có thu…), sửa lại câu mô tả cho khớp.
