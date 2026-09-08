# Run Triage247Ng on localhost

This folder contains the complete Triage247Ng project: React/TypeScript frontend,
Vinext API routes, Cloudflare D1 database schema and migrations, local R2
evidence storage, browser OCR, offline/PWA support, tests, and the Python model
training and evaluation tools.

## Requirements

- Node.js 22.13 or newer (Node 22 LTS is recommended)
- npm 10 or newer
- Python 3.10 or newer (only required for model training/evaluation)
- Git is optional

Check your versions:

```bash
node --version
npm --version
python3 --version
```

On Windows, use `python --version` if `python3` is unavailable.

## First-time setup

Open a terminal in the extracted Triage247Ng project folder.

### macOS or Linux

```bash
npm install
cp local.env.example .dev.vars
npm run local:setup
npm run dev
```

### Windows PowerShell

```powershell
npm.cmd install
Copy-Item local.env.example .dev.vars
npm.cmd run local:setup
npm.cmd run dev
```

Using `npm.cmd` avoids PowerShell's `npm.ps1` execution-policy error without
changing the machine-wide or user-wide execution policy.

Open <http://localhost:5173> in your browser. If Vite displays a different
port because 5173 is occupied, open the address printed in the terminal.

The first local account is created as a Senior Analyst, which allows the full
analyst and routing workflow to be tested. The local identity is enabled only
when both `TRIAGENG_LOCAL_DEV=true` and
`TRIAGENG_ENVIRONMENT=development` are present in `.dev.vars`; the hosted application
continues to use its normal authenticated identity headers.

The development banner must be visible when the local identity is active. The
fallback is denied unless both values are present, so the development flag alone
cannot activate it in a production-marked environment.

Press `Ctrl+C` in the terminal to stop the server. For later sessions, only run:

```bash
npm.cmd run dev
```

## What runs locally

- The frontend and API routes run in one Vite/Vinext development server.
- D1 uses a local SQLite-compatible database managed by Wrangler/Miniflare.
- Evidence uploads use a local R2-compatible bucket.
- Screenshot and scanned-PDF OCR runs on the device using Tesseract.js and
  PDF.js; no OCR account is required.
- The service worker and IndexedDB provide the installable/offline workflow.
- Optional email, webhook and threat-intelligence connections remain disabled
  unless you add provider values to `.dev.vars`.

Local database and bucket data are stored under `.wrangler/`. To start with a
new database, rename that directory as a backup, run `npm run local:setup`, and
restart the development server.

## Model training and evaluation

The checked-in model and evaluation artefacts are ready to use. To regenerate
them from the labelled synthetic dataset:

```bash
npm run ml:train
npm run ml:ocr-evaluate
```

These Python scripts use the Python standard library. The OCR benchmark invokes
the system `tesseract` command, so install Tesseract OCR first if you want to
run that optional benchmark. The browser OCR feature does not require it.

## Verification commands

```bash
npm run build
npm test
npm run lint
```

The development, build, test, lint and migration commands are cross-platform
and can be run directly with `npm.cmd` in Windows PowerShell.

## Important files

- `app/page.tsx` — main frontend interface
- `app/api/` — backend API routes
- `db/schema.ts` — database schema
- `drizzle/` — database migrations
- `worker/index.ts` — Cloudflare Worker entry point
- `ml/` — Python classifier, datasets and OCR evaluation
- `public/sw.js` — service worker
- `tests/` — build/readiness verification

## Troubleshooting

- **API returns 401:** confirm `.dev.vars` exists and contains
  `TRIAGENG_LOCAL_DEV=true` and `TRIAGENG_ENVIRONMENT=development`, then restart
  `npm run dev`.
- **Database table is missing:** stop the server and run `npm run local:setup`.
- **Port 5173 is occupied:** use the alternative localhost URL printed by Vite.
- **Node version error:** install Node 22 LTS and run `npm install` again.
- **Provider shows “not configured”:** this is expected until its optional URL
  and token are supplied in `.dev.vars`.

Never commit or share `.dev.vars`; it may contain secrets when integrations are
configured.
