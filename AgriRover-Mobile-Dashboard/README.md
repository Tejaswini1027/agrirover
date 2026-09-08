# AgriVision — New Design

A ground-up redesign of the AgriRover dashboard. Lives entirely in this
folder; the original `frontend/` app is untouched.

## Why this exists

The previous dashboard was a traditional sidebar + 10-route layout aimed at
laptop users. This version consolidates everything into **one page with four
tab groups** (Overview, Field Ops, Intelligence, Activity) — no route
changes, just state — so navigation feels instant and the whole app works
equally well on a phone or a laptop.

- **Overview** — the one-glance command center: field health, battery, soil
  moisture, risk index, a live map preview, AI insight, zones, and priority
  alerts.
- **Field Ops** — map, rover directional control, and a GPS boundary
  recorder, switchable via a sub-tab bar (was 3 separate pages before).
  The recorder runs a real haversine/shoelace calculation on the walked
  points — not a placeholder.
- **Intelligence** — environment sensors, risk gauges with explainability,
  crop health issues, and irrigation controls (toggle start/stop is live
  state) — was 4 separate pages before.
- **Activity** — a single filterable feed combining alerts, rover log, and
  reports — was 2 separate pages before.

Design language: light/dark theme (toggle in the header, persisted),
bento-grid cards, a lime/amber/sky accent palette distinct from the old
Material 3 green, animated radial gauges, and a bottom tab bar on mobile /
pill tab bar on desktop instead of a fixed sidebar.

All data is simulated (`src/data/simulation.js`) and clearly labeled via the
"Simulation" badge in the header, matching the provider-abstraction
principle from the rest of the project — swapping in live GPS/weather/CV
data later is a data-source change, not a UI rewrite.

## Run it

```bash
cd new-design
npm install
npm run dev
```
