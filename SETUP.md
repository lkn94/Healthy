# Healthy – Installations- & Einrichtungsleitfaden

Dieses Dokument führt dich einmal komplett von der Vorbereitung über den ersten Start bis zu den wichtigsten Checks nach dem Deployment.

## 1. Voraussetzungen

| Komponente | Empfehlung |
| --- | --- |
| Home Assistant | Aktuelle Version mit aktiviertem `api`/`recorder`, ausreichend Historie (`purge_keep_days` ≥ 30) |
| Node / npm | Für lokalen Dev: Node 20+, npm 10+ |
| Docker / Compose | Für Deployment (ein Container) |
| Browser | Chromium/Firefox/Safari (für UI) |

## 2. Repository & Dateien

```bash
git clone https://github.com/lkn94/Healthy.git
cd Healthy
cp .env.example .env
```

Die `.env` im Repo-Root wird von Backend **und** Frontend genutzt.

## 3. Environment konfigurieren

| Variable | Beispiel | Hinweis |
| --- | --- | --- |
| `APP_PORT` | `3000` | Muss offen sein, wenn Proxy davor sitzt |
| `JWT_SECRET` | `supersecretvalue123` | min. 16 Zeichen |
| `ENCRYPTION_KEY` | `32charslongencryptionkey1234567` | genau 32 Zeichen |
| `DB_URL` | `file:../../data/app.db` | nicht ändern, wenn Docker-Volume genutzt wird |
| `VITE_API_URL` | `/api` | relative URL im Docker-Build |
| `SYNC_INTERVAL_MINUTES` | `30` | Scheduler-Intervall |

## 4. Deployment per Docker Compose

```bash
docker compose up --build -d
```

- Service erreichbar unter `http://localhost:3000`
- `./data` wird als Volume gemountet (SQLite-DB). Backup nicht vergessen!

### Portainer

1. Stack → `Add Stack`
2. Inhalt von `docker-compose.yml` einfügen
3. Unter *Environment variables* die `.env`-Werte setzen
4. Deploy Stack → Container startet automatisch

## 5. Benutzer & Login

1. Healthy öffnen (`/`)
2. `Registrieren` auswählen → Name, Mail, Passwort
3. Nach Login landet man im Dashboard

## 6. Home Assistant anbinden

1. **Token erstellen** – In HA unter *Profil → Long-lived Access Tokens* → `Create token`
2. **Verbindung anlegen** – Healthy → Einstellungen → „Verbindungen“
   - Name: frei wählbar
   - Base URL: `https://example.duckdns.org:8123` (inkl. Schema & Port)
   - Token: eben generiertes Token
3. Speichern → Healthy testet die Verbindung automatisch (Status „available“)

## 7. Sensor-Zuordnung

1. Im Einstellungsbereich „Sensor-Zuordnung“ auswählen
2. `sensor.body_lukas_schritte_heute` etc. wählen
3. Einheiten werden angezeigt (z. B. „Meter oder km“)
4. Speichern → Mapping landet verschlüsselt in der DB

## 8. Historischen Import starten

1. Datum auswählen (z. B. 2024-01-01)
2. Button „Historie importieren“ klicken
3. Jobstatus erscheint unterhalb (Import-Zeitraum, importierte Tage)
4. Alternativ: `POST /api/connections/:id/import` via API

> Tipp: Der Scheduler importiert automatisch die letzten Tage erneut, falls du später Sensoren wechselst.

## 9. Regelbetrieb & Überwachung

- **Scheduler** – Läuft alle 30 min + nightly. In Logs (`docker logs healthy`) siehst du `sync completed` Meldungen.
- **Sync erzwingen** – Button „Sofort synchronisieren“ oder `POST /api/connections/:id/sync`
- **Log prüfen** – Home Assistant muss Historie liefern (siehe `/api/history/period`). Fehlen Daten, Recorder-Retention erhöhen.

## 10. Häufige Stolpersteine

| Problem | Ursache | Lösung |
| --- | --- | --- |
| Schritte bleiben bei 0 | HA liefert keine Historie (Recorder-Purge) | `purge_keep_days` erhöhen, Import erneut starten |
| Zugriff verweigert | Token oder URL falsch | Long-Lived Token neu erstellen, URL inkl. `https://` setzen |
| Docker-Container stoppt sofort | Env fehlt/fehlerhaft | `docker compose logs` prüfen, `.env` vervollständigen |
| Frontend findet API nicht | Proxy/URL falsch | `VITE_API_URL` prüfen, Browser-Konsole öffnen |

## 11. Manuelle Datenkorrektur

- SQLite-DB liegt unter `data/app.db`
- Prisma Studio:

  ```bash
  cd backend
  npx prisma studio
  ```

- Tabelle `dailyHealthSnapshot` enthält Tageswerte. Manueller Fix möglich, falls HA keine Historie mehr hat.

## 12. Backup & Update

1. Container stoppen: `docker compose down`
2. `data/app.db` sichern
3. Repo aktualisieren (`git pull`), ggf. `npm run migrate:deploy`
4. `docker compose up --build -d`

Damit hast du alle Schritte, um Healthy frisch aufzusetzen oder zu aktualisieren. Viel Erfolg beim Launch! 🎉
