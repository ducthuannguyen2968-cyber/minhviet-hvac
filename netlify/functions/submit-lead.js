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

    return json(200, { ok: true, leadId: result.leadId });
  } catch (error) {
    console.error('submit-lead failed', error);
    return json(500, { ok: false, message: 'Không thể gửi yêu cầu lúc này.' });
  }
};
