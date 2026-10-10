# HomeBridge architecture and future IoT integration

The prototype runs entirely in the browser with simulated data. This document describes how the same data shapes connect to real devices and services.

## Data layer today

Every reading the UI shows has the same shape (`Reading` in `src/lib/sensors.ts`):

| Field | Example | Purpose |
| --- | --- | --- |
| `sensorId` | `sim-water-b` | Stable device identifier |
| `kind` | `water_meter` | temperature, humidity, air_quality, leak, smoke_co, electric_meter, water_meter |
| `value`, `unit` | `412`, `gal today` | Units always travel with values |
| `timestamp` | ISO 8601 | When the reading was taken |
| `source` | `simulated` / `user_entered` / `live` | Shown as a label on every reading |
| `scope` | `whole_home` / `unit` / `building` / `personal` | Keeps unit and building data apart |
| `status` | `online` / `offline` | Connection state |

Replacing `currentReadings()` with a client that returns the same shape from an API is the only change the screens need.

## Proposed production architecture

```
Devices                      Edge / cloud                           App
─────────                    ────────────                           ───
Smart meter (utility API) ─┐
Water meter / leak puck   ─┤  MQTT over TLS    ┌──────────────┐     ┌──────────────┐
Temp / humidity / PM2.5   ─┼─────────────────► │ Ingest service│───►│ Time-series  │
Connected smoke/CO alarm  ─┘  (per-device      │ (validate,    │    │ DB           │
Building systems (BMS)    ───  X.509 certs)    │  normalize    │    └──────┬───────┘
                                               │  units)       │           │
                                               └──────┬────────┘    ┌──────▼───────┐
                                                      │             │ Alert rules  │──► Push / SMS / email
                                                      ▼             │ engine       │    (resident-chosen)
                                               ┌──────────────┐     └──────────────┘
                                               │ Postgres     │◄──── REST/GraphQL API ◄── HomeBridge web/mobile
                                               │ profiles,    │
                                               │ issues,      │
                                               │ reminders    │
                                               └──────────────┘
```

**Device communication.** Devices publish over MQTT with TLS and per-device certificates. Utility usage comes from utility data APIs (for example Green Button Connect where offered) with the resident's OAuth consent. Building-level readings come from a building management system only when the owner or manager opts in, and are tagged `scope: building`.

**Ingest.** Validates payloads, converts units, drops readings outside physical ranges, and marks devices offline after a missed heartbeat.

**Alert rules.** Rules mirror the prototype's thresholds (water use ≥ 3× the 14-day median with overnight flow, leak contact wet, indoor temperature ≥ 85 °F, humidity ≥ 70% for 6 h, PM2.5 > 35 µg/m³, CO alarm state from the alarm itself). HomeBridge relays alarm states; it never claims to detect smoke or CO on its own.

**Storage and privacy.**
- Resident data is scoped to one account; shared-household members have separate accounts and never see each other's financial entries.
- Only an area (neighborhood/ZIP) is stored, never a street address.
- Building-wide data is stored apart from unit data and never exposes individual units.
- No risk scores and no automated eligibility decisions. Resource matches come only from needs the resident records.
- Encryption in transit (TLS 1.2+) and at rest; data export and deletion on request.

**Resource directory.** Listings come from a curated database or a 211 data partnership, each with a `verifiedAt` date and source. The prototype's `verification` field is already in place for this.

## Known gaps before production

- Real device onboarding (pairing, certificate provisioning)
- Account system and household invitations
- Server-side storage instead of browser storage
- Formal accessibility audit with assistive-technology users
- Full Spanish and additional languages
- Verified local resource data
