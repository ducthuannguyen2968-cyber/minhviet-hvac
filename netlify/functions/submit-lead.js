const { createClient } = require('@libsql/client');

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxwEkNcIzDhdBW4HWrxUCn8jQiYOwUSZ_aH6M_Zpb7tgw9Mm78N7i_erJk8dgBb3jGG/exec';

// --- Email qua Resend ---
const RESEND_ENDPOINT = 'https://api.resend.com/emails';
// API key: uu tien bien moi truong RESEND_API_KEY, fallback ve gia tri trong resend_config.txt.
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_D4J93yRj_3npzUpyrzKTy3RhQWwUEYTDw';
const MAIL_FROM = process.env.RESEND_FROM || 'Minh Việt HVAC <no-reply@minhviethvac.asia>';
// Nguoi gui chuoi email waitlist - dia chi thuoc domain rieng minhviethvac.asia.
const WAITLIST_FROM = process.env.RESEND_WAITLIST_FROM || 'Cơ Điện Lạnh Minh Việt <cskh@minhviethvac.asia>';
const TEAM_EMAIL = process.env.LEAD_NOTIFY_EMAIL || 'ducthuannguyen2968@gmail.com';
// Trang thanh toan - dinh kem trong Email 3.
const PAYMENT_URL = process.env.PAYMENT_URL || 'https://minhviethvac.asia/thanhtoan/';
const HOTLINE = '0934 506 191';

const PROJECT_TYPE_LABELS = {
  'biet-thu': 'Biệt thự / Villa',
  penthouse: 'Penthouse / Căn hộ cao cấp',
  'nha-pho': 'Nhà phố / Liền kề',
  'van-phong': 'Văn phòng / Khách sạn',
  'nha-hang': 'Nhà hàng / Quán Cafe',
  'nha-xuong': 'Nhà xưởng / Khác',
};

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function sendViaResend(mail) {
  if (!RESEND_API_KEY) return;
  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: MAIL_FROM, ...mail }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Resend ${res.status}: ${detail}`);
  }
}

// Che do test: email co dang ten+test@... (chuoi "+test" trong phan truoc dau @).
function isTestEmail(email) {
  return /\+test/i.test(String(email || '').split('@')[0]);
}

// 3 email trong chuoi waitlist. Giong van theo sales_script.md: gan gui, cau ngan, xung
// "Minh Viet" - goi khach "anh/chi", khong tu corporate. Chinh sua text tu do trong ham nay.
function buildWaitlistEmails({ name, phone, projectLabel, area }) {
  const signature =
    `<p style="margin-top:28px">Trân trọng,<br><b>Cơ Điện Lạnh Minh Việt</b><br>` +
    `Hotline / Zalo ${HOTLINE} &middot; <a href="https://minhviethvac.asia">minhviethvac.asia</a></p>`;
  const wrap = (inner) =>
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#1f2937;max-width:560px">${inner}${signature}</div>`;
  const button = (label, href) =>
    `<p style="margin:22px 0"><a href="${href}" style="display:inline-block;padding:13px 26px;` +
    `background:#ea580c;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:700">${label}</a></p>`;

  return [
    // Email 1 - xac nhan, gui ngay khi khach dien form.
    {
      subject: 'Minh Việt đã nhận yêu cầu khảo sát của anh/chị',
      html: wrap(`
        <p>Chào ${name},</p>
        <p>Minh Việt đã nhận được yêu cầu khảo sát &amp; báo giá cho công trình của anh/chị.
           Kỹ sư trưởng sẽ gọi lại theo số <b>${phone}</b> trong giờ làm việc để hẹn lịch xuống đo thực tế.</p>
        <p><b>Thông tin anh/chị vừa gửi:</b></p>
        <ul>
          <li>Loại công trình: ${projectLabel}</li>
          <li>Diện tích ước tính: ${area}</li>
        </ul>
        <p><b>Vài điều anh/chị cứ yên tâm trước:</b></p>
        <ul>
          <li>Khảo sát và bản vẽ tính tải 2D miễn phí 100%, không ràng buộc phải ký hợp đồng.</li>
          <li>Chưa có bản vẽ mặt bằng cũng không sao, kỹ sư sẽ hướng dẫn cách gửi.</li>
          <li>Thông tin của anh/chị chỉ dùng để tư vấn và báo giá — có Chính sách bảo mật công khai trên website.</li>
        </ul>
        <p>Cần trao đổi gấp, anh/chị gọi thẳng hotline <b>${HOTLINE}</b> nhé.</p>`),
    },
    // Email 2 - nuoi duong, truoc day gui sau 2 ngay, nay gui ngay (delay da bo).
    {
      subject: 'Vì sao nên gọi Minh Việt trước khi chốt nhà thầu điều hòa',
      html: wrap(`
        <p>Chào ${name},</p>
        <p>Phần lớn nhà thầu nhận bản vẽ rồi lắp cho xong việc. Minh Việt làm khác một chỗ:
           ngồi cùng kiến trúc sư của anh/chị ngay từ bản vẽ đầu tiên, để đường ống gió, vị trí dàn lạnh
           và trần thạch cao ăn khớp với thiết kế — thay vì lắp vội rồi phải đục trần sửa lại.</p>
        <p>Với biệt thự, penthouse hay văn phòng, khác biệt này rất rõ:</p>
        <ul>
          <li>Hệ trung tâm VRV/VRF: đầu tư ban đầu cao hơn máy treo tường khoảng 20–30%, nhưng
              tiết kiệm điện 30–35%, bền 15–20 năm, và chỉ cần 1 dàn nóng cho cả nhà nên ban công
              không chằng chịt máy móc.</li>
          <li>Nhà đã hoàn thiện nội thất vẫn lắp giấu trần được — kỹ sư khảo sát để tìm đường ống
              ít phải cắt sửa trần nhất, giữ gần như nguyên vẹn thẩm mỹ.</li>
          <li>Nhà đang trong giai đoạn thiết kế thì đây là thời điểm tốt nhất để liên hệ —
              càng vào sớm, phương án càng tối ưu và đỡ tốn kém về sau.</li>
        </ul>
        <p>Kỹ sư của Minh Việt vẫn đang chờ để hẹn lịch khảo sát với anh/chị.
           Anh/chị chỉ cần gửi mặt bằng hoặc để lại thời gian thuận tiện là được.</p>`),
    },
    // Email 3 - chot don, truoc day gui sau them 1 ngay, nay gui ngay. Kem link trang thanh toan.
    {
      subject: 'Giữ suất khảo sát ưu tiên cho công trình của anh/chị',
      html: wrap(`
        <p>Chào ${name},</p>
        <p>Đợt này, khi anh/chị đăng ký khảo sát, Minh Việt gửi kèm:</p>
        <ul>
          <li>Bản vẽ tính tải 2D trị giá 5 triệu — miễn phí.</li>
          <li>1 năm bảo dưỡng định kỳ miễn phí tận nhà (khi ký hợp đồng thi công).</li>
          <li>Kỹ sư trưởng khảo sát trực tiếp, báo giá chi tiết, không phát sinh — trong khoảng 2 tiếng.</li>
        </ul>
        <p>Nếu anh/chị muốn chốt lịch và giữ suất ưu tiên trong đợt này, có thể xác nhận qua
           trang thanh toán phí giữ chỗ bên dưới. Khoản này được trừ thẳng vào giá trị hợp đồng
           khi triển khai.</p>
        ${button('Tới trang thanh toán', PAYMENT_URL)}
        <p style="font-size:13px;color:#6b7280">Nếu nút không bấm được, anh/chị mở liên kết này:
           <a href="${PAYMENT_URL}">${PAYMENT_URL}</a></p>
        <p>Hoặc gọi thẳng hotline <b>${HOTLINE}</b>, Minh Việt hỗ trợ anh/chị đặt lịch qua điện thoại.</p>`),
    },
  ];
}

