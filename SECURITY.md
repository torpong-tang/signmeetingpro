# Security

## Required production controls

- Set a unique `SESSION_COOKIE_NAME`, a short absolute `SESSION_TTL_HOURS`,
  an appropriate `SESSION_IDLE_MINUTES`, and a low `SESSION_MAX_ACTIVE`.
- Session cookies are `httpOnly`, `SameSite=Strict`, secure in production, and
  limited to the application path. Expired/inactive sessions are removed.
- Password changes revoke every active session for the account.
- Keep server-side project authorization on page loads and every API mutation;
  hiding a control in the UI is not an authorization boundary.
- Supply admin credentials only as protected environment variables for the initial seed.
- Remove `SEED_ADMIN_PASSWORD` after initial provisioning and rotate the account password.
- Keep `.env`, `prisma/*.db`, `storage/`, backups and generated reports outside Git.
- Bind the Next.js process to `127.0.0.1`; expose it only through Nginx/TLS.
- Restrict SQLite and storage ownership to the PM2 service user.
- Back up the database and storage directory as one consistency unit.
- Run `npm audit --omit=dev`, lint, unit tests, build and Playwright before deployment.
- Treat attendance as auditable evidence. Edit/delete APIs must authorize the
  requested meeting project, reject system-controlled fields and write an
  `AuditLog` record containing the previous and resulting values.
- Attendance deletion must show an explicit irreversible warning. Signature
  cleanup is restricted to the configured storage root and must never accept a
  client-supplied filesystem path.

## Upload policy

- Pictures: JPG/PNG/WebP, maximum 2 MB each.
- Documents: PDF, DOCX, XLSX or PPTX.
- Combined meeting media: maximum 20 MB.
- Stored names are generated UUIDs.
- SHA-256, MIME type, size and original name are retained.

Magic-byte inspection and malware scanning are required before enabling uploads from untrusted public users. Current uploads are restricted to authenticated project managers/admins.

## Incident response

1. Disable the affected account.
2. Delete active sessions for that account.
3. Rotate passwords/keys.
4. Preserve `AuditLog`, Nginx and PM2 logs.
5. Restore database and storage together when evidence integrity is affected.
