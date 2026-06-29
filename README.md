# olyquest-website

## Offline User Registry (Google Email Linked)

This project now includes an offline-ready user registry to prepare for production usage before deploying a domain.

### Pages

- `registry.html`: Add/edit/delete users linked by Google email.
- `portal.html`: Login now checks the registry email list before opening the dashboard.

### How It Works

- Registry data is saved in browser local storage under key `olyquest.registry.v1`.
- Each account stores:
	- full name
	- google email (unique key)
	- role
	- track
	- notes
	- created/updated timestamps

### Using It

1. Open `registry.html`.
2. Add accounts using Google emails.
3. Open `portal.html` and sign in with a registered email.
4. Use Export JSON regularly to back up data.
5. Use Import JSON to restore or migrate data later.

### Migration Later

When backend/domain is ready, import the exported JSON into your real database and map Google OAuth users by email.