const {
  isAdminRequest,
  missingEnv,
  normalizeEmail,
  readJsonBody,
  sanitizeUser,
  sendJson,
  setUsers,
} = require('./_registryStore');

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
  const sourceUsers = Array.isArray(body && body.users) ? body.users : [];
  const seen = {};
  const users = sourceUsers
    .map(sanitizeUser)
    .filter(function (user) {
      if (!user.fullName || !user.googleEmail) {
        return false;
      }
      if (seen[user.googleEmail]) {
        return false;
      }
      seen[user.googleEmail] = true;
      return true;
    })
    .sort(function (a, b) {
      return normalizeEmail(a.fullName).localeCompare(normalizeEmail(b.fullName));
    });

  await setUsers(users);
  return sendJson(res, 200, { ok: true, users });
};
