const { getUsers, isValidEmail, missingEnv, normalizeEmail, readJsonBody, sendJson } = require('./_registryStore');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
  }

  const envError = missingEnv();
  if (envError) {
    return sendJson(res, 500, { ok: false, error: envError });
  }

  const body = await readJsonBody(req);
  const email = normalizeEmail(body && body.email);
  if (!email || !isValidEmail(email)) {
    return sendJson(res, 400, { ok: false, error: 'Email is required.' });
  }

  const users = await getUsers();
  const user = users.find(function (item) {
    return normalizeEmail(item.googleEmail) === email;
  });

  if (!user) {
    return sendJson(res, 404, { ok: false });
  }

  return sendJson(res, 200, {
    ok: true,
    user: {
      fullName: user.fullName,
      googleEmail: user.googleEmail,
      role: user.role,
      track: user.track,
    },
  });
};
