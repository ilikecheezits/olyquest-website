const { readJsonBody, sendJson } = require('./_registryStore');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
  }

  const clientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();
  if (!clientId) {
    return sendJson(res, 500, { ok: false, error: 'Missing GOOGLE_CLIENT_ID environment variable.' });
  }

  const body = await readJsonBody(req);
  const credential = String((body && body.credential) || '').trim();
  if (!credential) {
    return sendJson(res, 400, { ok: false, error: 'Missing Google credential token.' });
  }

  try {
    const tokenInfoResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
      { method: 'GET' }
    );

    if (!tokenInfoResponse.ok) {
      return sendJson(res, 401, { ok: false, error: 'Google token validation failed.' });
    }

    const payload = await tokenInfoResponse.json();
    if (String(payload.aud || '') !== clientId) {
      return sendJson(res, 401, { ok: false, error: 'Google token audience mismatch.' });
    }

    if (String(payload.email_verified || '') !== 'true') {
      return sendJson(res, 401, { ok: false, error: 'Google email is not verified.' });
    }

    return sendJson(res, 200, {
      ok: true,
      email: String(payload.email || '').toLowerCase(),
      name: String(payload.name || ''),
      picture: String(payload.picture || ''),
      sub: String(payload.sub || ''),
    });
  } catch (error) {
    return sendJson(res, 500, { ok: false, error: error.message || 'Google token verification failed.' });
  }
};
