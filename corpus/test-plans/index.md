# Test Plans — CivicMap

Setup: [playwright/README.md](../../playwright/README.md)

## How a run works

1. `npm run db:seed -w backend` — reset to known state
2. `npm run dev` — start backend (3001) + UI (5173)
3. Mock geolocation to NYC Central Park (see Playwright README)
4. Walk plans in order, screenshot key states to `playwright/screenshots/`
5. Record pass/fail in [RESULTS.md](RESULTS.md)
6. File durable findings as corpus todos

## Plans

| ID | File | Area |
|---|---|---|
| TP-01 | [TP-01-map.md](TP-01-map.md) | Map page — render, pins, filter, drawer |
| TP-02 | [TP-02-events.md](TP-02-events.md) | Events list — grid, filter chips, pagination |
| TP-03 | [TP-03-resource-detail.md](TP-03-resource-detail.md) | Resource detail page |
| TP-04 | [TP-04-ui-audit.md](TP-04-ui-audit.md) | UI/UX audit — design fidelity, a11y, responsive |
