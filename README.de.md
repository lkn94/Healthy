# Healthy – Smart Home Health Dashboard

*English version: [README.md](README.md).* 

**Kurzbeschreibung:** KI-gebautes Health-Dashboard für Home Assistant, das Rohdaten aus Sensoren in tägliche Insights, gamifizierte Collections und eine datenschutzfreundliche Fitness-Zentrale verwandelt.

Healthy ist die Premium-Oberfläche für alle, die ihre Gesundheitsdaten direkt aus Home Assistant visualisieren möchten. Das Projekt besteht aus einem Fastify/Prisma-Backend mit Scheduler und einem Vue-3-Frontend, das Collections, Leaderboard, Kalorien-Insights und den EVA-Blueprint darstellt. Ein einziger Docker-Container reicht aus, um Backend und Frontend zu deployen.

> Für eine Story-getriebene Produktbeschreibung schau in `SMART-HOME-GUIDE.md`.

> Transparenz: Dieses Projekt wurde vollständig per KI erstellt – siehe [AI-TRANSPARENCY.md](AI-TRANSPARENCY.md).

## Features

- 🔐 **Sichere HA-Verbindungen** – Tokens werden mit AES-256-GCM verschlüsselt, CRUD für mehrere Instanzen.
- 📡 **Sensor-Mapping** – Schritte, Distanz, Gewicht, aktive Minuten, Kalorien – inkl. Einheitenhinweisen.
- 📈 **Automatische Imports & Scheduler** – Historischer Import + Cron (alle 30 min & nightly) über den Home-Assistant-Historien-Endpoint.
- 🏗 **Collections Blueprint** – EVA führt durch Räume, Requirements & Fortschritt, mobile-first optimiert.
- 🏆 **Leaderboard & Daily Challenges** – Opt-In Bestenliste, adaptive Tagesziele, Kalorien-Panel mit Referenzen.

## Screenshots

| Login | Dashboard |
| --- | --- |
| ![Healthy Login Bildschirm](screenshots/Login.png) | ![Healthy Dashboard Übersicht](screenshots/Dashboard.png) |

| Fortschritt | Einstellungen |
| --- | --- |
| ![Healthy Fortschrittsansicht](screenshots/Fortschritt.png) | ![Healthy Einstellungen und Sensor-Mapping](screenshots/Einstellungen.png) |

## Architektur & Stack

- **Backend**: Fastify · Prisma · SQLite (WAL) · node-cron · JWT Auth · AES-256-GCM
- **Frontend**: Vue 3 · Pinia · Vite · Tailwind CSS · ECharts
- **Deployment**: Dockerfile (Multi-Stage) + `docker-compose.yml`, Volume `./data` für `app.db`

```
Healthy/
├─ backend/              # Fastify API, Scheduler, Prisma Client
├─ frontend/             # Vue 3 SPA (Vite)
├─ data/                 # Persistente SQLite DB (Volume)
├─ docker-compose.yml    # Ein Container für Frontend + Backend
├─ Dockerfile            # Multi-Stage Build
├─ .env.example          # Gemeinsame Env-Referenz
└─ SMART-HOME-GUIDE.md   # Smart-Home Story & Nutzenbeschreibung
```

## Quick Start (Docker / Portainer)

1. **Env-Datei** – `.env.example` kopieren und anpassen. Wichtig: `DB_URL=file:../../data/app.db`, damit das Volume greift.
2. **Container starten**

   ```bash
   docker compose up --build -d
   ```

3. **Healthy öffnen** – `http://localhost:3000`, neuen Account registrieren.
4. **Home Assistant koppeln** – Long-Lived Token aus HA, Verbindung -> Sensoren -> Import (siehe unten).

> Portainer: Stack mit `docker-compose.yml` anlegen, `.env` im Stack pflegen (Portainer legt keine Dateien an). Volume `./data:/app/data` nicht vergessen.

## Lokales Dev-Setup

```bash
git clone https://github.com/lkn94/Healthy.git
cp .env.example .env

# Backend
cd backend
npm install
npm run migrate:dev
npm run dev

# Frontend (neues Terminal)
cd ../frontend
npm install
npm run dev -- --host
```

- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173` (Proxy auf `/api`)

## Environment Variablen

| Variable | Beschreibung |
| --- | --- |
| `APP_PORT` | Port des Fastify Servers (Default 3000) |
| `JWT_SECRET` | Mindestens 16 Zeichen für Signaturen |
| `ENCRYPTION_KEY` | 32 Zeichen für AES-256-GCM Tokenverschlüsselung |
| `DB_URL` | Prisma-Verbindungsstring, z. B. `file:../../data/app.db` |
| `SYNC_INTERVAL_MINUTES` | Cron-Intervall für Auto-Sync (Standard 30) |
| `DEFAULT_DAILY_GOAL` | Anzeige des Tagesziels im UI |
| `DEFAULT_STEP_LENGTH_METERS` | Schrittweite für Distanz-Fallback |
| `VITE_API_URL` | Backend-Endpunkt für das Frontend (`/api` im Docker, `http://localhost:3000/api` im Dev) |

## Home Assistant vorbereiten & verbinden

1. **Token erzeugen** – In HA unter *Profil → Long-Lived Access Tokens* ein neues Token erstellen.
2. **Verbindung anlegen** – Healthy → Einstellungen → „Verbindungen“ → Name, `Base URL` (`https://ha.domain:8123`) und Token speichern.
3. **Sensoren zuordnen** – „Sensor-Zuordnung“ öffnen, Entitäten für Schritte (`state_class: total`), Distanz, Gewicht, aktive Minuten und Kalorien wählen. Einheiten stehen direkt am Dropdown.
4. **Import starten** – Zeitraum auswählen (z. B. `2024-01-01`), „Historie importieren“. Healthy ruft `/api/history/period` auf, errechnet Tageswerte und legt Snapshots an.
5. **Automatik prüfen** – Der Scheduler triggert alle Verbindungen alle 30 min sowie kurz nach Mitternacht. Status über „Sync-Status“ sichtbar.

## Datenfluss (vereinfacht)

1. **Sync Runner** holt History (in Tages-Chunks) → berechnet Tagesmax (Schritte) + Aggregationen.
2. **Snapshots** landen in `daily_health_snapshot` (SQLite) und speisen Dashboard/Collections.
3. **Scheduler** führt denselben Job periodisch aus; manuelle Syncs/Imports triggern dieselbe Pipeline.

## Nützliche npm-Scripts

| Pfad | Script | Zweck |
| --- | --- | --- |
| `backend/` | `npm run dev` | Fastify + ts-node-dev |
|  | `npm run build` | TypeScript Build |
|  | `npm run migrate:dev` · `migrate:deploy` | Prisma Migrationen |
|  | `npm run generate` | Prisma Client neu erzeugen |
| `frontend/` | `npm run dev` | Vite Dev Server |
|  | `npm run build` | Produktionsbuild |
|  | `npm run preview` | Build-Vorschau |

## API-Überblick

| Route | Zweck |
| --- | --- |
| `POST /api/auth/register` · `login` | Benutzerverwaltung |
| `GET/POST /api/connections` | Home-Assistant-Verbindungen und Token |
| `GET /api/connections/:id/entities` | Verfügbare Entitäten aus HA |
| `POST /api/connections/:id/mapping` | Sensor-Mapping speichern |
| `POST /api/connections/:id/import` | Historischen Import auslösen |
| `POST /api/connections/:id/sync` | Sofort-Sync starten |
| `GET /api/connections/:id/sync-status` | Jobstatus & Kennzahlen |
| `GET /api/dashboard/*` | Datenquellen für Overview, Progress, Body, Kalorien, Collections |
| `PATCH /api/user/settings|profile|password` | Leaderboard-Opt-in, Anzeigename, Passwort |

## Troubleshooting & Tipps

- **HA liefert keine Historie** – `recorder.purge_keep_days` erhöhen, Sensor sicherstellen. Healthy überschreibt alte Tage nur, wenn HA Daten liefert.
- **`Access denied`** – Long-Lived Token prüfen, `baseUrl` inkl. https/schema eintragen, ggf. Zertifikat akzeptieren.
- **Scheduler hängt** – `GET /connections/:id/sync-status` prüfen, Container-Logs ansehen. Bei Bedarf `POST /sync` erneut senden.
- **Frontend erreicht API nicht** – `VITE_API_URL` im Build prüfen. Im Docker-Setup `/api`, im lokalen Vite `http://localhost:3000/api`.
- **Port belegt** – `APP_PORT` ändern + Compose neu starten.

## Weiterführende Dokumente

- `SMART-HOME-GUIDE.md` – Marketing- und Nutzenbeschreibung
- `backend/src/services/maintenance.ts` – Datenpflege + Auto-Rebuild
- `frontend/src/views/*.vue` – Screens (Collections, Leaderboard, Settings, etc.)
- `SETUP.md` / `SETUP.de.md` – Installationsanleitung (EN/DE)

Viel Spaß beim Veröffentlichen!
