# olyquest-website

## Remote User Registry (Google Email Linked)

This project now includes a server-backed registry for deployed usage on Vercel.

### Pages

- `registry.html`: Public Google-email registration form and admin-only registry management panel.
- `portal.html`: Login checks the remote registry via API.

### Vercel Setup (Required)

1. Create a Vercel KV database and connect it to this project.
2. Add these project environment variables in Vercel:
	- `KV_REST_API_URL`
	- `KV_REST_API_TOKEN`
	- `REGISTRY_ADMIN_KEY` (your private admin password)
3. Redeploy.

### How It Works

- Registry data is stored remotely in Vercel KV (`olyquest:registry:users`).
- Full user list endpoints are admin-key protected.
- Public registration can add accounts, but cannot read full registry data.
- Each account stores:
	- full name
	- google email (unique key)
	- role
	- track
	- notes
	- created/updated timestamps

### Using It

1. Open `registry.html` to self-register a user by Google email.
2. For full registry view/edit, enter `REGISTRY_ADMIN_KEY` in the admin section.
3. Open `portal.html` and sign in with a registered email.
4. (Admin) Use Export/Import JSON for backup and migration workflows.

### Migration Later

When moving to full authentication, replace admin-key and email lookup with real Google OAuth plus server session checks.