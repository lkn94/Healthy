# Health Dashboard

Full-stack Health Dashboard that connects to Home Assistant, aggregates historical health data, and visualizes progress with a premium Vue UI. The backend uses Fastify, Prisma, and SQLite with scheduled sync jobs, while the frontend combines Vue 3, Pinia, Tailwind CSS, and ECharts.

## Projektstruktur

```
health-dashboard/
├─ backend/          # Fastify API + Prisma ORM
├─ frontend/         # Vue 3 SPA (Vite + Tailwind + ECharts)
├─ data/             # Persistente SQLite Datenbank (Volume / Host Mount)
├─ docker-compose.yml
├─ Dockerfile
└─ .env.example      # Gemeinsame ENV-Referenz für Backend + Frontend
```

## Voraussetzungen

- Node.js 20+
- npm 10+
- Docker & Docker Compose (für Containerbetrieb)

## Setup (lokal)

1. Abhängigkeiten installieren

   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. ENV-Datei anlegen (Backend lädt automatisch die Root-.env)

   ```bash
   cp .env.example .env
   ```

3. Datenbank migrieren

   ```bash
   cd backend
   npm run migrate:dev -- --name init
   ```

4. Entwicklung starten

   ```bash
   # Backend API (Port 3000)
   cd backend
   npm run dev

   # Frontend SPA (Port 5173, proxy auf 3000)
   cd ../frontend
   npm run dev
   ```

## ENV Variablen

| Variable | Beschreibung |
| --- | --- |
| `APP_PORT` | Port des Fastify Servers (Standard 3000) |
| `JWT_SECRET` | Secret für JWT Signaturen (min. 16 Zeichen) |
| `ENCRYPTION_KEY` | Schlüssel für AES-256-GCM Tokenverschlüsselung (mind. 32 Zeichen) |
| `DB_URL` | Prisma SQLite URL (z. B. `file:../../data/app.db`) |
| `SYNC_INTERVAL_MINUTES` | Cron Intervall für automatische Syncs |
| `DEFAULT_DAILY_GOAL` | Standard Zielschritte pro Tag (Frontend Anzeige) |
| `DEFAULT_STEP_LENGTH_METERS` | Schrittweite zur Distanzberechnung |
| `VITE_API_URL` | Frontend API Basis (z. B. `http://localhost:3000/api` für Dev, `/api` in Prod) |

## Docker Nutzung

1. `.env` gemäß `.env.example` konfigurieren (wird auch vom Frontend-Build genutzt).
2. Container bauen und starten:

   ```bash
   docker compose up --build
   ```

- Der Service läuft unter `http://localhost:3000` und dient sowohl Backend als auch das gebaute Frontend aus.
- Das `./data` Verzeichnis wird als Volume eingebunden, sodass `data/app.db` persistent bleibt.

## Wichtige npm Scripts

Backend (`/backend`):

- `npm run dev` – Fastify + ts-node-dev
- `npm run build` – TypeScript Build (dist)
- `npm run migrate:dev` – Prisma Migration (Dev)
- `npm run migrate:deploy` – Prisma Migration (Prod/CI)
- `npm run generate` – Prisma Client generieren

Frontend (`/frontend`):

- `npm run dev` – Vite Dev Server mit Proxy
- `npm run build` – Produktionsbuild
- `npm run preview` – Vorschau des Build Outputs

## API Überblick

- `POST /api/auth/register` – Benutzer registrieren
- `POST /api/auth/login` – Benutzer anmelden
- `GET /api/auth/me` – eingeloggten Benutzer abrufen
- `GET /api/connections` – Home Assistant Verbindungen
- `POST /api/connections` – Verbindung erstellen
- `POST /api/connections/:id/test` – Verbindung prüfen
- `GET /api/connections/:id/entities` – Entities aus HA laden
- `POST /api/connections/:id/mapping` – Sensor Mapping speichern
- `POST /api/connections/:id/import` – Historischen Import starten
- `POST /api/connections/:id/sync` – Sofort-Sync
- `GET /api/connections/:id/sync-status` – Sync-Status abrufen
- `GET /api/dashboard/overview|progress|lifetime|body` – Dashboard Datenquellen

## Typische Fehler & Hinweise

- **`Environment variable not found: DB_URL`** – `.env` fehlt oder DB_URL nicht gesetzt. `.env.example` kopieren.
- **`Access denied` bei HA Requests** – Long-Lived Token prüfen; `baseUrl` muss direkt auf Home Assistant Instanz zeigen.
- **`Sync already running`** – Ein Sync-Job läuft noch. Status per `/sync-status` prüfen.
- **Docker Build schlägt fehl** – Stelle sicher, dass `frontend` und `backend` Packages installiert sind und keine privaten npm Registry-Zugänge fehlen.
- **Frontend lädt API nicht** – `VITE_API_URL` korrekt setzen oder im Dev-Mode Backend erreichbar machen.

## Weitere Hinweise

- Scheduler (node-cron) läuft im Backend und synchronisiert alle 30 Minuten sowie einmal kurz nach Mitternacht.
- Tokens werden mit AES-256-GCM verschlüsselt und niemals im Frontend gespeichert.
- SQLite betreibt WAL-Mode und liegt in `./data/app.db`; Volume nicht löschen, wenn Daten erhalten bleiben sollen.
