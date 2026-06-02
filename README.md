# AeroMaint

AeroMaint is a Next.js application for airport preventive maintenance tracking. It manages equipment, QR-based task lookup, preventive planning, technician reports, supervisor validation, KPIs, and user administration.

## Requirements

- Node.js 20 or newer
- MySQL or MariaDB
- npm

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local`:

```env
DATABASE_URL="mysql://root:@localhost:3306/aeromaint"
NEXTAUTH_SECRET="replace-this-with-a-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"
UPLOAD_DIR="public/uploads"
```

3. Create the database, run migrations, and seed demo data:

```bash
npx prisma migrate deploy
npm run db:seed
```

4. Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Demo Accounts

- Admin: `admin@aeromaint.local` / `Admin1234!`
- Supervisor: `superviseur@aeromaint.local` / `Super1234!`
- Technician: `tech@aeromaint.local` / `Tech1234!`
- Night technician: `tech2@aeromaint.local` / `Night1234!`

## Useful Commands

```bash
npm run build
npm run typecheck
npm run db:seed
```

## Presentation Data

The presentation preset is additive: it preserves existing records, replaces only its
own previous presentation records, and creates a richer airport maintenance dataset.

```bash
npm run db:seed:presentation
```

The shared password for presentation accounts is `Presentation123!`. Useful accounts:

- Admin: `presentation.admin@aeromaint.local`
- Supervisor: `presentation.superviseur@aeromaint.local`
- Surety technician: `youssef.benali@presentation.aeromaint.local`
- Baggage technician: `nora.alaoui@presentation.aeromaint.local`
- Airfield lighting technician: `hamza.idrissi@presentation.aeromaint.local`

Remove only the presentation preset and its generated photo fixtures:

```bash
npm run db:wipe:presentation
```

Remove all application records and uploaded files while keeping the schema:

```bash
npm run db:wipe
```

Preview either wipe without deleting anything by appending `-- --dry-run`.

!!! For a realistic performance check, test the optimized build:

```bash
npm run build
npm run start
```

## Notes

- Uploaded report photos are stored under `public/uploads`.
- QR codes resolve to `/tasks/scan?qr=...`; technicians are routed to their own open or rejected task for the scanned equipment.
- Planning generation refreshes current and future open tasks while preserving historical submitted, validated, rejected, and closed work.
