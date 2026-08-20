const LEADS_SHEET_NAME = 'Leads Website';
const CONFIG_SHEET_NAME = 'Cấu hình';
const MAX_FILE_SIZE = 4 * 1024 * 1024;
const UPLOAD_FOLDER_NAME = 'MINH VIỆT - BẢN VẼ WEBSITE';

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const payload = JSON.parse((e.postData && e.postData.contents) || '{}');
    validatePayload_(payload);

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const leadsSheet = spreadsheet.getSheetByName(LEADS_SHEET_NAME);
    const configSheet = spreadsheet.getSheetByName(CONFIG_SHEET_NAME);
    if (!leadsSheet || !configSheet) throw new Error('Thiếu tab Leads Website hoặc Cấu hình.');

    const leadId = 'MV-' + Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyyMMdd-HHmmss');
    let fileUrl = '';
    let fileName = '';

    if (payload.file && payload.file.base64) {
      const bytes = Utilities.base64Decode(payload.file.base64);
      if (bytes.length > MAX_FILE_SIZE) throw new Error('Tệp đính kèm vượt quá 4MB.');
      const folder = getOrCreateFolder_(UPLOAD_FOLDER_NAME);
      const blob = Utilities.newBlob(bytes, payload.file.type || 'application/octet-stream', payload.file.name || leadId);
      const file = folder.createFile(blob);
      fileUrl = file.getUrl();
      fileName = file.getName();
    }

    const now = new Date();
    const projectLabel = projectTypeLabel_(payload.projectType);
    leadsSheet.appendRow([
      leadId,
      now,
      clean_(payload.fullName),
      clean_(payload.phone),
      projectLabel,
      clean_(payload.area),
      clean_(payload.notes),
      fileUrl,
      fileName,
      clean_(payload.source || 'minhviethvac.asia'),
      clean_(configSheet.getRange('B5').getValue() || 'Mới'),
      '',
      '',
      '',
    ]);

    const row = leadsSheet.getLastRow();
    leadsSheet.getRange(row, 2).setNumberFormat('yyyy-mm-dd hh:mm');
    leadsSheet.getRange(row, 1, 1, 14).setWrap(true).setVerticalAlignment('top');

    const recipient = clean_(configSheet.getRange('B2').getValue());
    if (!recipient) throw new Error('Chưa cấu hình email nhận thông báo tại Cấu hình!B2.');
    sendNotification_(recipient, leadId, payload, projectLabel, fileUrl, spreadsheet.getUrl());

    return json_({ ok: true, leadId: leadId });
  } catch (error) {
    console.error(error);
    return json_({ ok: false, message: error.message || 'Không thể xử lý yêu cầu.' });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function validatePayload_(payload) {
  if (payload.website) throw new Error('Yêu cầu không hợp lệ.');
  if (!clean_(payload.fullName) || !clean_(payload.phone)) {
    throw new Error('Thiếu họ tên hoặc số điện thoại.');
  }
  if (clean_(payload.fullName).length > 120 || clean_(payload.phone).length > 30) {
    throw new Error('Thông tin liên hệ không hợp lệ.');
  }
  if (payload.file && Number(payload.file.size || 0) > MAX_FILE_SIZE) {
    throw new Error('Tệp đính kèm vượt quá 4MB.');
  }
}

function sendNotification_(recipient, leadId, payload, projectLabel, fileUrl, sheetUrl) {
  const safeName = escapeHtml_(payload.fullName);
  const safePhone = escapeHtml_(payload.phone);
  const safeArea = escapeHtml_(payload.area || 'Chưa cung cấp');
  const safeNotes = escapeHtml_(payload.notes || 'Không có');
  const subject = '[MINH VIỆT WEBSITE] Lead mới ' + leadId + ' - ' + clean_(payload.fullName);
  const htmlBody = [
    '<h2>Minh Việt HVAC có khách hàng mới từ website</h2>',
    '<p><strong>Mã lead:</strong> ' + leadId + '</p>',
    '<p><strong>Họ tên:</strong> ' + safeName + '</p>',
    '<p><strong>SĐT/Zalo:</strong> ' + safePhone + '</p>',
    '<p><strong>Loại công trình:</strong> ' + escapeHtml_(projectLabel) + '</p>',
    '<p><strong>Diện tích:</strong> ' + safeArea + '</p>',
    '<p><strong>Ghi chú:</strong> ' + safeNotes + '</p>',
    fileUrl ? '<p><strong>Bản vẽ:</strong> <a href="' + fileUrl + '">Mở tệp trên Google Drive</a></p>' : '<p><strong>Bản vẽ:</strong> Chưa đính kèm</p>',
    '<p><a href="' + sheetUrl + '">Mở bảng quản lý Leads Website</a></p>',
  ].join('');

  MailApp.sendEmail({ to: recipient, subject: subject, htmlBody: htmlBody, name: 'Minh Việt HVAC Website' });
}

function getOrCreateFolder_(name) {
  const folders = DriveApp.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(name);
}

function projectTypeLabel_(value) {
  const labels = {
    'biet-thu': 'Biệt thự / Villa',
    penthouse: 'Penthouse / Căn hộ cao cấp',
    'nha-pho': 'Nhà phố / Liền kề',
    'van-phong': 'Văn phòng / Khách sạn',
    'nha-hang': 'Nhà hàng / Quán Cafe',
    'nha-xuong': 'Nhà xưởng / Khác',
  };
  return labels[value] || clean_(value || 'Khác');
}

function clean_(value) {
  return String(value == null ? '' : value).trim();
}

function escapeHtml_(value) {
  return clean_(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function json_(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
