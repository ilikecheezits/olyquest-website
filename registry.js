(function () {
  var state = {
    googleClientId: '',
    verifiedGoogleEmail: '',
  };

  var refs = {
    publicRegisterForm: document.getElementById('public-register-form'),
    publicFullName: document.getElementById('publicFullName'),
    publicRole: document.getElementById('publicRole'),
    publicMessage: document.getElementById('public-register-message'),
    googleRegisterButton: document.getElementById('google-register-button'),
  };

  function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
  }

  function showPublicMessage(text, tone) {
    refs.publicMessage.textContent = text;
    refs.publicMessage.className = 'registry-message ' + (tone || 'info');
    refs.publicMessage.hidden = false;
  }

  function hidePublicMessage() {
    refs.publicMessage.hidden = true;
  }

  async function apiFetch(url, options) {
    var config = options || {};
    var headers = config.headers || {};

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

  async function submitPublicRegistration(event) {
    event.preventDefault();
    hidePublicMessage();

    var payload = {
      fullName: refs.publicFullName.value.trim(),
      googleEmail: normalizeEmail(state.verifiedGoogleEmail),
      role: refs.publicRole.value,
      track: '',
    };

    if (!payload.fullName || !payload.googleEmail) {
      showPublicMessage('Name is required. Connect a Google account before registering.', 'error');
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
        refs.publicRole.value = 'Student';
        showPublicMessage('Registration submitted. You can now log in using that Google email.', 'success');
      }
    } catch (error) {
      showPublicMessage(error.message || 'Registration failed.', 'error');
    }
  }

  async function verifyGoogleCredential(credential) {
    var payload = await apiFetch('/api/google-verify', {
      method: 'POST',
      body: JSON.stringify({ credential: credential }),
    });

    return payload;
  }

  function onGoogleRegisterCredential(response) {
    if (!response || !response.credential) {
      showPublicMessage('Google sign-in did not return a credential.', 'error');
      return;
    }

    verifyGoogleCredential(response.credential)
      .then(function (verified) {
        state.verifiedGoogleEmail = normalizeEmail(verified.email);
        if (!refs.publicFullName.value && verified.name) {
          refs.publicFullName.value = verified.name;
        }
        showPublicMessage('Google account verified. Complete name and role to register.', 'success');
      })
      .catch(function (error) {
        showPublicMessage(error.message || 'Google verification failed.', 'error');
      });
  }

  async function initGoogleRegisterButton() {
    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
      return;
    }

    try {
      var config = await apiFetch('/api/google-config', { method: 'GET' });
      if (!config.enabled || !config.clientId) {
        return;
      }

      state.googleClientId = config.clientId;
      window.google.accounts.id.initialize({
        client_id: state.googleClientId,
        callback: onGoogleRegisterCredential,
      });

      window.google.accounts.id.renderButton(refs.googleRegisterButton, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
      });
    } catch (error) {
      showPublicMessage(error.message || 'Google sign-in is unavailable right now.', 'error');
    }
  }

  function init() {
    refs.publicRegisterForm.addEventListener('submit', submitPublicRegistration);
    refs.publicRegisterForm.addEventListener('reset', function () {
      state.verifiedGoogleEmail = '';
      hidePublicMessage();
    });
    initGoogleRegisterButton();
  }

  init();
})();
