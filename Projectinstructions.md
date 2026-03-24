# Health Dashboard V1 – Komplette Entwicklungsanweisung

## Ziel

Erstelle eine vollständig lauffähige Web-Anwendung („Health Dashboard“) mit Backend, Frontend, Datenbank und Docker-Setup.

Die Anwendung muss nach Erstellung mit folgendem Kommando startbar sein:

docker compose up --build

Die Anwendung darf kein Prototyp sein, sondern muss vollständig implementiert sein.

---

## Grundprinzipien

- Kein Pseudocode
- Keine TODOs
- Keine unimplementierten Stellen
- Keine Mock-Daten im finalen System
- Vollständig lauffähiger Code
- Saubere Struktur
- Wartbarer Aufbau

---

## Produktbeschreibung

Die Anwendung ist ein eigenständiges Health Dashboard.

Funktionalität:

- Benutzerregistrierung und Login
- Verbindung zu Home Assistant herstellen
- Historische Daten importieren
- Tageswerte speichern (Snapshots)
- Lebensleistung berechnen
- Fortschritt visualisieren
- Dashboard mit WOW-Effekt anzeigen

Home Assistant ist nur Datenquelle.

---

## Technologie-Stack

### Frontend
- Vue 3
- TypeScript
- Vite
- Tailwind CSS
- ECharts

### Backend
- Node.js
- Fastify
- TypeScript

### Datenbank
- SQLite

### ORM
- Prisma

### Betrieb
- Docker
- docker-compose

---

## Architektur

### Frontend
- spricht ausschließlich mit Backend
- keine direkte Kommunikation mit Home Assistant

### Backend
- verwaltet Auth
- verwaltet Benutzer
- verwaltet Home Assistant Verbindungen
- kommuniziert mit Home Assistant
- berechnet Statistiken
- liefert Dashboard-Daten

### Datenbank
- SQLite Datei
- persistent in Volume

---

## Projektstruktur

health-dashboard/
  backend/
  frontend/
  data/
  Dockerfile
  docker-compose.yml
  .env.example
  README.md

---

## Benutzerfunktionalität

### Authentifizierung

Implementiere:

POST /api/auth/register  
POST /api/auth/login  
GET /api/auth/me  

Passwörter:
- Hashing mit argon2

Auth:
- JWT

---

## Home Assistant Integration

### Benutzer kann Verbindungen anlegen

Daten:
- name
- baseUrl
- accessToken

### Endpunkte

GET /api/connections  
POST /api/connections  
POST /api/connections/:id/test  
DELETE /api/connections/:id  

---

## Sensor Mapping

Ein Benutzer kann definieren:

- stepsEntityId
- weightEntityId (optional)

### Endpunkte

GET /api/connections/:id/entities  
POST /api/connections/:id/mapping  

---

## Importfunktion

### Endpoint

POST /api/connections/:id/import

Input:
- fromDate

Funktion:

- lade History aus Home Assistant
- transformiere zu Daily Snapshots
- speichere in DB
- berechne Lifetime Stats

---

## Sync

### Endpunkte

POST /api/connections/:id/sync  
GET /api/connections/:id/sync-status  

### Scheduler

- alle 30 Minuten Sync
- täglicher Abschluss nach Mitternacht

---

## Datenbankmodell

### User

id  
email  
passwordHash  
displayName  
createdAt  
updatedAt  

---

### HomeAssistantConnection

id  
userId  
name  
baseUrl  
accessTokenEncrypted  
status  
lastSyncAt  
createdAt  
updatedAt  

---

### SensorMapping

id  
connectionId  
stepsEntityId  
weightEntityId  
distanceEntityId  
activeMinutesEntityId  
createdAt  
updatedAt  

---

### DailyHealthSnapshot

id  
userId  
connectionId  
date  
steps  
weight  
source  
createdAt  
updatedAt  

Unique:
userId + connectionId + date

---

### LifetimeStat

id  
connectionId  
totalSteps  
totalKm  
bestDaySteps  
bestWeekSteps  
currentStreak  
longestStreak  
daysTracked  
updatedAt  

---

### SyncJob

id  
connectionId  
type  
status  
startedAt  
finishedAt  
importedDays  
errorMessage  

---

## Berechnungslogik

### totalSteps
Summe aller steps

### totalKm
totalSteps * 0.75 / 1000

### Streak
Tag aktiv wenn steps >= 5000

### bestDay
max(steps)

### bestWeek
max(sum(steps gruppiert nach Woche))

### Durchschnitt
7 Tage  
30 Tage  

---

## Dashboard API

GET /api/dashboard/overview  
GET /api/dashboard/progress  
GET /api/dashboard/lifetime  
GET /api/dashboard/body  

---

## Frontend Seiten

### Overview
- Schritte heute
- Vergleich zu Durchschnitt
- Wochenstatus
- Lebensleistung kompakt

### Progress
- 7 Tage
- 30 Tage
- Heatmap
- Rekorde

### Lifetime
- Gesamt Schritte
- km
- Streak
- beste Woche

### Body
- Gewicht
- Verlauf
- Durchschnitt

### Settings
- Benutzer
- Verbindungen
- Mapping
- Sync

---

## UI Anforderungen

- Dark Mode
- modern
- hochwertig
- große Zahlen
- klare Struktur
- kein klassisches Admin Dashboard
- WOW-Effekt

---

## Sicherheit

- argon2 für Passwort
- JWT für Auth
- Token verschlüsselt speichern
- keine Tokens im Frontend
- CORS konfigurieren

---

## SQLite Anforderungen

- Datei in /data/app.db
- WAL Mode aktivieren
- keine parallelen Schreibprozesse
- ein Sync gleichzeitig

---

## Docker Anforderungen

### docker-compose.yml

- ein Service
- Port 3000
- Volume für /data

### Dockerfile

- Multi-Stage Build
- Frontend build
- Backend build
- nur Produktionsabhängigkeiten

---

## ENV Datei

APP_PORT  
JWT_SECRET  
ENCRYPTION_KEY  
DB_URL  
SYNC_INTERVAL_MINUTES  
DEFAULT_DAILY_GOAL  
DEFAULT_STEP_LENGTH_METERS  

---

## Persistenz

Datenbank muss außerhalb des Containers liegen:

./data/app.db

---

## README Anforderungen

README muss enthalten:

- Beschreibung
- Setup
- ENV Erklärung
- Startanleitung
- Docker Nutzung
- API Überblick
- typische Fehler

---

## Definition of Done

Die Aufgabe ist abgeschlossen, wenn:

- Registrierung funktioniert
- Login funktioniert
- HA Verbindung funktioniert
- Import funktioniert
- Daten gespeichert werden
- Lebensleistung berechnet wird
- Dashboard Daten anzeigt
- Docker Start funktioniert
- README vollständig ist

---

## Erwartung

Liefere:

- vollständigen Code
- alle Dateien
- keine Erklärungen ohne Code
- direkt lauffähiges Projekt

---

## Abschluss

Gib die Antwort ausschließlich als vollständige Projektdateien aus.

Keine Zusammenfassung. Kein erklärender Text.

Nur Code.
