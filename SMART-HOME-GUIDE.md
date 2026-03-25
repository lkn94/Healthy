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
