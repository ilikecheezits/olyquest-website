(function () {
  var STORAGE_KEY = 'olyquest.registry.v1';

  var state = {
    users: [],
    editingEmail: null,
  };

  var refs = {
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

  function hideMessage() {
    refs.message.hidden = true;
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        state.users = [];
        return;
      }

      var parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.users)) {
        state.users = parsed.users;
      } else {
        state.users = [];
      }
    } catch (error) {
      state.users = [];
      showMessage('Registry data could not be read. Starting with an empty list.', 'error');
    }
  }

  function saveState() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        users: state.users,
      })
    );
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
        '<tr><td colspan="6" class="registry-empty">No users yet. Add your first account above.</td></tr>';
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

  function upsertUser(event) {
    event.preventDefault();
    hideMessage();

    var formData = getFormData();

    if (!formData.fullName || !formData.googleEmail) {
      showMessage('Name and Google email are required.', 'error');
      return;
    }

    var existingEmailIndex = state.users.findIndex(function (user) {
      return normalizeEmail(user.googleEmail) === formData.googleEmail;
    });

    if (state.editingEmail) {
      var editingIndex = state.users.findIndex(function (user) {
        return normalizeEmail(user.googleEmail) === state.editingEmail;
      });

      if (editingIndex === -1) {
        showMessage('Could not find the account being edited.', 'error');
        return;
      }

      if (existingEmailIndex !== -1 && existingEmailIndex !== editingIndex) {
        showMessage('Another account already uses that Google email.', 'error');
        return;
      }

      state.users[editingIndex] = {
        fullName: formData.fullName,
        googleEmail: formData.googleEmail,
        role: formData.role,
        track: formData.track,
        notes: formData.notes,
        createdAt: state.users[editingIndex].createdAt,
        updatedAt: new Date().toISOString(),
      };

      saveState();
      renderTable();
      resetForm();
      showMessage('Account updated.', 'success');
      return;
    }

    if (existingEmailIndex !== -1) {
      showMessage('That Google email is already registered.', 'error');
      return;
    }

    state.users.unshift({
      fullName: formData.fullName,
      googleEmail: formData.googleEmail,
      role: formData.role,
      track: formData.track,
      notes: formData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    saveState();
    renderTable();
    resetForm();
    showMessage('Account saved.', 'success');
  }

  function handleTableClick(event) {
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

      state.users = state.users.filter(function (user) {
        return normalizeEmail(user.googleEmail) !== email;
      });
      saveState();
      renderTable();
      showMessage('Account deleted.', 'info');
    }
  }

  function exportRegistry() {
    var payload = {
      version: 1,
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
    reader.onload = function () {
      try {
        var parsed = JSON.parse(reader.result);
        if (!parsed || !Array.isArray(parsed.users)) {
          throw new Error('Invalid format');
        }

        var seen = {};
        var users = parsed.users
          .map(function (user) {
            var email = normalizeEmail(user.googleEmail);
            if (!email || seen[email]) return null;
            seen[email] = true;

            return {
              fullName: String(user.fullName || '').trim(),
              googleEmail: email,
              role: String(user.role || 'Student').trim() || 'Student',
              track: String(user.track || '').trim(),
              notes: String(user.notes || '').trim(),
              createdAt: user.createdAt || new Date().toISOString(),
              updatedAt: user.updatedAt || new Date().toISOString(),
            };
          })
          .filter(Boolean)
          .filter(function (user) {
            return user.fullName && user.googleEmail;
          });

        state.users = users;
        saveState();
        renderTable();
        resetForm();
        showMessage('Registry imported successfully.', 'success');
      } catch (error) {
        showMessage('Import failed. Please use a valid registry JSON file.', 'error');
      }

      refs.importInput.value = '';
    };

    reader.readAsText(file);
  }

  function clearRegistry() {
    if (!window.confirm('Clear all accounts from this browser?')) return;

    state.users = [];
    saveState();
    renderTable();
    resetForm();
    showMessage('All accounts cleared.', 'info');
  }

  function init() {
    loadState();
    renderTable();

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
  }

  init();
})();
