(function () {
  var ADMIN_SESSION_KEY = 'olyquest.registry.adminkey';

  var state = {
    var ADMIN_SESSION_KEY = 'olyquest.registry.adminkey';
    editingEmail: null,
    adminKey: sessionStorage.getItem(ADMIN_SESSION_KEY) || '',
  };

      adminKey: sessionStorage.getItem(ADMIN_SESSION_KEY) || '',
  var refs = {
    publicRegisterForm: document.getElementById('public-register-form'),
    publicFullName: document.getElementById('publicFullName'),
    publicGoogleEmail: document.getElementById('publicGoogleEmail'),
    publicRole: document.getElementById('publicRole'),
    publicTrack: document.getElementById('publicTrack'),
    publicMessage: document.getElementById('public-register-message'),
    adminAuthForm: document.getElementById('admin-auth-form'),
      publicMessage: document.getElementById('public-register-message'),
    adminKeyInput: document.getElementById('adminKeyInput'),
    logoutAdminBtn: document.getElementById('logoutAdminBtn'),
    adminPanel: document.getElementById('admin-registry-panel'),
    form: document.getElementById('registry-form'),
    fullName: document.getElementById('fullName'),
    googleEmail: document.getElementById('googleEmail'),
    role: document.getElementById('role'),
    track: document.getElementById('track'),
    notes: document.getElementById('notes'),
    resetFormBtn: document.getElementById('resetFormBtn'),
    saveUserBtn: document.getElementById('saveUserBtn'),
    searchInput: document.getElementById('searchInput'),
    exportBtn: document.getElementById('exportBtn'),
    importInput: document.getElementById('importInput'),
    clearBtn: document.getElementById('clearBtn'),
    message: document.getElementById('registry-message'),
    tableBody: document.getElementById('registry-table-body'),
  };

  function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
  }

  function showMessage(text, tone) {
    refs.message.textContent = text;
    refs.message.className = 'registry-message ' + (tone || 'info');
    refs.message.hidden = false;
  }

  function showPublicMessage(text, tone) {
    refs.publicMessage.textContent = text;
    refs.publicMessage.className = 'registry-message ' + (tone || 'info');
    refs.publicMessage.hidden = false;
  }

  function hideMessage() {
    refs.message.hidden = true;
  }

  function hidePublicMessage() {
    refs.publicMessage.hidden = true;
  }

  async function apiFetch(url, options, requiresAdmin) {
    var config = options || {};
    var headers = config.headers || {};

    if (requiresAdmin) {
      if (!state.adminKey) {
        throw new Error('Admin key required.');
      }
      headers['x-admin-key'] = state.adminKey;
    }

    if (config.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    var response = await fetch(url, {
      method: config.method || 'GET',
      headers: headers,
      body: config.body,
    });

    var data = {};
    try {
      data = await response.json();
    } catch (error) {
      data = { ok: false, error: 'Invalid server response.' };
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Request failed.');
    }

    return data;
  }

  function getFormData() {
    return {
      fullName: refs.fullName.value.trim(),
      googleEmail: normalizeEmail(refs.googleEmail.value),
      role: refs.role.value,
      track: refs.track.value.trim(),
      notes: refs.notes.value.trim(),
    };
  }

  function resetForm() {
    refs.form.reset();
    refs.role.value = 'Student';
    state.editingEmail = null;
    refs.saveUserBtn.textContent = 'Save Account';
  }

  function toDateLabel(isoDate) {
    if (!isoDate) return '-';
    var date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString();
  }

  function getFilteredUsers() {
    var query = refs.searchInput.value.trim().toLowerCase();
    if (!query) return state.users;

    return state.users.filter(function (user) {
      var haystack = [user.fullName, user.googleEmail, user.role, user.track, user.notes].join(' ').toLowerCase();
      return haystack.indexOf(query) !== -1;
    });
  }

  function renderTable() {
    var users = getFilteredUsers();

    if (!users.length) {
      refs.tableBody.innerHTML =
        '<tr><td colspan="6" class="registry-empty">No users yet.</td></tr>';
      return;
    }

    refs.tableBody.innerHTML = users
      .map(function (user) {
        return (
          '<tr>' +
          '<td>' + escapeHtml(user.fullName) + '</td>' +
          '<td>' + escapeHtml(user.googleEmail) + '</td>' +
          '<td>' + escapeHtml(user.role || '-') + '</td>' +
          '<td>' + escapeHtml(user.track || '-') + '</td>' +
          '<td>' + escapeHtml(toDateLabel(user.updatedAt || user.createdAt)) + '</td>' +
          '<td class="registry-actions">' +
          '<button type="button" class="registry-row-btn" data-action="edit" data-email="' +
          escapeHtml(user.googleEmail) +
          '">Edit</button>' +
          '<button type="button" class="registry-row-btn danger" data-action="delete" data-email="' +
          escapeHtml(user.googleEmail) +
          '">Delete</button>' +
          '</td>' +
          '</tr>'
        );
      })
      .join('');
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async function loadUsers() {
    var payload = await apiFetch('/api/registry-users', { method: 'GET' }, true);
    state.users = Array.isArray(payload.users) ? payload.users : [];
    renderTable();
  }

  async function unlockAdmin(event) {
    event.preventDefault();
    hideMessage();

    state.adminKey = refs.adminKeyInput.value.trim();
    if (!state.adminKey) {
      showMessage('Enter an admin key.', 'error');
      return;
    }

    try {
      await apiFetch('/api/registry-auth', { method: 'POST' }, true);
      sessionStorage.setItem(ADMIN_SESSION_KEY, state.adminKey);
      refs.adminPanel.hidden = false;
      await loadUsers();
      showMessage('Admin access granted.', 'success');
    } catch (error) {
      state.adminKey = '';
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      refs.adminPanel.hidden = true;
      showMessage(error.message || 'Admin unlock failed.', 'error');
    }
  }

  function lockAdmin() {
    state.adminKey = '';
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    refs.adminPanel.hidden = true;
    state.users = [];
    renderTable();
    showMessage('Registry locked.', 'info');
  }

  async function submitPublicRegistration(event) {
    event.preventDefault();
    hidePublicMessage();

    var payload = {
      fullName: refs.publicFullName.value.trim(),
      googleEmail: normalizeEmail(refs.publicGoogleEmail.value),
      role: refs.publicRole.value,
      track: refs.publicTrack.value.trim(),
    };

    if (!payload.fullName || !payload.googleEmail) {
      showPublicMessage('Name and Google email are required.', 'error');
      return;
    }

    try {
      var result = await apiFetch('/api/registry-register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (result.status === 'exists') {
        showPublicMessage('This email is already registered.', 'info');
      } else {
        refs.publicRegisterForm.reset();
        showPublicMessage('Registration submitted. You can now log in using that Google email.', 'success');
      }
    } catch (error) {
      showPublicMessage(error.message || 'Registration failed.', 'error');
    }
  }

  async function upsertUser(event) {
    event.preventDefault();
    hideMessage();

    var formData = getFormData();

    if (!formData.fullName || !formData.googleEmail) {
      showMessage('Name and Google email are required.', 'error');
      return;
    }

    try {
      await apiFetch(
        '/api/registry-users',
        {
          method: 'POST',
          body: JSON.stringify({ user: formData }),
        },
        true
      );

      await loadUsers();
      resetForm();
      showMessage('Account saved.', 'success');
    } catch (error) {
      showMessage(error.message || 'Save failed.', 'error');
    }
  }

  async function handleTableClick(event) {
    var actionButton = event.target.closest('button[data-action]');
    if (!actionButton) return;

    var action = actionButton.getAttribute('data-action');
    var email = normalizeEmail(actionButton.getAttribute('data-email'));

    var targetUser = state.users.find(function (user) {
      return normalizeEmail(user.googleEmail) === email;
    });

    if (!targetUser) return;

    if (action === 'edit') {
      refs.fullName.value = targetUser.fullName;
      refs.googleEmail.value = targetUser.googleEmail;
      refs.role.value = targetUser.role || 'Student';
      refs.track.value = targetUser.track || '';
      refs.notes.value = targetUser.notes || '';
      state.editingEmail = email;
      refs.saveUserBtn.textContent = 'Update Account';
      hideMessage();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (action === 'delete') {
      if (!window.confirm('Delete this account?')) return;

      try {
        await apiFetch(
          '/api/registry-delete',
          {
            method: 'POST',
            body: JSON.stringify({ email: email }),
          },
          true
        );

        await loadUsers();
        showMessage('Account deleted.', 'info');
      } catch (error) {
        showMessage(error.message || 'Delete failed.', 'error');
      }
    }
  }

  function exportRegistry() {
    var payload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      users: state.users,
    };

    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'olyquest-registry.json';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    showMessage('Registry exported.', 'success');
  }

  function importRegistryFile(event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = async function () {
      try {
        var parsed = JSON.parse(reader.result);
        if (!parsed || !Array.isArray(parsed.users)) {
          throw new Error('Invalid format');
        }

        await apiFetch(
          '/api/registry-replace',
          {
            method: 'POST',
            body: JSON.stringify({ users: parsed.users }),
          },
          true
        );

        await loadUsers();
        resetForm();
        showMessage('Registry imported successfully.', 'success');
      } catch (error) {
        showMessage(error.message || 'Import failed. Please use a valid registry JSON file.', 'error');
      }

      refs.importInput.value = '';
    };

    reader.readAsText(file);
  }

  async function clearRegistry() {
    if (!window.confirm('Clear all accounts from remote registry?')) return;

    try {
      await apiFetch(
        '/api/registry-replace',
        {
          method: 'POST',
          body: JSON.stringify({ users: [] }),
        },
        true
      );
      await loadUsers();
      resetForm();
      showMessage('All accounts cleared.', 'info');
    } catch (error) {
      showMessage(error.message || 'Clear failed.', 'error');
    }
  }

  async function initAdminFromSession() {
    if (!state.adminKey) {
      renderTable();
      return;
    }

    refs.adminKeyInput.value = state.adminKey;
    try {
      await apiFetch('/api/registry-auth', { method: 'POST' }, true);
      refs.adminPanel.hidden = false;
      await loadUsers();
      showMessage('Admin session restored.', 'info');
    } catch (error) {
      lockAdmin();
    }
  }

  function init() {
    renderTable();

    refs.publicRegisterForm.addEventListener('submit', submitPublicRegistration);
    refs.adminAuthForm.addEventListener('submit', unlockAdmin);
    refs.logoutAdminBtn.addEventListener('click', lockAdmin);
    refs.form.addEventListener('submit', upsertUser);
    refs.resetFormBtn.addEventListener('click', function () {
      resetForm();
      hideMessage();
    });
    refs.searchInput.addEventListener('input', renderTable);
    refs.tableBody.addEventListener('click', handleTableClick);
    refs.exportBtn.addEventListener('click', exportRegistry);
    refs.importInput.addEventListener('change', importRegistryFile);
    refs.clearBtn.addEventListener('click', clearRegistry);

    initAdminFromSession();
  }

  init();
})();
