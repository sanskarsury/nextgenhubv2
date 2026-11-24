# NextGenHub starter

A plain HTML/CSS/JavaScript agency website with a Supabase-backed inquiry form and a starter admin area.

## Included
- Responsive one-page public website (sections: Home, Services, Work, About, Contact)
- Contact inquiry form connected to Supabase
- Admin login page and dark admin dashboard
- CRUD for services and portfolio projects (create, edit, publish/hide, delete)
- Inquiry management (read, status update, delete)
- Business settings editor (name, email, phone, tagline, about text, social URL)
- Public website loads published services/projects and business settings from Supabase
- SQL schema with Row Level Security policies
- Cloudflare Pages-friendly static file structure

## 1. Create Supabase project
1. Create a project at https://supabase.com/dashboard.
2. Open SQL Editor and run `database/schema.sql`.
3. Run `database/admin-upgrade.sql` to enforce the single-admin rule and add indexes.
4. In Project Settings > API, copy the Project URL and publishable key (or legacy anon key).
5. Paste those into `js/config.js`.
6. In Authentication > Users, create your administrator user.
7. Run the final profile-promotion SQL in `database/schema.sql`, replacing `YOUR_ADMIN_EMAIL` with your admin email.
8. Sign in at `/admin/login.html`.

Important: never put a Supabase secret or service_role key in browser JavaScript. This starter only uses a publishable key and relies on RLS. Keep public inquiry forms protected against spam before production (for example, add rate limiting / CAPTCHA through a server-side function).

## 2. Test locally
Because JavaScript modules are used, serve the folder over HTTP rather than opening index.html directly. In the folder, run:
`python -m http.server 8000`
Then open http://localhost:8000.

## 3. Deploy free with Cloudflare Pages
1. Push this folder to a GitHub repository.
2. In Cloudflare Dashboard, open Workers & Pages > Create > Pages > Connect to Git.
3. Select the repository.
4. Framework preset: None. Build command: leave blank. Build output directory: `/` (or the repository root setting shown in the dashboard).
5. Deploy. Your project receives a `*.pages.dev` address if the project name is available.

## Before using for real clients
- Replace sample email address and all sample portfolio content.
- Add a privacy policy and terms appropriate to your business and location.
- Add spam protection and server-side validation for contact submissions.
- Test all RLS policies with signed-out, ordinary signed-in, and admin accounts.
- Add backups/export procedures. Supabase Free projects may pause after a week of inactivity and have no automatic backups.
- The dashboard includes CRUD for services and portfolio projects, inquiry management, and business settings. The public website reads published services/projects and settings from Supabase.
- Keep admin access limited to trusted administrators; never allow visitors to self-assign admin roles.


## Admin dashboard features
- Dark responsive dashboard with overview counts.
- Single administrator enforced by `database/admin-upgrade.sql`.
- Services: create, edit, publish/hide and delete.
- Portfolio: create, edit, publish/hide and delete.
- Inquiries: list, mark read/new and delete.
- Site settings: business name, contact email, phone, tagline, about copy and social URL.

The single-admin trigger prevents a second profile from being promoted while another admin exists. To transfer admin ownership, first demote the current admin in a trusted SQL session, then promote the replacement.
