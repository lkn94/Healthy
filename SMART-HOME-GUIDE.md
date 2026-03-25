# Healthy · Smart-Home Erlebnis

Healthy ist das digitale Mission-Control für alle, die Home Assistant lieben und ihre Gesundheitsdaten nicht länger in Tabellen verstauben lassen möchten. Statt abstrakter Zahlen bekommst du ein stimmungsvoll inszeniertes Dashboard mit EVA – deiner futuristischen Begleiterin – und einem Smart-Home-Blueprint, der jeden Schritt sichtbar macht.

## Was du damit tun kannst

- **Home Assistant koppeln** – Verbinde beliebig viele Instanzen, wähle Sensoren für Schritte, Gewicht, Distanz, aktive Minuten und Kalorien. Tokens bleiben verschlüsselt im Backend.
- **Historie importieren & automatisch syncen** – Hol dir Monate an Schritt- und Gewichtsdaten in Minuten oder lasse den Scheduler alle 30 Minuten selbständig laufen.
- **Collections & EVA-Story** – Jeder Kilometer füttert Energiepunkte, Tages-Challenges liefern Automationspunkte, Lifetime-Milestones schenken KI-Punkte. Damit baust du virtuell Räume wie „Smart Lighting“, „Automation Brain“ oder den „KI-Companion“ frei.
- **Adaptive Ziele & Fakten** – Healthy passt dein Tagesziel dynamisch an, zeigt dir Wochenverläufe, Rekorde, Kalorienvergleiche und liefert motivierende Fakten (z. B. wie viele Pizzastücke deine Schritte verbrennen).
- **Leaderboards & Social Vibes** – Vergleiche dich mit Freunden (nur wer opt-in setzt) – entweder nach heutigen Schritten oder Lifetime-Performance.
- **Smart-Home Fans im Fokus** – Sensor-Mapping erklärt klar die erwarteten Einheiten, Distanzwerte werden automatisch normalisiert, und der Blueprint fühlt sich wie eine futuristic Smart-Home UI an.

## Perfekt für

- **Smart-Home Enthusiasten**, die ihre Home-Assistant-Sensoren endlich stylish präsentieren möchten.
- **Quantified-Self Fans**, die Deltas pro Tag sehen wollen statt dubioser Doppelzählungen.
- **Portainer/Docker Nutzer**, die eine All-in-One-App (Frontend + Backend) in einem Container starten möchten (`docker compose up --build`).

## Quick Start

1. `.env` aus `.env.example` kopieren und Secrets setzen.
2. `docker compose up --build` ausführen – der Container baut Frontend & Backend und startet auf Port `3000`.
3. Registrierung via UI, erste Home-Assistant-Verbindung anlegen, Sensoren mappen, Import starten – fertig!

> Tipp: Wenn du schon lange Daten gesammelt hast, starte zuerst einen Import (z. B. `fromDate = 2023-01-01`). Healthy korrigiert automatisch Distanz-Überläufe und rechnet Lifetime-Kilometer neu, sodass deine Gesamtreise realistisch bleibt.

## Technischer Deep Dive

| Layer | Umsetzung | Warum das vertrauenswürdig ist |
| --- | --- | --- |
| **Frontend** | Vue 3 + Vite + Tailwind + ECharts; SPA läuft innerhalb desselben Containers wie das Backend und spricht ausschließlich über `/api`. | Keine Third-Party-Tracker, Build kommt aus unserem Docker-Image. Relative API-URL sorgt dafür, dass keine Hardcodings (`localhost`) passieren. |
| **Backend** | Fastify + TypeScript + Prisma + SQLite (WAL). Scheduler via node-cron für 30-Minuten-Syncs + Midnight-Run. | Fastify liefert strukturierte Fehler, Prisma validiert, WAL-Mode schützt vor Korruption. Alle Jobs laufen sequenziell pro Verbindung, so gibt es keine parallelen Writes auf dieselbe DB. |
| **Security** | JWT Auth (argon2 Hash), AES-256-GCM verschlüsselte Home-Assistant-Tokens, CORS nur für proxied SPA. | Tokens verlassen den Server nie im Klartext, JWT sitzt im LocalStorage – kein Refresh Token nötig, weil Sessions bewusst kurz gehalten werden können. |
| **Datenaufbereitung** | `syncRunner` holt History aus Home Assistant, mappt Sensoren und generiert Daily Snapshots mit Deltas (Schritte, Distanz, Kalorien etc.). Lifetime-Stats werden nach jedem Job per `recalculateLifetimeStats` aktualisiert. | Deltas verhindern doppelte Schrittzählung bei Mitternachtswechsel, Distanz-Werte werden normalisiert (Meter vs. Kilometer). Wartungsjob bereinigt Alt-Daten automatisch. |
| **Deployment** | Single Service im `docker-compose.yml`, Frontend + Backend Multi-Stage-Build im Dockerfile, `APP_PORT` wird Host=Container gemappt. Datenbank liegt in `./data/app.db` und wird als Volume eingebunden. | Ein `docker compose up --build` reproduziert exakt das gleiche Setup wie bei dir lokal. Keine versteckten Cloud-Abhängigkeiten. |

### Vertrauensanker

1. **Offener Code & reproduzierbarer Build** – Alles ist TypeScript-basiert, du kannst `npm run test`/`npm run build` selbst fahren oder das Docker-Image lokal bauen.
2. **Keine externen APIs** – Healthy spricht ausschließlich mit deiner Home-Assistant-Instanz; alle Secrets bleiben in deiner Infrastruktur.
3. **Defensive Defaults** – Sensor-Mapping verlangt explizite Auswahl der Entity IDs; Distanz > 500 wird als Meter interpretiert; Wartungsjob korrigiert Datensätze automatisch.
4. **Portainer/Docker ready** – Environment-Variablen kommen aus `.env` oder den Stack-Einstellungen, keine `.env` im Repo selbst. Dadurch kannst du Secrets direkt über Portainer verwalten.
