const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// --- Email xac nhan don hang qua Resend ---
// API key doc tu bien moi truong Netlify RESEND_API_KEY (KHONG hardcode - Secrets Scanning se chan deploy).
const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Nguoi gui: dia chi thuoc domain rieng minhviethvac.asia.
const ORDER_MAIL_FROM = process.env.RESEND_ORDER_FROM || 'Cơ Điện Lạnh Minh Việt <cskh@minhviethvac.asia>';
const HOTLINE = '0934 506 191';
const OFFICE_ADDRESS = 'Số 15B, ngõ 191 đường Giáp Bát, P. Giáp Bát, Q. Hoàng Mai, Hà Nội';
const PAYMENT_URL = process.env.PAYMENT_URL || 'https://minhviethvac.asia/thanhtoan/';

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 1.234.567 đ (dau cham ngan cach hang nghin theo kieu VN, khong phu thuoc ICU).
function formatVnd(n) {
  return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' đ';
}

async function sendViaResend(mail) {
  if (!RESEND_API_KEY) return;
  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(mail),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Resend ${res.status}: ${detail}`);
  }
}

// Email xac nhan don hang - giong van theo bang brand_voice (gan gui, cau ngan, "chin chu / trach nhiem").
// Goi ngay sau khi admin tao don moi. Chi gui khi khach co email hop le.
async function sendOrderConfirmationEmail({ order, customer, product }) {
  if (!RESEND_API_KEY) return;
  const email = String(customer.email || '').trim();
  if (!email || !EMAIL_RE.test(email)) return;

  const isTest = /\+test/i.test(email.split('@')[0]);
  const orderCode = `MV${String(order.id).padStart(6, '0')}`;
  const name = escapeHtml(customer.name || 'anh/chị');
  const phone = escapeHtml(customer.phone || '');
  const productName = escapeHtml(product.name);
  const amountText = formatVnd(order.amount);

  const deliveryByType = {
    physical:
      `<p><b>Nhận hàng:</b> Đội ngũ Minh Việt sẽ gọi anh/chị theo số <b>${phone}</b> trong vòng 24 giờ làm việc ` +
      `để xác nhận địa chỉ và hẹn lịch giao. Anh/chị cũng có thể nhận trực tiếp tại văn phòng: ` +
      `${escapeHtml(OFFICE_ADDRESS)}.</p>`,
    service:
      `<p><b>Triển khai:</b> Kỹ sư phụ trách sẽ liên hệ số <b>${phone}</b> trong vòng 24 giờ làm việc ` +
      `để hẹn lịch xuống công trình khảo sát / thi công.</p>`,
    digital:
      `<p><b>Nhận tài liệu:</b> Bản vẽ / tài liệu sẽ được gửi tới chính email này trong vòng 24 giờ làm việc. ` +
      `Nếu chưa thấy, anh/chị kiểm tra hộp thư spam hoặc nhắn hotline ${HOTLINE}.</p>`,
  };
  const delivery = deliveryByType[product.type] || deliveryByType.service;

  const paidNote = ['success', 'completed'].includes(order.status)
    ? '<p>Minh Việt đã ghi nhận thanh toán cho đơn này.</p>'
    : `<p>Đơn sẽ được xử lý ngay khi Minh Việt xác nhận thanh toán. Cần thông tin chuyển khoản, ` +
      `anh/chị mở <a href="${PAYMENT_URL}">${PAYMENT_URL}</a> hoặc gọi hotline ${HOTLINE}.</p>`;

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#1f2937;max-width:560px">
      <p>Chào ${name},</p>
      <p>Cảm ơn anh/chị đã tin tưởng <b>Cơ Điện Lạnh Minh Việt</b>. Minh Việt đã nhận đơn hàng của anh/chị:</p>
      <table cellpadding="6" style="border-collapse:collapse;font-size:14px">
        <tr><td><b>Mã đơn</b></td><td>${orderCode}</td></tr>
        <tr><td><b>Sản phẩm</b></td><td>${productName}</td></tr>
        <tr><td><b>Số tiền</b></td><td><b>${amountText}</b></td></tr>
        <tr><td><b>Ngày đặt</b></td><td>${escapeHtml(String(order.order_date || ''))}</td></tr>
      </table>
      ${delivery}
      ${paidNote}
      <p>Hơn chục năm trong nghề, tụi em luôn tâm niệm làm gì cũng phải chỉn chu và có trách nhiệm tới cùng —
         đơn hàng của anh/chị cũng vậy.</p>
      <p>Cần hỗ trợ, anh/chị gọi hotline <b>${HOTLINE}</b> nhé.</p>
      <p style="margin-top:24px">Trân trọng,<br><b>Cơ Điện Lạnh Minh Việt</b><br>
         Hotline / Zalo ${HOTLINE} &middot; <a href="https://minhviethvac.asia">minhviethvac.asia</a></p>
    </div>`;

  await sendViaResend({
    from: ORDER_MAIL_FROM,
    to: [email],
    subject: `${isTest ? '[TEST] ' : ''}Minh Việt xác nhận đơn hàng ${orderCode} - ${product.name}`,
    html,
  });
}

