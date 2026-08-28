const http = require('http');
const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.ADMIN_PORT || 3000;
const DB_PATH = path.join(__dirname, '..', 'brain.db');
const PUBLIC_DIR = path.join(__dirname, 'public');

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA foreign_keys = ON');
const orderSchema = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'orders'").get();
if (orderSchema?.sql && !orderSchema.sql.includes("'success'")) {
  db.exec('ALTER TABLE orders RENAME TO orders_legacy');
  db.exec(`CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    amount INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'completed', 'cancelled')) DEFAULT 'pending',
    order_date TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  db.exec("INSERT INTO orders (id, customer_id, product_id, amount, status, order_date) SELECT id, customer_id, product_id, amount, CASE WHEN status = 'paid' THEN 'success' ELSE status END, order_date FROM orders_legacy");
  db.exec('DROP TABLE orders_legacy');
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

function sendJson(res, statusCode, body) {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(payload);
}

function sendError(res, statusCode, message) {
  sendJson(res, statusCode, { error: message });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function rowToProduct(row) { return row; }

// ---------- Products ----------

function listProducts() {
  return db.prepare('SELECT * FROM products ORDER BY id DESC').all();
}

function createProduct(body) {
  const { name, type, price, description, stock_quantity } = body;
  if (!name || !String(name).trim()) throw { status: 400, message: 'Thiếu tên sản phẩm.' };
  if (!['physical', 'digital', 'service'].includes(type)) throw { status: 400, message: 'Loại sản phẩm không hợp lệ.' };
  const priceNum = Number(price);
  if (!Number.isFinite(priceNum) || priceNum < 0) throw { status: 400, message: 'Giá không hợp lệ.' };
  let stock = stock_quantity === '' || stock_quantity === undefined || stock_quantity === null ? null : Number(stock_quantity);
  if (type === 'physical') {
    if (stock === null || !Number.isFinite(stock) || stock < 0) {
      throw { status: 400, message: 'Sản phẩm vật lý bắt buộc phải có số lượng còn lại (>= 0).' };
    }
  } else {
    stock = null;
  }
  const stmt = db.prepare(
    'INSERT INTO products (name, type, price, description, stock_quantity) VALUES (?, ?, ?, ?, ?)'
  );
  const info = stmt.run(String(name).trim(), type, priceNum, description || null, stock);
  return db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid);
}

function updateProduct(id, body) {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!existing) throw { status: 404, message: 'Không tìm thấy sản phẩm.' };
  const name = body.name !== undefined ? String(body.name).trim() : existing.name;
  const type = body.type !== undefined ? body.type : existing.type;
  if (!['physical', 'digital', 'service'].includes(type)) throw { status: 400, message: 'Loại sản phẩm không hợp lệ.' };
  const price = body.price !== undefined ? Number(body.price) : existing.price;
  if (!Number.isFinite(price) || price < 0) throw { status: 400, message: 'Giá không hợp lệ.' };
  const description = body.description !== undefined ? body.description : existing.description;
  let stock = body.stock_quantity !== undefined
    ? (body.stock_quantity === '' || body.stock_quantity === null ? null : Number(body.stock_quantity))
    : existing.stock_quantity;
  if (type === 'physical') {
    if (stock === null || !Number.isFinite(stock) || stock < 0) {
      throw { status: 400, message: 'Sản phẩm vật lý bắt buộc phải có số lượng còn lại (>= 0).' };
    }
  } else {
    stock = null;
  }
  db.prepare(
    'UPDATE products SET name = ?, type = ?, price = ?, description = ?, stock_quantity = ? WHERE id = ?'
  ).run(name, type, price, description || null, stock, id);
  return db.prepare('SELECT * FROM products WHERE id = ?').get(id);
}

function deleteProduct(id) {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!existing) throw { status: 404, message: 'Không tìm thấy sản phẩm.' };
  try {
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
  } catch (e) {
    throw { status: 409, message: 'Không thể xoá: sản phẩm này đang có trong đơn hàng.' };
  }
}

// ---------- Customers ----------

function listCustomers() {
  return db.prepare('SELECT * FROM customers ORDER BY id DESC').all();
}

function createCustomer(body) {
  const { name, phone, zalo } = body;
  if (!name || !String(name).trim()) throw { status: 400, message: 'Thiếu tên khách hàng.' };
  if (!phone || !String(phone).trim()) throw { status: 400, message: 'Thiếu số điện thoại.' };
  try {
    const stmt = db.prepare('INSERT INTO customers (name, phone, zalo) VALUES (?, ?, ?)');
    const info = stmt.run(String(name).trim(), String(phone).trim(), zalo || null);
    return db.prepare('SELECT * FROM customers WHERE id = ?').get(info.lastInsertRowid);
  } catch (e) {
    if (String(e.message || '').includes('UNIQUE')) {
      throw { status: 409, message: 'Số điện thoại này đã tồn tại.' };
    }
    throw e;
  }
}

function updateCustomer(id, body) {
  const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
  if (!existing) throw { status: 404, message: 'Không tìm thấy khách hàng.' };
  const name = body.name !== undefined ? String(body.name).trim() : existing.name;
  const phone = body.phone !== undefined ? String(body.phone).trim() : existing.phone;
  const zalo = body.zalo !== undefined ? body.zalo : existing.zalo;
  if (!name) throw { status: 400, message: 'Thiếu tên khách hàng.' };
  if (!phone) throw { status: 400, message: 'Thiếu số điện thoại.' };
  try {
    db.prepare('UPDATE customers SET name = ?, phone = ?, zalo = ? WHERE id = ?').run(name, phone, zalo || null, id);
  } catch (e) {
    if (String(e.message || '').includes('UNIQUE')) {
      throw { status: 409, message: 'Số điện thoại này đã tồn tại.' };
    }
    throw e;
  }
  return db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
}

function deleteCustomer(id) {
  const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
  if (!existing) throw { status: 404, message: 'Không tìm thấy khách hàng.' };
  try {
    db.prepare('DELETE FROM customers WHERE id = ?').run(id);
  } catch (e) {
    throw { status: 409, message: 'Không thể xoá: khách hàng này đang có đơn hàng.' };
  }
}

// ---------- Orders ----------
// Quy uoc: moi don hang tuong ung 1 don vi san pham (bang orders khong co cot so luong).

function listOrders() {
  return db.prepare(`
    SELECT orders.*, customers.name AS customer_name, products.name AS product_name, products.type AS product_type
    FROM orders
    JOIN customers ON customers.id = orders.customer_id
    JOIN products ON products.id = orders.product_id
    ORDER BY orders.id DESC
  `).all();
}

const ORDER_STATUSES = ['pending', 'success', 'completed', 'cancelled'];

function createOrder(body) {
  const { customer_id, product_id, amount, status } = body;
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(Number(customer_id));
  if (!customer) throw { status: 400, message: 'Khách hàng không tồn tại.' };
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(product_id));
  if (!product) throw { status: 400, message: 'Sản phẩm không tồn tại.' };
  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum) || amountNum < 0) throw { status: 400, message: 'Số tiền không hợp lệ.' };
  const finalStatus = status && ORDER_STATUSES.includes(status) ? status : 'pending';

  if (product.type === 'physical') {
    if (product.stock_quantity === null || product.stock_quantity <= 0) {
      throw { status: 409, message: `Sản phẩm "${product.name}" đã hết hàng.` };
    }
  }

  db.exec('BEGIN');
  try {
    const stmt = db.prepare(
      'INSERT INTO orders (customer_id, product_id, amount, status) VALUES (?, ?, ?, ?)'
    );
    const info = stmt.run(customer.id, product.id, amountNum, finalStatus);
    if (product.type === 'physical') {
      db.prepare('UPDATE products SET stock_quantity = stock_quantity - 1 WHERE id = ?').run(product.id);
    }
    db.exec('COMMIT');
    return db.prepare(`
      SELECT orders.*, customers.name AS customer_name, products.name AS product_name, products.type AS product_type
      FROM orders JOIN customers ON customers.id = orders.customer_id JOIN products ON products.id = orders.product_id
      WHERE orders.id = ?
    `).get(info.lastInsertRowid);
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

function updateOrder(id, body) {
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!existing) throw { status: 404, message: 'Không tìm thấy đơn hàng.' };
  const amount = body.amount !== undefined ? Number(body.amount) : existing.amount;
  if (!Number.isFinite(amount) || amount < 0) throw { status: 400, message: 'Số tiền không hợp lệ.' };
  const status = body.status !== undefined ? body.status : existing.status;
  if (!ORDER_STATUSES.includes(status)) throw { status: 400, message: 'Trạng thái không hợp lệ.' };
  db.prepare('UPDATE orders SET amount = ?, status = ? WHERE id = ?').run(amount, status, id);
  return db.prepare(`
    SELECT orders.*, customers.name AS customer_name, products.name AS product_name, products.type AS product_type
    FROM orders JOIN customers ON customers.id = orders.customer_id JOIN products ON products.id = orders.product_id
    WHERE orders.id = ?
  `).get(id);
}

function deleteOrder(id) {
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!existing) throw { status: 404, message: 'Không tìm thấy đơn hàng.' };
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(existing.product_id);
  db.exec('BEGIN');
  try {
    db.prepare('DELETE FROM orders WHERE id = ?').run(id);
    if (product && product.type === 'physical' && product.stock_quantity !== null) {
      db.prepare('UPDATE products SET stock_quantity = stock_quantity + 1 WHERE id = ?').run(product.id);
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

// ---------- Routing ----------

const routes = [
  { method: 'GET', pattern: /^\/admin\/api\/products$/, handler: () => ({ status: 200, body: listProducts() }) },
  { method: 'POST', pattern: /^\/admin\/api\/products$/, handler: (req, body) => ({ status: 201, body: createProduct(body) }) },
  { method: 'PUT', pattern: /^\/admin\/api\/products\/(\d+)$/, handler: (req, body, m) => ({ status: 200, body: updateProduct(Number(m[1]), body) }) },
  { method: 'DELETE', pattern: /^\/admin\/api\/products\/(\d+)$/, handler: (req, body, m) => { deleteProduct(Number(m[1])); return { status: 204 }; } },

  { method: 'GET', pattern: /^\/admin\/api\/customers$/, handler: () => ({ status: 200, body: listCustomers() }) },
  { method: 'POST', pattern: /^\/admin\/api\/customers$/, handler: (req, body) => ({ status: 201, body: createCustomer(body) }) },
  { method: 'PUT', pattern: /^\/admin\/api\/customers\/(\d+)$/, handler: (req, body, m) => ({ status: 200, body: updateCustomer(Number(m[1]), body) }) },
  { method: 'DELETE', pattern: /^\/admin\/api\/customers\/(\d+)$/, handler: (req, body, m) => { deleteCustomer(Number(m[1])); return { status: 204 }; } },

  { method: 'GET', pattern: /^\/admin\/api\/orders$/, handler: () => ({ status: 200, body: listOrders() }) },
  { method: 'POST', pattern: /^\/admin\/api\/orders$/, handler: (req, body) => ({ status: 201, body: createOrder(body) }) },
  { method: 'PUT', pattern: /^\/admin\/api\/orders\/(\d+)$/, handler: (req, body, m) => ({ status: 200, body: updateOrder(Number(m[1]), body) }) },
  { method: 'DELETE', pattern: /^\/admin\/api\/orders\/(\d+)$/, handler: (req, body, m) => { deleteOrder(Number(m[1])); return { status: 204 }; } },
];

function serveStatic(req, res, urlPath) {
  const relative = urlPath === '/admin' || urlPath === '/admin/' ? '/admin.html' : urlPath.replace(/^\/admin/, '');
  const filePath = path.join(PUBLIC_DIR, relative);
  if (!filePath.startsWith(PUBLIC_DIR)) { sendError(res, 403, 'Forbidden'); return; }
  fs.readFile(filePath, (err, data) => {
    if (err) { sendError(res, 404, 'Not found'); return; }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const urlPath = req.url.split('?')[0];

  if (!urlPath.startsWith('/admin')) {
    sendError(res, 404, 'Chỉ phục vụ đường dẫn /admin');
    return;
  }

  const route = routes.find(r => r.method === req.method && r.pattern.test(urlPath));
  if (route) {
    try {
      const body = (req.method === 'POST' || req.method === 'PUT') ? await readBody(req) : {};
      const match = urlPath.match(route.pattern);
      const result = route.handler(req, body, match);
      if (result.status === 204) { res.writeHead(204); res.end(); return; }
      sendJson(res, result.status, result.body);
    } catch (e) {
      if (e && e.status) { sendError(res, e.status, e.message); }
      else { console.error(e); sendError(res, 500, 'Lỗi máy chủ nội bộ.'); }
    }
    return;
  }

  if (req.method === 'GET') { serveStatic(req, res, urlPath); return; }
  sendError(res, 404, 'Not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
  console.log(`Doc du lieu tu: ${DB_PATH}`);
});
