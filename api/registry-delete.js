const { getUsers, isAdminRequest, missingEnv, normalizeEmail, readJsonBody, sendJson, setUsers } = require('./_registryStore');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
  }

  const envError = missingEnv();
  if (envError) {
    return sendJson(res, 500, { ok: false, error: envError });
  }

  if (!process.env.REGISTRY_ADMIN_KEY) {
    return sendJson(res, 500, { ok: false, error: 'Missing REGISTRY_ADMIN_KEY environment variable.' });
  }

  if (!isAdminRequest(req)) {
    return sendJson(res, 401, { ok: false, error: 'Unauthorized.' });
  }

  const body = await readJsonBody(req);
  const email = normalizeEmail(body && body.email);
  if (!email) {
    return sendJson(res, 400, { ok: false, error: 'Email is required.' });
  }

  const users = await getUsers();
  const filtered = users.filter(function (user) {
    return normalizeEmail(user.googleEmail) !== email;
  });

  await setUsers(filtered);
  return sendJson(res, 200, { ok: true, users: filtered });
};
