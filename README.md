# SignMeetingPro

SignMeetingPro is a responsive meeting operations application for project-scoped meeting management, QR registration, attendance evidence, participant master data, and auditable administration.

## Current capabilities

- SQLite/Prisma data model prepared for a future PostgreSQL migration.
- Database-backed opaque sessions with hashed tokens, `httpOnly` cookies,
  absolute/idle expiry, active-session limits and full revocation on password change.
- Roles: `ADMIN` and `MEETING_MANAGER`.
- Server-side Project RBAC for projects, meetings and attachments.
- Project, manager/project-assignment, global participant group and meeting CRUD.
- Participant groups are project-independent master data and can be reused across meetings in every project.
- Two QR channels per meeting: channel 1 is group-based; channel 2 can be group-based or open.
- Public registration with close-time enforcement, participant selection/manual entry and signature capture.
- Immutable attendance snapshots, sequential meeting person numbers and audit logs.
- Attendance review is separated into QR Channel 2 and QR Channel 1. Each
  channel has an independent persisted display order, while PDF export always
  renders Channel 2 first, Channel 1 second and uses continuous row numbers.
- Authorized administrators and project managers can edit attendance display
  fields or delete a registration from the channel table. Meeting/channel,
  registration number, PDF order, registration time and the captured signature
  remain system-controlled; every mutation is audited.
- Picture/document attachment service with type, size, total quota and SHA-256 validation.
- Responsive desktop/tablet/mobile UI, Prompt font, consistent icon/color actions, confirmation dialogs and loading overlays.
- Driver.js guided tour, health endpoint, unit tests and Playwright smoke tests.

## Main application routes

- `/` - compact dashboard and administration workspaces.
- `/meetings` - searchable, filterable and paginated meeting list.
- `/meetings/[id]` - meeting detail, QR channels, attendance, media and actions.

Search/project filters remain in the meeting-list URL and are restored after
opening a meeting detail. All three routes are protected on the server; meeting
detail access is checked against the user's project assignments.

## Local setup

```bash
cp .env.example .env
# Set a secure local SEED_ADMIN_PASSWORD in .env
npm ci
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3011/login](http://localhost:3011/login).

The repository does not publish a default production password. Credentials are supplied through environment variables only.

## Quality gates

```bash
npm run lint
npm test
npm run build
npm run test:e2e
npm audit --omit=dev
```

Persistent local full-flow QA data can be created and verified explicitly:

```bash
QA_ALLOW_DATA_WRITE=1 npm run qa:full-flow
QA_ALLOW_DATA_WRITE=1 npm run qa:registration-modes
QA_ALLOW_DATA_WRITE=1 npm run test:qa:e2e
```

Both scenarios are idempotent and blocked in production. The registration-mode
scenario keeps 4 GROUP/GROUP and GROUP/OPEN meetings with 25 attendance records,
plus one picture and one document per meeting, for continued manual inspection.
Attendance PDF verification also covers the meeting organizer row rendered at
the end of the table, channel-specific reordering and the continuous
Channel 2-to-Channel 1 export sequence.

Attendance edit/delete QA is intentionally non-destructive: Playwright opens
the edit workflow, verifies the protected-field policy and confirms the delete
warning, then cancels before removing persistent QA data.

See [ARCHITECTURE.md](./ARCHITECTURE.md), [SECURITY.md](./SECURITY.md), and [DEPLOYMENT.md](./DEPLOYMENT.md).
