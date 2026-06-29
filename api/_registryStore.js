const USERS_KEY = 'olyquest:registry:users';

function missingEnv() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return 'Missing KV_REST_API_URL or KV_REST_API_TOKEN environment variable.';
  }
  return null;
}

async function kvRequest(path, method) {
  const response = await fetch(`${process.env.KV_REST_API_URL}${path}`, {
    method: method || 'POST',
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`KV request failed (${response.status})`);
  }

  return response.json();
}

async function getUsers() {
  const payload = await kvRequest(`/get/${encodeURIComponent(USERS_KEY)}`, 'GET');
  if (!payload || payload.result == null) {
    return [];
  }

  try {
    const parsed = JSON.parse(payload.result);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

async function setUsers(users) {
  const normalizedUsers = Array.isArray(users) ? users : [];
  await kvRequest(`/set/${encodeURIComponent(USERS_KEY)}/${encodeURIComponent(JSON.stringify(normalizedUsers))}`);
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

function isAdminRequest(req) {
  const expected = process.env.REGISTRY_ADMIN_KEY;
  if (!expected) {
    return false;
  }

  const provided = req.headers['x-admin-key'];
  return typeof provided === 'string' && provided === expected;
}

function sanitizeUser(user) {
  return {
    fullName: String(user.fullName || '').trim(),
    googleEmail: normalizeEmail(user.googleEmail),
    role: String(user.role || 'Student').trim() || 'Student',
    track: String(user.track || '').trim(),
    notes: String(user.notes || '').trim(),
    createdAt: user.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body || '{}');
    } catch (error) {
      return {};
    }
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch (error) {
    return {};
  }
}

function sendJson(res, statusCode, payload) {
  res.status(statusCode).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

module.exports = {
  getUsers,
  isAdminRequest,
  isValidEmail,
  missingEnv,
  normalizeEmail,
  readJsonBody,
  sanitizeUser,
  sendJson,
  setUsers,
};
