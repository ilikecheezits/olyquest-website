const {
  getUsers,
  isAdminRequest,
  isValidEmail,
  missingEnv,
  normalizeEmail,
  readJsonBody,
  sanitizeUser,
  sendJson,
  setUsers,
} = require('./_registryStore');

module.exports = async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
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

  if (req.method === 'GET') {
    const users = await getUsers();
    return sendJson(res, 200, { ok: true, users });
  }

  const body = await readJsonBody(req);
  const user = body && body.user;
  if (!user || !user.fullName || !user.googleEmail) {
    return sendJson(res, 400, { ok: false, error: 'User fullName and googleEmail are required.' });
  }

  const normalized = sanitizeUser(user);
  if (!normalized.fullName || !normalized.googleEmail || !isValidEmail(normalized.googleEmail)) {
    return sendJson(res, 400, { ok: false, error: 'Invalid user payload.' });
  }

  const users = await getUsers();
  const existingIndex = users.findIndex(function (item) {
    return normalizeEmail(item.googleEmail) === normalized.googleEmail;
  });

  if (existingIndex === -1) {
    users.unshift(normalized);
  } else {
    users[existingIndex] = {
      ...users[existingIndex],
      ...normalized,
      createdAt: users[existingIndex].createdAt || normalized.createdAt,
      updatedAt: normalized.updatedAt,
    };
  }

  await setUsers(users);
  return sendJson(res, 200, { ok: true, users });
};
