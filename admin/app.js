const API = '/admin/api';
const PASSWORD_KEY = 'mv_admin_password';

const state = {
  products: [],
  customers: [],
  orders: [],
};

const PRODUCT_TYPE_LABEL = { physical: 'Vật lý', digital: 'Số (Digital)', service: 'Dịch vụ' };
const ORDER_STATUS_LABEL = { pending: 'Chờ xử lý', success: 'Đã thanh toán', completed: 'Hoàn thành', cancelled: 'Đã huỷ' };

function money(n) {
  if (n === null || n === undefined) return '';
  return Number(n).toLocaleString('vi-VN') + 'đ';
}

function escapeHtml(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  }[c]));
}

function showToast(message, isError) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.className = 'toast show' + (isError ? ' error' : '');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { el.classList.remove('show'); }, 3200);
}

class AuthError extends Error {}

async function api(method, url, body) {
  const password = sessionStorage.getItem(PASSWORD_KEY) || localStorage.getItem(PASSWORD_KEY);
  const res = await fetch(url, {
    method,
    headers: Object.assign(
      { 'x-admin-password': password || '' },
      body ? { 'Content-Type': 'application/json' } : {}
    ),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    clearStoredPassword();
    showLogin();
    throw new AuthError('Sai mật khẩu hoặc phiên đã hết hạn.');
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Đã có lỗi xảy ra.');
  return data;
}

// ---------------- Đăng nhập / đăng xuất ----------------

function clearStoredPassword() {
  sessionStorage.removeItem(PASSWORD_KEY);
  localStorage.removeItem(PASSWORD_KEY);
}

function showLogin() {
  document.getElementById('adminApp').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
}

function showAdminApp() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('adminApp').classList.remove('hidden');
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';
  sessionStorage.setItem(PASSWORD_KEY, password);
  try {
    await loadAll();
    localStorage.setItem(PASSWORD_KEY, password);
    showAdminApp();
  } catch (err) {
    clearStoredPassword();
    errEl.textContent = err instanceof AuthError ? 'Sai mật khẩu.' : err.message;
  }
});

document.getElementById('btnLogout').addEventListener('click', () => {
  clearStoredPassword();
  showLogin();
});

// ---------------- Tabs ----------------

document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// ---------------- Load & render ----------------

async function loadAll() {
  const [products, customers, orders] = await Promise.all([
    api('GET', `${API}/products`),
    api('GET', `${API}/customers`),
    api('GET', `${API}/orders`),
  ]);
  state.products = products;
  state.customers = customers;
  state.orders = orders;
  renderProducts();
  renderCustomers();
  renderOrders();
}

function renderProducts() {
  const tbody = document.querySelector('#tblProducts tbody');
  if (!state.products.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Chưa có sản phẩm nào.</td></tr>`;
    return;
  }
  tbody.innerHTML = state.products.map((p) => `
    <tr>
      <td>${escapeHtml(p.name)}</td>
      <td><span class="pill pill-${p.type}">${PRODUCT_TYPE_LABEL[p.type]}</span></td>
      <td class="num">${money(p.price)}</td>
      <td>${escapeHtml(p.description || '—')}</td>
      <td class="num ${p.type === 'physical' && p.stock_quantity <= 3 ? 'stock-low' : ''}">${p.type === 'physical' ? p.stock_quantity : '—'}</td>
      <td class="row-actions">
        <button class="btn btn-ghost btn-sm" onclick="openProductModal(${p.id})">Sửa</button>
        <button class="btn btn-danger btn-sm" onclick="removeProduct(${p.id})">Xoá</button>
      </td>
    </tr>
  `).join('');
}

function renderCustomers() {
  const tbody = document.querySelector('#tblCustomers tbody');
  if (!state.customers.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Chưa có khách hàng nào.</td></tr>`;
    return;
  }
  tbody.innerHTML = state.customers.map((c) => `
    <tr>
      <td>${escapeHtml(c.name)}</td>
      <td>${escapeHtml(c.phone)}</td>
      <td>${escapeHtml(c.zalo || '—')}</td>
      <td>${escapeHtml(c.email || '—')}</td>
      <td>${escapeHtml((c.registered_at || '').replace('T', ' ').slice(0, 16))}</td>
      <td class="row-actions">
        <button class="btn btn-ghost btn-sm" onclick="openCustomerModal(${c.id})">Sửa</button>
        <button class="btn btn-danger btn-sm" onclick="removeCustomer(${c.id})">Xoá</button>
      </td>
    </tr>
  `).join('');
}

