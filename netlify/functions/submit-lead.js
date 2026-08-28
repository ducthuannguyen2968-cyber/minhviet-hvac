const { createClient } = require('@libsql/client');

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxwEkNcIzDhdBW4HWrxUCn8jQiYOwUSZ_aH6M_Zpb7tgw9Mm78N7i_erJk8dgBb3jGG/exec';

// --- Email qua Resend ---
const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const MAIL_FROM = process.env.RESEND_FROM || 'Minh Việt HVAC <no-reply@minhviethvac.asia>';
const TEAM_EMAIL = process.env.LEAD_NOTIFY_EMAIL || 'ducthuannguyen2968@gmail.com';
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
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: MAIL_FROM, ...mail }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Resend ${res.status}: ${detail}`);
  }
}

async function sendLeadEmails(payload, leadId) {
  if (!process.env.RESEND_API_KEY) return;

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

  // A. Xac nhan cho khach (chi khi khach co nhap email hop le)
  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    tasks.push(sendViaResend({
      to: [email],
      subject: 'Minh Việt HVAC đã nhận yêu cầu khảo sát của bạn',
      html: `
        <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2937">
          <p>Chào ${name},</p>
          <p>Cơ Điện Lạnh <b>Minh Việt</b> đã nhận được yêu cầu khảo sát &amp; báo giá của bạn.
             Kỹ sư trưởng sẽ liên hệ với bạn qua số <b>${phone}</b> trong thời gian sớm nhất (trong giờ làm việc).</p>
          <p><b>Thông tin bạn đã gửi:</b></p>
          <ul>
            <li>Loại công trình: ${projectLabel}</li>
            <li>Diện tích ước tính: ${area}</li>
            <li>Ghi chú: ${notes}</li>
          </ul>
          <p>Nếu cần hỗ trợ gấp, vui lòng gọi hotline <b>${HOTLINE}</b>.</p>
          <p>Trân trọng,<br>Cơ Điện Lạnh Minh Việt<br>minhviethvac.asia</p>
        </div>`,
    }));
  }

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

    try {
      await sendLeadEmails(payload, result.leadId);
    } catch (mailError) {
      console.error('submit-lead: gửi email that bai', mailError);
    }

    return json(200, { ok: true, leadId: result.leadId });
  } catch (error) {
    console.error('submit-lead failed', error);
    return json(500, { ok: false, message: 'Không thể gửi yêu cầu lúc này.' });
  }
};
