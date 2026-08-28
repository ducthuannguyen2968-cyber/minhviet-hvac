const { createClient } = require('@libsql/client');

const client = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
let schemaReady;

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) };
}

async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await client.batch([
      `CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT NOT NULL CHECK (type IN ('physical', 'digital', 'service')), price INTEGER NOT NULL, description TEXT, stock_quantity INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')) )`,
      `CREATE TABLE IF NOT EXISTS customers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT NOT NULL UNIQUE, zalo TEXT, registered_at TEXT NOT NULL DEFAULT (datetime('now')) )`,
      `CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id INTEGER NOT NULL REFERENCES customers(id), product_id INTEGER NOT NULL REFERENCES products(id), amount INTEGER NOT NULL, status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'completed', 'cancelled')) DEFAULT 'pending', order_date TEXT NOT NULL DEFAULT (datetime('now')) )`,
      ], 'write');
      const schema = await client.execute("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'orders'");
      if (schema.rows[0]?.sql && !schema.rows[0].sql.includes("'success'")) {
        await client.batch([
          'ALTER TABLE orders RENAME TO orders_legacy',
          `CREATE TABLE orders (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id INTEGER NOT NULL REFERENCES customers(id), product_id INTEGER NOT NULL REFERENCES products(id), amount INTEGER NOT NULL, status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'completed', 'cancelled')) DEFAULT 'pending', order_date TEXT NOT NULL DEFAULT (datetime('now')) )`,
          "INSERT INTO orders (id, customer_id, product_id, amount, status, order_date) SELECT id, customer_id, product_id, amount, CASE WHEN status = 'paid' THEN 'success' ELSE status END, order_date FROM orders_legacy",
          'DROP TABLE orders_legacy',
        ], 'write');
      }
    })();
  }
  return schemaReady;
}

function text(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

async function listPublicProducts() {
  const rows = (await client.execute('SELECT id, name, price, type FROM products ORDER BY id DESC')).rows;
  return json(200, { ok: true, products: rows });
}

async function createPaymentOrder(body) {
  const name = text(body.fullName, 120);
  const contact = text(body.phone || body.email, 120);
  const productId = Number(body.productId);
  if (!name || !contact || !Number.isInteger(productId) || productId <= 0) {
    return json(400, { ok: false, message: 'Vui lòng nhập đủ thông tin và chọn sản phẩm.' });
  }

  const product = (await client.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [productId] })).rows[0];
  if (!product) return json(400, { ok: false, message: 'Sản phẩm không tồn tại.' });
  const amount = Number(product.price);
  if (!Number.isInteger(amount) || amount <= 0) {
    return json(400, { ok: false, message: 'Sản phẩm chưa được cấu hình giá hợp lệ.' });
  }

  let customer = (await client.execute({ sql: 'SELECT * FROM customers WHERE phone = ?', args: [contact] })).rows[0];
  if (!customer) customer = (await client.execute({ sql: 'INSERT INTO customers (name, phone) VALUES (?, ?) RETURNING *', args: [name, contact] })).rows[0];
  const order = (await client.execute({ sql: "INSERT INTO orders (customer_id, product_id, amount, status) VALUES (?, ?, ?, 'pending') RETURNING id, amount, status", args: [customer.id, product.id, amount] })).rows[0];
  return json(201, { ok: true, orderId: order.id, orderCode: `MV${String(order.id).padStart(6, '0')}`, amount: order.amount, status: order.status, productName: product.name });
}

// Tach ma don tu noi dung CK. Ngan hang hay chen dau cach / dau gach / chu khac
// ("MV 000123", "mv-000123", "CK MV000123 ..."), co khi bo so 0 dau -> phai
// chuan hoa (viet hoa, bo het ky tu khong phai chu-so) roi match linh hoat.
function extractOrderId(content) {
  const normalized = String(content || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const match = normalized.match(/MV0*(\d{1,9})/);
  return match ? Number(match[1]) : null;
}

async function confirmPayment(body) {
  const orderId = extractOrderId(body.content);
  const amount = Number(body.amount);
  if (!orderId) return json(200, { ok: true, matched: false, reason: 'no_order_code' });

  const order = (await client.execute({ sql: 'SELECT id, amount, status FROM orders WHERE id = ?', args: [orderId] })).rows[0];
  if (!order) return json(200, { ok: true, matched: false, reason: 'order_not_found', orderId });

  // SePay goi lai webhook toi 7 lan -> da thanh toan roi thi bao "khop" de khong bao loi gia.
  if (order.status === 'success' || order.status === 'completed') {
    return json(200, { ok: true, matched: true, already: true, orderId });
  }
  if (order.status !== 'pending') {
    return json(200, { ok: true, matched: false, reason: `order_${order.status}`, orderId });
  }

  // Chap nhan chuyen dung hoac du hon (phi ngan hang / khach lam tron len); chi tu choi khi chuyen thieu.
  const expected = Number(order.amount);
  if (!Number.isFinite(amount) || amount + 0.5 < expected) {
    return json(200, {
      ok: true,
      matched: false,
      reason: 'amount_mismatch',
      orderId,
      expected,
      received: Number.isFinite(amount) ? amount : null,
    });
  }

  const result = await client.execute({
    sql: "UPDATE orders SET status = 'success' WHERE id = ? AND status = 'pending'",
    args: [orderId],
  });
  return json(200, { ok: true, matched: result.rowsAffected > 0, orderId });
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') return json(405, { ok: false });
  try {
    await ensureSchema();
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      return body.type === 'confirm' ? confirmPayment(body) : createPaymentOrder(body);
    }
    if (event.queryStringParameters?.list === 'products') return listPublicProducts();
    const orderId = Number(event.queryStringParameters?.orderId);
    if (!Number.isInteger(orderId)) return json(400, { ok: false, message: 'Thiếu mã đơn hàng.' });
    const order = (await client.execute({ sql: 'SELECT id, amount, status FROM orders WHERE id = ?', args: [orderId] })).rows[0];
    return order ? json(200, { ok: true, ...order }) : json(404, { ok: false, message: 'Không tìm thấy đơn hàng.' });
  } catch (error) {
    console.error('payment-api failed', error);
    return json(500, { ok: false, message: 'Không thể xử lý thanh toán lúc này.' });
  }
};
