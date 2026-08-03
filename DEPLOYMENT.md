# Deployment

This runbook deploys SignMeetingPro behind Nginx at `/signmeetingpro` without changing other PM2 applications.

## Production paths

```text
Source:  /var/www/apps/signmeetingpro
SQLite:  /var/lib/2startup/signmeetingpro/signmeetingpro.db
Storage: /var/lib/2startup/signmeetingpro/storage
Port:    3012 (127.0.0.1 only)
URL:     https://2startup.cloud/signmeetingpro
```

## Environment

```env
NODE_ENV=production
DATABASE_URL=file:/var/lib/2startup/signmeetingpro/signmeetingpro.db
SESSION_COOKIE_NAME=signmeetingpro_session
SESSION_TTL_HOURS=12
SESSION_IDLE_MINUTES=60
SESSION_MAX_ACTIVE=3
APP_BASE_URL=https://2startup.cloud/signmeetingpro
NEXT_PUBLIC_BASE_PATH=/signmeetingpro
```

Never place the admin password in a tracked production file. Seed it through a temporary protected environment variable, change it after first login, then remove the variable.

## Pre-deployment gate

```bash
git remote -v
ssh -T git@github.com
git status --short
npm ci
npm run db:generate
npm run lint
npm test
npm run build
npm audit --omit=dev
```

Verify `.env`, SQLite files, `storage/`, backups and temporary credentials are not in Git.

## First deployment

```bash
install -d -m 750 /var/lib/2startup/signmeetingpro/storage
cd /var/www/apps/signmeetingpro
ln -sfn /var/lib/2startup/signmeetingpro/storage storage
npm ci
npm run db:generate
DATABASE_URL=file:/var/lib/2startup/signmeetingpro/signmeetingpro.db npx prisma db push
npm run build
pm2 start npm --name signmeetingpro -- run start:production
pm2 save
```

The `start:production` script binds SignMeetingPro to `127.0.0.1:3012`.
Port `3011` remains reserved for AppFund.
The `postbuild` script copies `.next/static` and `public` into the standalone
bundle before PM2 starts `.next/standalone/server.js`.
The checkout's `storage` path must remain a symbolic link to
`/var/lib/2startup/signmeetingpro/storage` so uploaded files survive releases.

## Safe update

```bash
cd /var/www/apps/signmeetingpro
git fetch --prune
git pull --ff-only
npm ci
npm run db:generate
DATABASE_URL=file:/var/lib/2startup/signmeetingpro/signmeetingpro.db npx prisma db push
npm run lint
npm test
npm run build
pm2 restart signmeetingpro --update-env
```

Create a timestamped database/storage backup before `prisma db push`. The
attendance ordering release adds `Attendance.displayOrder`; do not restart the
application if the schema update fails.

Do not run `pm2 restart all`. Check this application and all shared routes:

```bash
pm2 status
ss -ltnp | grep 3012
curl -fsS http://127.0.0.1:3012/signmeetingpro/api/health
curl -fsS https://2startup.cloud/signmeetingpro/api/health
curl -sS -o /dev/null -w '%{http_code}\n' https://2startup.cloud/signmeetingpro/meetings
nginx -t
```

The unauthenticated `/meetings` check must redirect to `/login`. After signing
in, verify `/meetings`, one `/meetings/[id]` route, QR rendering, attendance,
and project access with both an administrator and a project-scoped manager.
Open one meeting containing registrations from both channels and verify that:

- QR Channel 2 is displayed above QR Channel 1.
- Up/down controls persist independently inside each channel after refresh.
- PDF export starts with the reordered Channel 2 rows, continues with the
  reordered Channel 1 rows and numbers all rows continuously.
- The final attendance column is `Actions`; edit opens only permitted snapshot
  fields and GROUP organization remains locked to the QR Channel alias.
- Delete displays the meeting registration identity and irreversible signature
  warning. Cancel the production smoke test without deleting real evidence.
- Verify with both an administrator and an assigned meeting manager that an
  unassigned project cannot call the attendance update/delete API.

## Backup and restore drill

Stop writes briefly or use SQLite `.backup`, then archive database and storage with the same timestamp. A backup is not accepted until restored into an isolated directory and `/api/health`, login, one meeting and one attachment are verified.

## Rollback

Keep the previous commit and pre-deployment database/storage backup. Roll back only SignMeetingPro, rebuild, restart `signmeetingpro`, and rerun its health checks. Do not modify other PM2 processes or Nginx locations.
