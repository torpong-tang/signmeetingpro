# Architecture

## Design goals

SignMeetingPro is organized by ownership boundary rather than a single application component:

```text
App Router pages/components
        |
API route handlers (HTTP parsing only)
        |
Service layer (policy, transaction, audit)
        |
Prisma client
        |
SQLite now / PostgreSQL-ready later
```

## Main boundaries

- `src/components/app`: dashboard shell, topbar and navigation.
- `src/components/workspaces`: feature-specific Project, Manager, Group and Meeting workspaces.
- `src/components/registration`: public QR registration and signature pad.
- `src/components/shared`: reusable dialog, confirmation, password and loading controls.
- `src/app/api`: thin route handlers.
- `src/server/services`: business rules and transactions.
- `src/server/auth.ts`: session and permission primitives.
- `src/server/validation.ts`: Zod contracts shared by API services.
- `prisma/schema.prisma`: relational model and delete behavior.

## Frontend feature composition

Large feature screens use a consistent controller/view split:

- `registration-form.tsx` composes the public registration screen.
  `use-registration-form.ts` owns loading, validation, confirmation and submit
  state, while `registration-fields.tsx`, `registration-meeting-summary.tsx`
  and `registration-dialogs.tsx` own focused presentation.
- `meeting-workspace.tsx` is a composition root only.
  `use-meeting-workspace.ts` coordinates create/edit/copy/delete and QR image
  mutations. URL filter synchronization, form/deep-link state and reusable
  confirmation state live in `use-meeting-filters.ts`,
  `use-meeting-form-state.ts` and `use-confirmed-action.ts` respectively.
  `meeting-list-section.tsx` owns filtering/pagination composition, while
  `meeting-list-views.tsx` renders desktop/mobile records and action controls.
  `meeting-form-dialog.tsx` renders the editor.
- `meeting-media-dialog.tsx` owns media API state and confirmation flow.
  `meeting-media-section.tsx` owns upload controls, image thumbnails and file
  actions for each media kind, keeping presentation separate from mutations.
- `meeting-form-model.ts` contains empty-form defaults and the
  database-record-to-form mapper. These conversions do not belong in a view.
- `meeting-attendance-dialog.tsx` composes the attendance modal.
  `use-meeting-attendance.ts` owns fetch/export/reorder state and
  `attendance-channel-section.tsx` owns each independently sortable and
  pageable channel table. `attendance-edit-dialog.tsx` contains only editable
  attendance fields, while `attendance-edit-policy.ts` normalizes and validates
  the same contract before the service accepts a mutation.
- Shared ordering rules live in `attendance-dialog-utils.ts`; UI components do
  not duplicate fallback-order calculations.

The composition files should stay small. New API calls or multi-step mutations
belong in the relevant controller hook, while reusable policy belongs in
`src/lib` or the server service layer.

## Attendance report pipeline

Attendance PDF generation is deliberately split into three stages:

```text
attendance-report-service.ts
        |
        +-- attendance-report-model.ts
        |     report types, columns, date formatting, protected signature I/O
        |
        +-- attendance-pdf-renderer.ts
              PDFKit layout, page breaks, table, organizer and page numbers
```

The service is the public entry point. File access is constrained to the
application storage root before data reaches the renderer. Layout changes must
remain inside the renderer and retain the Channel 2 then Channel 1 ordering
provided by the attendance service.

## Security model

- The browser receives an opaque session token; only its SHA-256 hash is stored.
- Project access is checked in service methods. Client filtering is only presentation.
- Admin can access all projects. Meeting managers access assigned projects.
- Passwords are bcrypt hashes with cost 12.
- Attendance stores snapshots so later master-data edits do not rewrite historical evidence.
- Attendance edit/delete requires project access. Editable snapshots are name,
  position, organization, phone and email only. Meeting/channel IDs, participant
  ID, person number, PDF order, registration time and signature are immutable.
- GROUP registrations always derive organization from the QR Channel alias;
  OPEN registrations require an explicitly supplied organization.
- Attendance deletion is transactional, normalizes the remaining channel PDF
  order, records an audit event and removes the signature only from the bounded
  application storage root.
- Meeting fields become immutable after attendance exists; only registration policy/status can change.
- Meetings with attendance are archived instead of physically deleted.

## Data invariants

- `Meeting.meetingCode` is unique.
- Each meeting has exactly channel numbers 1 and 2.
- Channel 1 must use `GROUP`; channel 2 may use `GROUP` or `OPEN`.
- Group channels must reference a group in the selected project.
- `Attendance(meetingId, personNo)` is unique.
- `Attendance.displayOrder` is local to its QR channel. The attendance service
  sorts by channel number descending, then display order, so Channel 2 is
  rendered above Channel 1 and exported first.
- Reordering must submit every attendance ID in one channel exactly once. The
  service verifies project access and channel ownership, updates the order in
  one transaction and writes an audit record.
- Attendance update/delete services verify that the attendance belongs to the
  requested meeting before applying the project authorization policy.
- Files are named with UUIDs; the original name is metadata only.
- File checksum and size are recorded.

## Responsive strategy

- Tables are used for desktop comparison.
- Attendance uses two independent responsive tables so sorting or pagination in
  one QR channel does not affect the other.
- Meeting and Project views switch to touch-friendly cards on smaller viewports.
- Dialog width is bounded by viewport and uses internal scrolling.
- Stable icon buttons and action colors prevent layout shifting.

## Migration path

The service/API boundaries avoid SQLite-specific SQL. A PostgreSQL move should require changing the Prisma datasource, running a controlled data migration and retesting transaction contention. Media storage can move behind an object-storage adapter without changing feature components.
