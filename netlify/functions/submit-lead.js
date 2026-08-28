const { createClient } = require('@libsql/client');

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxwEkNcIzDhdBW4HWrxUCn8jQiYOwUSZ_aH6M_Zpb7tgw9Mm78N7i_erJk8dgBb3jGG/exec';

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

    return json(200, { ok: true, leadId: result.leadId });
  } catch (error) {
    console.error('submit-lead failed', error);
    return json(500, { ok: false, message: 'Không thể gửi yêu cầu lúc này.' });
  }
};
