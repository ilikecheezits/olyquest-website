# olyquest-website

## Remote User Registry (Google Email Linked)

This project now includes a server-backed registry for deployed usage on Vercel.

### Pages

- `registry.html`: Public registration page with Google account popup verification option.
- `registry-admin.html`: Admin-only registry list and management page (requires admin key).
- `portal.html`: Login checks the remote registry via API.

### Vercel Setup (Required)

1. Create a Vercel KV database and connect it to this project.
2. Add these project environment variables in Vercel:
	- `KV_REST_API_URL`
	- `KV_REST_API_TOKEN`
	- `REGISTRY_ADMIN_KEY` (your private admin password)
	- `GOOGLE_CLIENT_ID` (from Google Cloud OAuth web app)
3. Redeploy.

### How It Works

- Registry data is stored remotely in Vercel KV (`olyquest:registry:users`).
- Full user list endpoints are admin-key protected.
- Public registration can add accounts, but cannot read full registry data.
- Google popup account verification is supported via API-backed token verification.
- Each account stores:
	- full name
	- google email (unique key)
	- role
	- track
	- notes
	- created/updated timestamps

### Using It

1. Open `registry.html` to self-register a user by Google email.
2. Optionally click Google popup login to pre-fill and verify email.
3. Open `registry-admin.html` for full registry view/edit with `REGISTRY_ADMIN_KEY`.
3. Open `portal.html` and sign in with a registered email.
4. (Admin) Use Export/Import JSON for backup and migration workflows.

### Migration Later

When moving to full authentication, replace admin-key and email lookup with real Google OAuth plus server session checks.