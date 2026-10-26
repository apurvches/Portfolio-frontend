# Portfolio API: setup, deploy, security checklist

## 1. Database
Create a MySQL 8 database, run `schema.sql`, then create the limited user shown at the bottom of that file (never use root).

## 2. Run locally
```
cd server && cp .env.example .env     # fill in DATABASE_URL, SITE_URL, ADMIN_TOKEN
npm install && npm start
```
Frontend (project root): `cp .env.example .env.development`, set `VITE_API_URL=http://localhost:4000`, run `npm run dev`.

## 3. Moderate reviews (admin)
```
curl -H "Authorization: Bearer $ADMIN_TOKEN" "https://YOUR-API/api/admin/reviews?status=pending"
curl -X PATCH -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"status":"approved"}' https://YOUR-API/api/admin/reviews/1
curl -X DELETE -H "Authorization: Bearer $ADMIN_TOKEN" https://YOUR-API/api/admin/users/1   # delete a person's data on request
```

## 4. Deploy
- **API**: a Node host (Render, Railway, Fly.io). Root directory `server`, start command `npm start`.
  Environment variables: DATABASE_URL, DB_SSL (true if your DB needs TLS), SITE_URL=https://your-site, ADMIN_TOKEN.
- **Website**: Vercel or Netlify. Build `npm run build`, output `dist`, env var `VITE_API_URL=https://your-api`.
- HTTPS everywhere (the hosts provide it free).

## 5. Security checklist
| Area | Status |
|---|---|
| SQL injection | Done: every query uses `?` placeholders |
| Input validation | Done: zod schemas, length limits, 10 kB body limit |
| XSS | Done: React escapes output; the API returns plain text only |
| Spam / abuse | Done: rate limits, honeypot field, max 3 pending reviews per person, manual approval |
| Security headers | Done: helmet, `x-powered-by` removed |
| CORS | Done: only SITE_URL may call the API from a browser |
| Secrets | Done: env vars only, `.env` is git-ignored. YOU: never commit real values |
| Admin access | Done: long token, constant-time compare, rate limited. YOU: keep it private, rotate if leaked |
| Error leaks | Done: generic messages to clients, details only in server logs |
| Privacy | Done: consent box + timestamp, emails never public, delete-user endpoint. YOU: add a privacy note to the site |
| Least-privilege DB user | YOU: create `portfolio_app`, do not use root |
| Dependencies | YOU: run `npm audit` before each deploy |
| HTTPS / TLS | YOU: enable on both hosts; DB_SSL=true for hosted databases |
| Backups | YOU: turn on automatic database backups |
| Frontend headers | YOU: add a Content-Security-Policy in your host's header settings |
