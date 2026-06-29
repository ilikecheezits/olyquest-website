const { sendJson } = require('./_registryStore');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
  }

  const clientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();
  if (!clientId) {
    return sendJson(res, 200, { ok: false, enabled: false });
  }

  return sendJson(res, 200, {
    ok: true,
    enabled: true,
    clientId,
  });
};
