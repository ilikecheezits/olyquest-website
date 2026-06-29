const {
  getUsers,
  isValidEmail,
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

  const body = await readJsonBody(req);
  const fullName = String(body.fullName || '').trim();
  const googleEmail = normalizeEmail(body.googleEmail);

  if (!fullName || !googleEmail) {
    return sendJson(res, 400, { ok: false, error: 'Full name and Google email are required.' });
  }

  if (!isValidEmail(googleEmail)) {
    return sendJson(res, 400, { ok: false, error: 'Enter a valid email address.' });
  }

  const role = body.role === 'Parent' ? 'Parent' : 'Student';
  const user = sanitizeUser({
    fullName,
    googleEmail,
    role,
    track: body.track || '',
    notes: '',
    createdAt: new Date().toISOString(),
  });

  const users = await getUsers();
  const existingIndex = users.findIndex(function (item) {
    return normalizeEmail(item.googleEmail) === user.googleEmail;
  });

  if (existingIndex !== -1) {
    return sendJson(res, 200, {
      ok: true,
      status: 'exists',
      message: 'This email is already registered.',
    });
  }

  users.unshift(user);
  await setUsers(users);

  return sendJson(res, 201, {
    ok: true,
    status: 'created',
    message: 'Registration successful.',
  });
};