function renderOrders() {
  const tbody = document.querySelector('#tblOrders tbody');
  if (!state.orders.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Chưa có đơn hàng nào.</td></tr>`;
    return;
  }
  tbody.innerHTML = state.orders.map((o) => `
    <tr>
      <td>${escapeHtml(o.customer_name)}</td>
      <td>${escapeHtml(o.product_name)} <span class="pill pill-${o.product_type}">${PRODUCT_TYPE_LABEL[o.product_type]}</span></td>
      <td class="num">${money(o.amount)}</td>
      <td><span class="pill pill-${o.status}">${ORDER_STATUS_LABEL[o.status]}</span></td>
      <td>${escapeHtml((o.order_date || '').replace('T', ' ').slice(0, 16))}</td>
      <td class="row-actions">
        <button class="btn btn-ghost btn-sm" onclick="openOrderModal(${o.id})">Sửa</button>
        <button class="btn btn-danger btn-sm" onclick="removeOrder(${o.id})">Xoá</button>
      </td>
    </tr>
  `).join('');
}

// ---------------- Modal (dùng chung) ----------------

const overlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalForm = document.getElementById('modalForm');

function closeModal() {
  overlay.classList.remove('show');
  modalForm.innerHTML = '';
}
document.getElementById('modalClose').addEventListener('click', closeModal);
overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

function openModal(title, fieldsHtml, onSubmit) {
  modalTitle.textContent = title;
  modalForm.innerHTML = fieldsHtml + `
    <div class="form-actions">
      <button type="button" class="btn btn-ghost" id="modalCancelBtn">Huỷ</button>
      <button type="submit" class="btn btn-primary">Lưu</button>
    </div>
  `;
  document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
  modalForm.onsubmit = async (e) => {
    e.preventDefault();
    const submitBtn = modalForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    try {
      await onSubmit(new FormData(modalForm));
      closeModal();
    } catch (err) {
      if (!(err instanceof AuthError)) showToast(err.message, true);
    } finally {
      submitBtn.disabled = false;
    }
  };
  overlay.classList.add('show');
}

// ---------------- Products ----------------

document.getElementById('btnNewProduct').addEventListener('click', () => openProductModal(null));

window.openProductModal = function (id) {
  const p = id ? state.products.find((x) => x.id === id) : null;
  const fields = `
    <div class="field">
      <label>Tên sản phẩm</label>
      <input name="name" required value="${escapeHtml(p?.name || '')}">
    </div>
    <div class="field">
      <label>Loại sản phẩm</label>
      <select name="type" id="fProductType">
        <option value="physical" ${p?.type === 'physical' ? 'selected' : ''}>Vật lý</option>
        <option value="digital" ${p?.type === 'digital' ? 'selected' : ''}>Số (Digital)</option>
        <option value="service" ${!p || p?.type === 'service' ? 'selected' : ''}>Dịch vụ</option>
      </select>
    </div>
    <div class="field">
      <label>Giá (đ)</label>
      <input name="price" type="number" min="0" step="1000" required value="${p?.price ?? ''}">
    </div>
    <div class="field">
      <label>Mô tả</label>
      <textarea name="description">${escapeHtml(p?.description || '')}</textarea>
    </div>
    <div class="field" id="fStockWrap">
      <label>Số lượng còn lại (chỉ áp dụng cho sản phẩm vật lý)</label>
      <input name="stock_quantity" type="number" min="0" step="1" value="${p?.stock_quantity ?? ''}">
    </div>
  `;
  openModal(p ? 'Sửa sản phẩm' : 'Thêm sản phẩm', fields, async (fd) => {
    const type = fd.get('type');
    const body = {
      name: fd.get('name'),
      type,
      price: fd.get('price'),
      description: fd.get('description'),
      stock_quantity: type === 'physical' ? fd.get('stock_quantity') : null,
    };
    if (p) await api('PUT', `${API}/products/${p.id}`, body);
    else await api('POST', `${API}/products`, body);
    await loadAll();
    showToast('Đã lưu sản phẩm.');
  });

  const typeSelect = document.getElementById('fProductType');
  const stockWrap = document.getElementById('fStockWrap');
  const stockInput = stockWrap.querySelector('input');
  function syncStockField() {
    const isPhysical = typeSelect.value === 'physical';
    stockWrap.style.opacity = isPhysical ? '1' : '0.45';
    stockInput.disabled = !isPhysical;
    stockInput.required = isPhysical;
    if (!isPhysical) stockInput.value = '';
  }
  typeSelect.addEventListener('change', syncStockField);
  syncStockField();
};

window.removeProduct = async function (id) {
  if (!confirm('Xoá sản phẩm này?')) return;
  try {
    await api('DELETE', `${API}/products/${id}`);
    await loadAll();
    showToast('Đã xoá sản phẩm.');
  } catch (err) {
    if (!(err instanceof AuthError)) showToast(err.message, true);
  }
};

// ---------------- Customers ----------------

document.getElementById('btnNewCustomer').addEventListener('click', () => openCustomerModal(null));

window.openCustomerModal = function (id) {
  const c = id ? state.customers.find((x) => x.id === id) : null;
  const fields = `
    <div class="field">
      <label>Tên khách hàng</label>
      <input name="name" required value="${escapeHtml(c?.name || '')}">
    </div>
    <div class="field">
      <label>Số điện thoại</label>
      <input name="phone" required value="${escapeHtml(c?.phone || '')}">
    </div>
    <div class="field">
      <label>Zalo</label>
      <input name="zalo" value="${escapeHtml(c?.zalo || '')}">
    </div>
    <div class="field">
      <label>Email</label>
      <input name="email" type="email" value="${escapeHtml(c?.email || '')}">
    </div>
  `;
  openModal(c ? 'Sửa khách hàng' : 'Thêm khách hàng', fields, async (fd) => {
    const body = { name: fd.get('name'), phone: fd.get('phone'), zalo: fd.get('zalo'), email: fd.get('email') };
    if (c) await api('PUT', `${API}/customers/${c.id}`, body);
    else await api('POST', `${API}/customers`, body);
    await loadAll();
    showToast('Đã lưu khách hàng.');
  });
};

window.removeCustomer = async function (id) {
  if (!confirm('Xoá khách hàng này?')) return;
  try {
    await api('DELETE', `${API}/customers/${id}`);
    await loadAll();
    showToast('Đã xoá khách hàng.');
  } catch (err) {
    if (!(err instanceof AuthError)) showToast(err.message, true);
  }
};

// ---------------- Orders ----------------

document.getElementById('btnNewOrder').addEventListener('click', () => openOrderModal(null));

window.openOrderModal = function (id) {
  const o = id ? state.orders.find((x) => x.id === id) : null;
  const customerOptions = state.customers.map((c) =>
    `<option value="${c.id}" ${o?.customer_id === c.id ? 'selected' : ''}>${escapeHtml(c.name)} — ${escapeHtml(c.phone)}</option>`
  ).join('');
  const productOptions = state.products.map((p) => {
    const stockNote = p.type === 'physical' ? ` (còn ${p.stock_quantity})` : '';
    return `<option value="${p.id}" ${o?.product_id === p.id ? 'selected' : ''}>${escapeHtml(p.name)}${stockNote} — ${money(p.price)}</option>`;
  }).join('');
  const statusOptions = Object.entries(ORDER_STATUS_LABEL).map(([k, label]) =>
    `<option value="${k}" ${(o?.status || 'pending') === k ? 'selected' : ''}>${label}</option>`
  ).join('');

  if (!o && (!state.customers.length || !state.products.length)) {
    showToast('Cần có ít nhất 1 khách hàng và 1 sản phẩm trước khi tạo đơn hàng.', true);
    return;
  }

  const fields = `
    <div class="field">
      <label>Khách hàng</label>
      <select name="customer_id" required ${o ? 'disabled' : ''}>${customerOptions}</select>
    </div>
    <div class="field">
      <label>Sản phẩm</label>
      <select name="product_id" required ${o ? 'disabled' : ''}>${productOptions}</select>
    </div>
    <div class="field">
      <label>Số tiền (đ)</label>
      <input name="amount" type="number" min="0" step="1000" required value="${o?.amount ?? ''}">
    </div>
    <div class="field">
      <label>Trạng thái</label>
      <select name="status">${statusOptions}</select>
    </div>
    ${o ? '<p class="hint">Không thể đổi khách hàng/sản phẩm của đơn đã tạo — xoá đơn cũ và tạo đơn mới nếu cần.</p>' : ''}
  `;
  openModal(o ? 'Sửa đơn hàng' : 'Thêm đơn hàng', fields, async (fd) => {
    if (o) {
      await api('PUT', `${API}/orders/${o.id}`, { amount: fd.get('amount'), status: fd.get('status') });
    } else {
      await api('POST', `${API}/orders`, {
        customer_id: fd.get('customer_id'),
        product_id: fd.get('product_id'),
        amount: fd.get('amount'),
        status: fd.get('status'),
      });
    }
    await loadAll();
    showToast('Đã lưu đơn hàng.');
  });
};

window.removeOrder = async function (id) {
  if (!confirm('Xoá đơn hàng này? (Tồn kho sẽ được cộng lại nếu là sản phẩm vật lý)')) return;
  try {
    await api('DELETE', `${API}/orders/${id}`);
    await loadAll();
    showToast('Đã xoá đơn hàng.');
  } catch (err) {
    if (!(err instanceof AuthError)) showToast(err.message, true);
  }
};

// ---------------- Init ----------------

(async function init() {
  const savedPassword = localStorage.getItem(PASSWORD_KEY);
  if (!savedPassword) { showLogin(); return; }
  sessionStorage.setItem(PASSWORD_KEY, savedPassword);
  try {
    await loadAll();
    showAdminApp();
  } catch (err) {
    showLogin();
  }
})();
