# Healthy – Installation & Setup Guide

*German version: [SETUP.de.md](SETUP.de.md).*

This step-by-step guide covers everything from prerequisites to Portainer deployment and troubleshooting.

## 1. Requirements

| Component | Recommendation |
| --- | --- |
| Home Assistant | Current release with `api`/`recorder` enabled, `recorder.purge_keep_days ≥ 30` |
| Node / npm | Node 20+, npm 10+ (for local dev) |
| Docker / Compose | Required for the all-in-one container |
| Browser | Chromium / Firefox / Safari |

## 2. Clone Repo & Prepare Files

```bash
git clone https://github.com/lkn94/Healthy.git
cd Healthy
cp .env.example .env
```

The root `.env` is consumed by both backend and frontend builds.

## 3. Configure Environment

| Var | Example | Notes |
| --- | --- | --- |
| `APP_PORT` | `3000` | Change if port conflicts |
| `JWT_SECRET` | `supersecretvalue123` | ≥16 characters |
| `ENCRYPTION_KEY` | `32charslongencryptionkey1234567` | exactly 32 chars for AES-256-GCM |
| `DB_URL` | `file:../../data/app.db` | keep as-is for Docker volume |
| `VITE_API_URL` | `/api` | relative path for production build |
| `SYNC_INTERVAL_MINUTES` | `30` | scheduler interval |

## 4. Docker Compose Deployment

```bash
docker compose up --build -d
```

- App available at `http://localhost:3000`
- `./data` is mounted as volume → don’t delete it unless you want to wipe the DB

### Portainer

1. *Stacks → Add stack*
2. Paste the content of `docker-compose.yml`
3. Define env vars in the UI (Portainer won’t create files)
4. Deploy stack – container starts automatically

## 5. Create User & Log In

1. Open Healthy UI
2. Click **Registrieren/Register** and create the first user
3. After login you land on the overview dashboard

## 6. Connect Home Assistant

1. **Create token** – HA → Profile → Long-Lived access tokens → “Create token”
2. **Add connection** – Healthy → Settings → Connections
   - Name: free choice
   - Base URL: `https://your-ha.duckdns.org:8123`
   - Token: paste the long-lived token
3. Save – status switches to “available” when the connection tests successfully

## 7. Map Sensors

1. Scroll to “Sensor-Zuordnung / Sensor mapping”
2. Select the HA entities for steps, distance, weight, active minutes, calories (unit hints are shown)
3. Save mapping – encrypted in the DB

## 8. Run Historical Import

1. Choose a start date (e.g., `2024-01-01`)
2. Click **Historie importieren**
3. Healthy fetches `/api/history/period`, computes daily snapshots, and displays the job status
4. API alternative: `POST /api/connections/:id/import` with `fromDate`

> The scheduler also re-imports the last few days automatically, so changing sensors later is safe.

## 9. Operations & Monitoring

- **Scheduler**: runs every 30 minutes plus shortly after midnight. Logs show `sync completed` messages.
- **Manual sync**: use “Sofort synchronisieren” or `POST /api/connections/:id/sync`.
- **Check HA history**: if imports stay empty, use `GET /api/history/period` in HA to confirm data exists (extend recorder retention if not).

## 10. Common Issues

| Symptom | Cause | Fix |
| --- | --- | --- |
| Day remains at 0 | HA recorder purged history | Increase `purge_keep_days`, re-run import |
| `Access denied` from HA | Wrong base URL or expired token | Generate new long-lived token, include schema/port |
| Container exits immediately | Missing env vars | `docker compose logs`, re-check `.env` |
| Frontend can’t reach API | Wrong `VITE_API_URL` or proxy | Use `/api` in Docker, `http://localhost:3000/api` in dev |

## 11. Manual Data Corrections

- SQLite DB located at `data/app.db`
- Use Prisma Studio:

  ```bash
  cd backend
  npx prisma studio
  ```

- Table `dailyHealthSnapshot` holds daily aggregates; adjust values directly if HA history is gone.

## 12. Backup & Updates

1. Stop container: `docker compose down`
2. Backup `data/app.db`
3. `git pull`, run `npm run migrate:deploy` inside `backend/` if schema changed
4. `docker compose up --build -d`

All set! 🎉