let schemaReady = null;
function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await client.batch([
      `CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('physical', 'digital', 'service')),
        price INTEGER NOT NULL,
        description TEXT,
        stock_quantity INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        CHECK (type != 'physical' OR stock_quantity IS NOT NULL)
      )`,
      `CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL UNIQUE,
        zalo TEXT,
        email TEXT,
        registered_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        product_id INTEGER NOT NULL REFERENCES products(id),
        amount INTEGER NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'completed', 'cancelled')) DEFAULT 'pending',
        order_date TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      ], 'write');
      const custSchema = await client.execute("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'customers'");
      if (custSchema.rows[0]?.sql && !/\bemail\b/i.test(String(custSchema.rows[0].sql))) {
        await client.execute('ALTER TABLE customers ADD COLUMN email TEXT');
      }

      const schema = await client.execute("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'orders'");
      if (schema.rows[0]?.sql && !schema.rows[0].sql.includes("'success'")) {
        await client.batch([
          'ALTER TABLE orders RENAME TO orders_legacy',
          `CREATE TABLE orders (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id INTEGER NOT NULL REFERENCES customers(id), product_id INTEGER NOT NULL REFERENCES products(id), amount INTEGER NOT NULL, status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'completed', 'cancelled')) DEFAULT 'pending', order_date TEXT NOT NULL DEFAULT (datetime('now')) )`,
          "INSERT INTO orders (id, customer_id, product_id, amount, status, order_date) SELECT id, customer_id, product_id, amount, CASE WHEN status = 'paid' THEN 'success' ELSE status END, order_date FROM orders_legacy",
          'DROP TABLE orders_legacy',
        ], 'write');
      }
    })().catch((e) => { schemaReady = null; throw e; });
  }
  return schemaReady;
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body),
  };
}
function err(statusCode, message) { return json(statusCode, { error: message }); }

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

// ---------- Products ----------

async function listProducts() {
  const rs = await client.execute('SELECT * FROM products ORDER BY id DESC');
  return rs.rows;
}

async function createProduct(body) {
  const { name, type, price, description, stock_quantity } = body;
  if (!name || !String(name).trim()) throw new HttpError(400, 'Thiếu tên sản phẩm.');
  if (!['physical', 'digital', 'service'].includes(type)) throw new HttpError(400, 'Loại sản phẩm không hợp lệ.');
  const priceNum = Number(price);
  if (!Number.isFinite(priceNum) || priceNum < 0) throw new HttpError(400, 'Giá không hợp lệ.');
  let stock = (stock_quantity === '' || stock_quantity === undefined || stock_quantity === null) ? null : Number(stock_quantity);
  if (type === 'physical') {
    if (stock === null || !Number.isFinite(stock) || stock < 0) {
      throw new HttpError(400, 'Sản phẩm vật lý bắt buộc phải có số lượng còn lại (>= 0).');
    }
  } else {
    stock = null;
  }
  const rs = await client.execute({
    sql: 'INSERT INTO products (name, type, price, description, stock_quantity) VALUES (?, ?, ?, ?, ?) RETURNING *',
    args: [String(name).trim(), type, priceNum, description || null, stock],
  });
  return rs.rows[0];
}

async function updateProduct(id, body) {
  const existingRs = await client.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [id] });
  const existing = existingRs.rows[0];
  if (!existing) throw new HttpError(404, 'Không tìm thấy sản phẩm.');
  const name = body.name !== undefined ? String(body.name).trim() : existing.name;
  const type = body.type !== undefined ? body.type : existing.type;
  if (!['physical', 'digital', 'service'].includes(type)) throw new HttpError(400, 'Loại sản phẩm không hợp lệ.');
  const price = body.price !== undefined ? Number(body.price) : existing.price;
  if (!Number.isFinite(price) || price < 0) throw new HttpError(400, 'Giá không hợp lệ.');
  const description = body.description !== undefined ? body.description : existing.description;
  let stock = body.stock_quantity !== undefined
    ? ((body.stock_quantity === '' || body.stock_quantity === null) ? null : Number(body.stock_quantity))
    : existing.stock_quantity;
  if (type === 'physical') {
    if (stock === null || !Number.isFinite(stock) || stock < 0) {
      throw new HttpError(400, 'Sản phẩm vật lý bắt buộc phải có số lượng còn lại (>= 0).');
    }
  } else {
    stock = null;
  }
  const rs = await client.execute({
    sql: 'UPDATE products SET name = ?, type = ?, price = ?, description = ?, stock_quantity = ? WHERE id = ? RETURNING *',
    args: [name, type, price, description || null, stock, id],
  });
  return rs.rows[0];
}

async function deleteProduct(id) {
  const existingRs = await client.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [id] });
  if (!existingRs.rows[0]) throw new HttpError(404, 'Không tìm thấy sản phẩm.');
  const usedRs = await client.execute({ sql: 'SELECT 1 FROM orders WHERE product_id = ? LIMIT 1', args: [id] });
  if (usedRs.rows.length) throw new HttpError(409, 'Không thể xoá: sản phẩm này đang có trong đơn hàng.');
  await client.execute({ sql: 'DELETE FROM products WHERE id = ?', args: [id] });
}

// ---------- Customers ----------

async function listCustomers() {
  const rs = await client.execute('SELECT * FROM customers ORDER BY id DESC');
  return rs.rows;
}

function normalizeEmail(value) {
  const email = value === undefined || value === null ? '' : String(value).trim();
  if (email && !EMAIL_RE.test(email)) throw new HttpError(400, 'Địa chỉ email không hợp lệ.');
  return email || null;
}

async function createCustomer(body) {
  const { name, phone, zalo } = body;
  if (!name || !String(name).trim()) throw new HttpError(400, 'Thiếu tên khách hàng.');
  if (!phone || !String(phone).trim()) throw new HttpError(400, 'Thiếu số điện thoại.');
  const email = normalizeEmail(body.email);
  const dupRs = await client.execute({ sql: 'SELECT 1 FROM customers WHERE phone = ?', args: [String(phone).trim()] });
  if (dupRs.rows.length) throw new HttpError(409, 'Số điện thoại này đã tồn tại.');
  const rs = await client.execute({
    sql: 'INSERT INTO customers (name, phone, zalo, email) VALUES (?, ?, ?, ?) RETURNING *',
    args: [String(name).trim(), String(phone).trim(), zalo || null, email],
  });
  return rs.rows[0];
}

async function updateCustomer(id, body) {
  const existingRs = await client.execute({ sql: 'SELECT * FROM customers WHERE id = ?', args: [id] });
  const existing = existingRs.rows[0];
  if (!existing) throw new HttpError(404, 'Không tìm thấy khách hàng.');
  const name = body.name !== undefined ? String(body.name).trim() : existing.name;
  const phone = body.phone !== undefined ? String(body.phone).trim() : existing.phone;
  const zalo = body.zalo !== undefined ? body.zalo : existing.zalo;
  const email = body.email !== undefined ? normalizeEmail(body.email) : existing.email;
  if (!name) throw new HttpError(400, 'Thiếu tên khách hàng.');
  if (!phone) throw new HttpError(400, 'Thiếu số điện thoại.');
  if (phone !== existing.phone) {
    const dupRs = await client.execute({ sql: 'SELECT 1 FROM customers WHERE phone = ? AND id != ?', args: [phone, id] });
    if (dupRs.rows.length) throw new HttpError(409, 'Số điện thoại này đã tồn tại.');
  }
  const rs = await client.execute({
    sql: 'UPDATE customers SET name = ?, phone = ?, zalo = ?, email = ? WHERE id = ? RETURNING *',
    args: [name, phone, zalo || null, email, id],
  });
  return rs.rows[0];
}

async function deleteCustomer(id) {
  const existingRs = await client.execute({ sql: 'SELECT * FROM customers WHERE id = ?', args: [id] });
  if (!existingRs.rows[0]) throw new HttpError(404, 'Không tìm thấy khách hàng.');
  const usedRs = await client.execute({ sql: 'SELECT 1 FROM orders WHERE customer_id = ? LIMIT 1', args: [id] });
  if (usedRs.rows.length) throw new HttpError(409, 'Không thể xoá: khách hàng này đang có đơn hàng.');
  await client.execute({ sql: 'DELETE FROM customers WHERE id = ?', args: [id] });
}

// ---------- Orders ----------
// Quy uoc: moi don hang tuong ung 1 don vi san pham (bang orders khong co cot so luong).

const ORDER_STATUSES = ['pending', 'success', 'completed', 'cancelled'];

const ORDER_SELECT = `
  SELECT orders.*, customers.name AS customer_name, products.name AS product_name, products.type AS product_type
  FROM orders
  JOIN customers ON customers.id = orders.customer_id
  JOIN products ON products.id = orders.product_id
