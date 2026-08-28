const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxwEkNcIzDhdBW4HWrxUCn8jQiYOwUSZ_aH6M_Zpb7tgw9Mm78N7i_erJk8dgBb3jGG/exec';

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { success: false });
  }

  const expectedKey = process.env.SEPAY_WEBHOOK_API_KEY;
  const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
  if (!expectedKey || authHeader !== `Apikey ${expectedKey}`) {
    console.error('sepay-webhook: unauthorized request');
    return json(401, { success: false });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { success: false });
  }

  if (payload.transferType !== 'in') {
    // Chỉ quan tâm tiền vào; xác nhận ngay để SePay không thử lại.
    return json(200, { success: true });
  }

  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL || DEFAULT_SCRIPT_URL;

  try {
    const siteUrl = process.env.URL || `https://${event.headers?.host || 'localhost'}`;
    const paymentResponse = await fetch(new URL('/.netlify/functions/payment-api', siteUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'confirm', amount: payload.transferAmount, content: payload.content || payload.description || payload.transferDescription }),
    });
    const paymentResult = await paymentResponse.json().catch(() => ({}));
    if (!paymentResponse.ok || !paymentResult.ok) throw new Error(paymentResult.message || 'Không thể cập nhật đơn hàng.');

    const upstream = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ type: 'sepay_payment', ...payload }),
      redirect: 'follow',
    });
    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok || !result.ok) {
      throw new Error(result.message || 'Google Sheets từ chối dữ liệu thanh toán.');
    }
    return json(200, { success: true });
  } catch (error) {
    console.error('sepay-webhook forward failed', error);
    // Tra ve loi de SePay tu dong thu lai (toi da 7 lan trong 5 gio).
    return json(500, { success: false });
  }
};
