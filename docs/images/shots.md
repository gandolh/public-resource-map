# README images

How each image was made, so the next refresh is a re-run. Re-take an image when the screen it shows changes.

| File | Shows | How to reach that state | Viewport | Data | Taken |
|---|---|---|---|---|---|
| hero.webp | Desktop map of central Timișoara with the Muzeul de Artă panel open | `npm run dev`, open `/prm/places/47dfbdaa-1691-551a-8a88-df59aa25e62f`, switch to EN | 1440×900 @2x | seed | 2026-10-09, before the redesign: retake |
| whats-on.webp | The What's on page for Timișoara | `/prm/whats-on`, EN | 1120×900 @2x | seed | 2026-11-16 |
| place-phone.webp | Teatrul Național Timișoara's sheet pulled up to full height, in Romanian | `/prm/places/7af95f1d-1c7e-58d5-9fc9-125c2bd8c219`, RO, then the grab bar ("Extinde detaliile locului") | iPhone 14 emulation | seed | 2026-11-16 |
| map-phone-dark.webp | The city map on a phone, dark theme | `/prm/`, RO, theme menu → Întunecat | iPhone 14 emulation | seed | 2026-10-09, before the redesign: retake |
| map-flow.gif | City view → Museums chip → zoom in twice → drag → click the Muzeul de Artă pin | `/prm/`, EN, then those steps | 1280×800, GIF 800 px wide | seed | 2026-10-09, before the redesign: retake |
| ingestion.svg | The ingestion diagram from the docs site | open `docs/static/diagrams/ingestion.html`, light theme, Export → SVG | vector | `docs/diagrams/ingestion.json` | 2026-10-09 |

## Why three images predate the redesign

The 2026-11-13 redesign moved the search and filters into a band above the map and the place panel to the left, so the hero, the dark phone map and the GIF no longer match the app. They were not retaken on 2026-11-16 because the capture machine could not reach the tile servers (`tile.openstreetmap.org`, `basemaps.cartocdn.com`), and without tiles the map is a blank background under the pins. Retake them on a machine that can load the tiles, with the steps below. What's on and the phone sheet at full height show no map, so they were retaken.

The diagram is not a screenshot; `docs/diagrams/ingestion.json` has not changed since it was exported.

## Data

Everything comes from the seed: `npm run db:migrate -w backend && npm run db:seed -w backend`. The places are the frozen OpenStreetMap capture and the events are synthetic, dated from the day of seeding. The place ids are stable across seeds, so the URLs above keep working. No one was signed in, so no account appears in any image. The basemap is the keyless OpenStreetMap fallback, since no `VITE_CARTO_API_KEY` was set.

## Screenshots

A Playwright script against `npm run dev`, kept outside the repo, then WebP. For each image:

1. Open a browser context with the time zone `Europe/Bucharest`, and either a 1440×900 or 1120×900 viewport at `deviceScaleFactor: 2`, or Playwright's `devices["iPhone 14"]`.
2. Before the page loads, set the language in `localStorage`: `civicmap-lang` to `"en"` or `"ro"` (JSON strings). For the dark shot, set `vite-ui-theme` to `"dark"` the same way. Light is the default.
3. Open the route from the table, wait for network idle and about a second more, blur the focused element and move the mouse to a corner, so no focus ring or hover shows.
4. Take a viewport screenshot (not full-page), then convert it:

```bash
ffmpeg -y -loglevel error -i hero.png -c:v libwebp -quality 82 hero.webp
```

Keep each file under 400 KB; lower the quality for the hero if it goes over. Look at every image, and at a 360 px wide copy, before committing it.

`e2e/shots.spec.ts` takes every screen at 1280 and 390 px in both themes (`SHOTS_DIR=<dir> npx playwright test shots`). Those are for comparing a build with its design comps, not for the README, but the spec is a quick way to see every screen at once.

## The GIF

Two easier routes failed. `agent-browser record` leaves out the time when nothing changes, so the GIF played too fast. Playwright's own video is lossy, and the noise kept the GIF at 9 MB or more.

What worked was a short Playwright script, run with the repo's own `playwright-core`:

1. Set `civicmap-lang` to `en` with an init script, open `/prm/` and wait for the city view.
2. Start a CDP screencast (`Page.startScreencast` with PNG frames) and save each frame with its timestamp to an ffconcat list.
3. Click the Museums chip, click Zoom in twice, drag the map with `mouse.down` and a 20-step `mouse.move`, click the pin, and hold for 2.5 s.
4. Merge frames less than 0.2 s apart into one, keeping the total time, then:

```bash
ffmpeg -f concat -i dec.ffconcat \
  -vf "scale=800:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=none:diff_mode=rectangle" \
  -vsync vfr -loop 0 map-flow.gif
```

That is ffmpeg 4.4; on ffmpeg 5 or later use `-fps_mode vfr` instead of `-vsync vfr`.

The result is 23 frames over about 12 s, about 4 MB. On the redesigned map the Museums chip sits in the band above the map, and the place opens in the column on the left.
