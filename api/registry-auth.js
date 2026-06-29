const { isAdminRequest, sendJson } = require('./_registryStore');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
  }

  if (!process.env.REGISTRY_ADMIN_KEY) {
    return sendJson(res, 500, { ok: false, error: 'Missing REGISTRY_ADMIN_KEY environment variable.' });
  }

  if (!isAdminRequest(req)) {
    return sendJson(res, 401, { ok: false, error: 'Invalid admin key.' });
  }

  return sendJson(res, 200, { ok: true });
};
