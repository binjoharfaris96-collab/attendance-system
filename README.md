# RollCall Studio

A personal-project attendance website built with Next.js. It gives you:

- Admin login with signed cookies
- Student roster management
- Quick check-in by student ID
- Attendance timeline and student detail history
- CSV export for attendance reports

This build intentionally does **not** include facial recognition or student biometric identification. It is structured so you can extend it with safer check-in methods like QR codes, barcode scanners, or cards.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy the sample environment file and adjust the values:

```bash
copy .env.example .env.local
```

3. Start the dev server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

If you do not create `.env.local`, the app falls back to:

- Email: `admin@example.com`
- Password: `ChangeMe123!`

## Data storage

- Student and attendance data are stored in `data/attendance.sqlite`
- The SQLite database is created automatically on first run
- `data/` is ignored by git

## Exporting reports

- Full export: `/api/reports/attendance`
- Daily export: `/api/reports/attendance?date=YYYY-MM-DD`

## Notes

- The project currently supports one admin account from environment variables
- Attendance is limited to one check-in per student per day
- Timezone handling uses `APP_TIMEZONE`
