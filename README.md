# HomeBridge

Smart housing and community support prototype for Hacklanta's track: *Build for the people and places that get overlooked.*

HomeBridge adapts to how people actually live. A homeowner, an apartment renter, a student in a dorm, someone in shared housing and someone in temporary housing each get a different dashboard, a different maintenance workflow, different sensor suggestions and different resource recommendations.

## Try it

Open `dist/index.html` in any modern browser. No server or install needed. Data is saved in the browser's local storage.

The onboarding screen offers five one-click demo scenarios (A–E from the brief). Each loads a full example home and a step-by-step guide on the dashboard.

## What a judge can do

| Requirement | Where |
| --- | --- |
| Select a living situation | Onboarding, step 1 (8 options) |
| Answer ownership / utility / maintenance / sensor questions | Onboarding, step 2 (only relevant questions shown) |
| See a personalized dashboard | Dashboard (cards chosen by `dashboardCards()`) |
| Change the housing profile | Settings → Change living situation (issues, reminders and saved resources are kept) |
| Calculate a projected bill | Utilities |
| Change a budget and see the status update | Utilities → “My budget for this bill” |
| Simulate an IoT alert | My home → Simulate an event |
| Create and update a maintenance report | Maintenance (status, contact log, follow-up, notes, photo) |
| Search and save a resource | Resources |
| Enable accessibility settings | Settings → Accessibility (also offered during onboarding) |
| Reset the demo data | Settings → Privacy & data → Reset demo data |

## Stack

- React 18-compatible code (built against React 19.2) + TypeScript (strict)
- Tailwind CSS 3.4 (standalone CLI), colors as CSS variables for light, dark and high-contrast themes
- Lucide icons (generated into `src/icons.tsx` from the Lucide SVG source, ISC license)
- Charts: small SVG components on `d3-scale` / `d3-shape` (`src/components/charts.tsx`)
- esbuild bundles everything into one self-contained HTML file

Recharts could not be installed in the build environment (the npm registry was unreachable), so the charts are custom components with the same role: line/area trajectory with budget line, bar chart, sparkline. Each has a screen-reader summary and a “Show data table” toggle.

## Project layout

```
src/
  types.ts              Domain types (profile, calculator input, sensors, issues, resources)
  lib/calc.ts           Utility calculator (pure, unit-tested)
  lib/personalize.ts    Every living-situation rule: questions, dashboard cards, sensor options,
                        maintenance workflows, resource needs
  lib/sensors.ts        Simulated sensor layer and alert content
  lib/derived.ts        Recommendations, budget status, due follow-ups
  lib/scenarios.ts      Demo scenarios A–E
  lib/i18n.ts           English + partial Spanish
  data/resources.ts     Resource directory (sample listings + 5 real national programs)
  components/           Screens and UI primitives
tests/                  Unit tests (calculator, personalization) and a Playwright walkthrough
scripts/build.mjs       Build to dist/
```

## Build and test

```
npm run build                         # dist/index.html and dist/homebridge.html
node --import tsx --test tests/*.test.ts   # 17 unit tests
node tests/e2e.mjs dist/index.html shots   # 32 browser checks (Playwright)
```

## Calculation rules

- Usage so far = current reading − previous reading (or usage entered directly)
- Projected usage = (usage so far ÷ days elapsed) × days in cycle
- Bill = (usage × rate + fixed charges) × (1 + tax %); fixed charges counted once per cycle
- Your amount = full bill, your % of it, or your fixed agreed amount
- Status: on track ≤ 90% of budget, approaching 90–100%, projected to exceed > 100%
- Utilities included in rent/fees are shown as informational value, never as an amount owed

## Limitations

- **All sensor data and alerts are simulated.** No devices, meters or utility accounts are connected.
- Bill estimates are straight-line projections. Tiered or time-of-use rates, seasonal pricing, fuel adjustments, credits and provider fees are not modeled.
- Most resource listings are fictional samples (555-01xx numbers, example.org links). The five real entries (911, 211, LIHEAP, Weatherization Assistance Program, Lifeline) link to official pages checked Oct 9, 2026; local availability and eligibility are not verified.
- Data lives only in one browser. No accounts, sync, backup or multi-device use.
- Spanish covers navigation, onboarding and settings only.
- Read-aloud and device location depend on browser support; location is rounded to about 10 km and is optional.
- Accessibility follows WCAG 2.2 AA practices (labels, focus, contrast, target size, no color-only meaning) but has not had a formal audit or testing with assistive-technology users.
- HomeBridge does not replace professional inspections, emergency services or legal advice.
