// Duong dan /api/submit-lead chay duoc tren ca Cloudflare Pages lan Netlify
// (Netlify chuyen tiep sang /.netlify/functions/submit-lead qua netlify.toml).
window.MINH_VIET_CONFIG = Object.freeze({
  leadEndpoint: '/api/submit-lead',
  maxFileSizeBytes: 4 * 1024 * 1024,
});
