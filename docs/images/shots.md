# README images

How each image was made, so the next refresh is a re-run. Re-take an image when the screen it shows changes.

| File | Shows | How to reach that state | Viewport | Data | Taken |
|---|---|---|---|---|---|
| hero.webp | Desktop map of central Timișoara with the Muzeul de Artă panel open | `npm run dev`, open `/prm/places/47dfbdaa-1691-551a-8a88-df59aa25e62f`, switch to EN | 1440×900 @2x | seed | 2026-10-09 |
| whats-on.webp | The What's on page for Timișoara | `/prm/whats-on`, EN | 1120×900 @2x | seed | 2026-10-09 |
| place-phone.webp | Teatrul Național Timișoara's bottom sheet, in Romanian | `/prm/places/7af95f1d-1c7e-58d5-9fc9-125c2bd8c219`, RO | iPhone 14 emulation | seed | 2026-10-09 |
| map-phone-dark.webp | The city map on a phone, dark theme | `/prm/`, RO, theme menu → Întunecat | iPhone 14 emulation | seed | 2026-10-09 |
| map-flow.gif | City view → Museums chip → zoom in twice → drag → click the Muzeul de Artă pin | `/prm/`, EN, then those steps | 1280×800, GIF 800 px wide | seed | 2026-10-09 |
| ingestion.svg | The ingestion diagram from the docs site | open `docs/public/diagrams/ingestion.html`, light theme, Export → SVG | vector | `docs/diagrams/ingestion.json` | 2026-10-09 |

## Data

Everything comes from the seed: `npm run db:migrate -w backend && npm run db:seed -w backend`. The places are the frozen OpenStreetMap capture and the events are synthetic, dated from the day of seeding. The place ids are stable across seeds, so the URLs above keep working. No one was signed in, so no account appears in any image. The basemap is the keyless OpenStreetMap fallback, since no `VITE_CARTO_API_KEY` was set.

## Screenshots

`agent-browser` against `npm run dev`, then WebP:

```bash
agent-browser --session prm set viewport 1440 900 2
agent-browser --session prm open http://localhost:5173/prm/places/47dfbdaa-1691-551a-8a88-df59aa25e62f
agent-browser --session prm wait --load networkidle
agent-browser --session prm screenshot /abs/path/hero.png
ffmpeg -y -loglevel error -i hero.png -c:v libwebp -quality 76 hero.webp
```

Click RO or EN in the header first; the choice is kept in `localStorage` (`civicmap-lang`). Blur the focused element before capturing so no focus ring shows. Phone shots use `set device "iPhone 14"` instead of the viewport line. The other WebPs use quality 82; the hero uses 76 to stay under 400 KB.

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

The result is 23 frames over about 12 s, about 4 MB.