// Gui ca 3 email waitlist ngay lap tuc, tuan tu 1 -> 2 -> 3 (delay da duoc bo theo yeu cau).
// Che do test (email chua "+test"): hanh vi giong het, chi them tien to [TEST] vao subject
// de de loc trong hop thu khi kiem thu.
async function sendWaitlistSequence(payload) {
  if (!RESEND_API_KEY) return;
  const email = String(payload.email || '').trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

  const test = isTestEmail(email);
  const emails = buildWaitlistEmails({
    name: escapeHtml(payload.fullName),
    phone: escapeHtml(payload.phone),
    projectLabel: escapeHtml(PROJECT_TYPE_LABELS[payload.projectType] || payload.projectType || '—'),
    area: escapeHtml(payload.area || '—'),
  });

  for (let i = 0; i < emails.length; i++) {
    try {
      await sendViaResend({
        from: WAITLIST_FROM,
        to: [email],
        subject: (test ? '[TEST] ' : '') + emails[i].subject,
        html: emails[i].html,
      });
    } catch (err) {
      console.error(`submit-lead: gui waitlist email ${i + 1} that bai`, err);
    }
  }
}

// Chi con lo email bao lead moi cho team. Email cho khach da chuyen sang sendWaitlistSequence().
async function sendLeadEmails(payload, leadId) {
  if (!RESEND_API_KEY) return;

  const name = escapeHtml(payload.fullName);
  const phone = escapeHtml(payload.phone);
  const email = String(payload.email || '').trim();
  const projectLabel = escapeHtml(PROJECT_TYPE_LABELS[payload.projectType] || payload.projectType || '—');
  const area = escapeHtml(payload.area || '—');
  const notes = escapeHtml(payload.notes || '—');
  const fileName = escapeHtml(payload.file?.name || '—');
  const source = escapeHtml(payload.source || 'minhviethvac.asia');
  const ref = escapeHtml(leadId || '');

  const tasks = [];

  // B. Bao lead moi cho team
  tasks.push(sendViaResend({
    to: [TEAM_EMAIL],
    reply_to: email || undefined,
    subject: `Lead mới${ref ? ' ' + ref : ''}: ${payload.fullName} - ${payload.phone}`,
    html: `
      <h2>Lead mới từ website</h2>
      <table cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
        <tr><td><b>Họ tên</b></td><td>${name}</td></tr>
        <tr><td><b>Số điện thoại</b></td><td>${phone}</td></tr>
        <tr><td><b>Email</b></td><td>${escapeHtml(email || '—')}</td></tr>
        <tr><td><b>Loại công trình</b></td><td>${projectLabel}</td></tr>
        <tr><td><b>Diện tích</b></td><td>${area}</td></tr>
        <tr><td><b>Ghi chú</b></td><td>${notes}</td></tr>
        <tr><td><b>File đính kèm</b></td><td>${fileName}</td></tr>
        <tr><td><b>Nguồn</b></td><td>${source}</td></tr>
        <tr><td><b>Mã lead</b></td><td>${ref || '—'}</td></tr>
      </table>`,
  }));

  const results = await Promise.allSettled(tasks);
  results.forEach((r) => {
    if (r.status === 'rejected') console.error('submit-lead: gửi email that bai', r.reason);
  });
}

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  },
  body: JSON.stringify(body),
});