`;

async function listOrders() {
  const rs = await client.execute(`${ORDER_SELECT} ORDER BY orders.id DESC`);
  return rs.rows;
}

async function createOrder(body) {
  const { customer_id, product_id, amount, status } = body;
  const customerRs = await client.execute({ sql: 'SELECT * FROM customers WHERE id = ?', args: [Number(customer_id)] });
  const customer = customerRs.rows[0];
  if (!customer) throw new HttpError(400, 'Khách hàng không tồn tại.');
  const productRs = await client.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [Number(product_id)] });
  const product = productRs.rows[0];
  if (!product) throw new HttpError(400, 'Sản phẩm không tồn tại.');
  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum) || amountNum < 0) throw new HttpError(400, 'Số tiền không hợp lệ.');
  const finalStatus = status && ORDER_STATUSES.includes(status) ? status : 'pending';

  if (product.type === 'physical') {
    if (product.stock_quantity === null || product.stock_quantity <= 0) {
      throw new HttpError(409, `Sản phẩm "${product.name}" đã hết hàng.`);
    }
  }

  const statements = [
    {
      sql: 'INSERT INTO orders (customer_id, product_id, amount, status) VALUES (?, ?, ?, ?)',
      args: [customer.id, product.id, amountNum, finalStatus],
    },
  ];
  if (product.type === 'physical') {
    statements.push({
      sql: 'UPDATE products SET stock_quantity = stock_quantity - 1 WHERE id = ?',
      args: [product.id],
    });
  }
  await client.batch(statements, 'write');

  const rs = await client.execute(`${ORDER_SELECT} ORDER BY orders.id DESC LIMIT 1`);
  const order = rs.rows[0];

  // Gui email xac nhan don hang cho khach (neu co email). Loi email KHONG lam hong viec tao don.
  try {
    await sendOrderConfirmationEmail({ order, customer, product });
  } catch (mailErr) {
    console.error('admin-api: gui email xac nhan don that bai', mailErr);
  }

  return order;
}

async function updateOrder(id, body) {
  const existingRs = await client.execute({ sql: 'SELECT * FROM orders WHERE id = ?', args: [id] });
  const existing = existingRs.rows[0];
  if (!existing) throw new HttpError(404, 'Không tìm thấy đơn hàng.');
  const amount = body.amount !== undefined ? Number(body.amount) : existing.amount;
  if (!Number.isFinite(amount) || amount < 0) throw new HttpError(400, 'Số tiền không hợp lệ.');
  const status = body.status !== undefined ? body.status : existing.status;
  if (!ORDER_STATUSES.includes(status)) throw new HttpError(400, 'Trạng thái không hợp lệ.');
  await client.execute({ sql: 'UPDATE orders SET amount = ?, status = ? WHERE id = ?', args: [amount, status, id] });
  const rs = await client.execute({ sql: `${ORDER_SELECT} WHERE orders.id = ?`, args: [id] });
  return rs.rows[0];
}

async function deleteOrder(id) {
  const existingRs = await client.execute({ sql: 'SELECT * FROM orders WHERE id = ?', args: [id] });
  const existing = existingRs.rows[0];
  if (!existing) throw new HttpError(404, 'Không tìm thấy đơn hàng.');
  const productRs = await client.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [existing.product_id] });
  const product = productRs.rows[0];

  const statements = [{ sql: 'DELETE FROM orders WHERE id = ?', args: [id] }];
  if (product && product.type === 'physical' && product.stock_quantity !== null) {
    statements.push({ sql: 'UPDATE products SET stock_quantity = stock_quantity + 1 WHERE id = ?', args: [product.id] });
  }
  await client.batch(statements, 'write');
}

// ---------- Routing ----------

const routes = [
  { method: 'GET', pattern: /^\/admin\/api\/products$/, fn: () => listProducts() },
  { method: 'POST', pattern: /^\/admin\/api\/products$/, fn: (body) => createProduct(body), status: 201 },
  { method: 'PUT', pattern: /^\/admin\/api\/products\/(\d+)$/, fn: (body, m) => updateProduct(Number(m[1]), body) },
  { method: 'DELETE', pattern: /^\/admin\/api\/products\/(\d+)$/, fn: async (body, m) => { await deleteProduct(Number(m[1])); return null; }, status: 204 },

  { method: 'GET', pattern: /^\/admin\/api\/customers$/, fn: () => listCustomers() },
  { method: 'POST', pattern: /^\/admin\/api\/customers$/, fn: (body) => createCustomer(body), status: 201 },
  { method: 'PUT', pattern: /^\/admin\/api\/customers\/(\d+)$/, fn: (body, m) => updateCustomer(Number(m[1]), body) },
  { method: 'DELETE', pattern: /^\/admin\/api\/customers\/(\d+)$/, fn: async (body, m) => { await deleteCustomer(Number(m[1])); return null; }, status: 204 },

  { method: 'GET', pattern: /^\/admin\/api\/orders$/, fn: () => listOrders() },
  { method: 'POST', pattern: /^\/admin\/api\/orders$/, fn: (body) => createOrder(body), status: 201 },
  { method: 'PUT', pattern: /^\/admin\/api\/orders\/(\d+)$/, fn: (body, m) => updateOrder(Number(m[1]), body) },
  { method: 'DELETE', pattern: /^\/admin\/api\/orders\/(\d+)$/, fn: async (body, m) => { await deleteOrder(Number(m[1])); return null; }, status: 204 },
];

exports.handler = async (event) => {
  const urlPath = event.path;
  const providedPassword = event.headers?.['x-admin-password'] || event.headers?.['X-Admin-Password'];
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword || providedPassword !== expectedPassword) {
    return err(401, 'Sai mật khẩu hoặc chưa đăng nhập.');
  }

  const route = routes.find(r => r.method === event.httpMethod && r.pattern.test(urlPath));
  if (!route) return err(404, 'Không tìm thấy đường dẫn.');

  try {
    await ensureSchema();
    let body = {};
    if (event.body) {
      try { body = JSON.parse(event.body); } catch { return err(400, 'Dữ liệu gửi lên không hợp lệ.'); }
    }
    const match = urlPath.match(route.pattern);
    const result = await route.fn(body, match);
    if (route.status === 204) return { statusCode: 204, body: '' };
    return json(route.status || 200, result);
  } catch (e) {
    if (e instanceof HttpError) return err(e.status, e.message);
    console.error('admin-api error', e);
    return err(500, 'Lỗi máy chủ nội bộ.');
  }
};