// Ghi lead vao bang customers tren Turso (dung chung DB voi /admin).
// Loi o day KHONG lam hong request: lead da duoc luu vao Google Sheets.
let dbClient = null;
let customersSchemaReady = null;

function getDbClient() {
  if (!process.env.TURSO_DATABASE_URL) return null;
  if (!dbClient) {
    dbClient = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return dbClient;
}

function ensureCustomersSchema(client) {
  if (!customersSchemaReady) {
    customersSchemaReady = (async () => {
      await client.execute(`CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL UNIQUE,
        zalo TEXT,
        email TEXT,
        registered_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
      const custSchema = await client.execute("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'customers'");
      if (custSchema.rows[0]?.sql && !/\bemail\b/i.test(String(custSchema.rows[0].sql))) {
        await client.execute('ALTER TABLE customers ADD COLUMN email TEXT');
      }
    })().catch((e) => { customersSchemaReady = null; throw e; });
  }
  return customersSchemaReady;
}

async function upsertCustomer(payload) {
  const client = getDbClient();
  if (!client) return;
  const name = String(payload.fullName || '').trim();
  const phone = String(payload.phone || '').trim();
  const email = String(payload.email || '').trim() || null;
  if (!name || !phone) return;
  await ensureCustomersSchema(client);
  // Trung SDT: cap nhat ten moi nhat, chi dien email khi lead lan nay co gui email.
  await client.execute({
    sql: `INSERT INTO customers (name, phone, zalo, email) VALUES (?, ?, NULL, ?)
          ON CONFLICT(phone) DO UPDATE SET
            name = excluded.name,
            email = COALESCE(NULLIF(excluded.email, ''), customers.email)`,
    args: [name, phone, email],
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, message: 'Phương thức không được hỗ trợ.' });
  }

  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL || DEFAULT_SCRIPT_URL;

  try {
    const payload = JSON.parse(event.body || '{}');
    if (payload.website) return json(200, { ok: true });

    if (!payload.fullName || !payload.phone) {
      return json(400, { ok: false, message: 'Vui lòng nhập họ tên và số điện thoại.' });
    }

    if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(payload.email).trim())) {
      return json(400, { ok: false, message: 'Địa chỉ email không hợp lệ.' });
    }

    if (payload.file?.size > MAX_FILE_SIZE) {
      return json(413, { ok: false, message: 'Tệp đính kèm vượt quá 4MB.' });
    }

    const upstream = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });
    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok || !result.ok) {
      throw new Error(result.message || 'Google Sheets từ chối dữ liệu.');
    }

    try {
      await upsertCustomer(payload);
    } catch (dbError) {
      console.error('submit-lead: ghi customers vao Turso that bai', dbError);
    }

    // Bao lead cho team + gui chuoi 3 email waitlist cho khach. Loi email khong lam hong request.
    try {
      await Promise.allSettled([
        sendLeadEmails(payload, result.leadId),
        sendWaitlistSequence(payload),
      ]);
    } catch (mailError) {
      console.error('submit-lead: gửi email that bai', mailError);
    }

    return json(200, { ok: true, leadId: result.leadId });
  } catch (error) {
    console.error('submit-lead failed', error);
    return json(500, { ok: false, message: 'Không thể gửi yêu cầu lúc này.' });
  }
};
