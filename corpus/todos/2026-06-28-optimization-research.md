# Research: smoother corpus + platform optimization (2026-06-28)

Online research into (1) making the corpus easier to use and (2) optimizing the app. Findings feed [brief 12 — platform optimization](../briefs/todo/12-platform-optimization.md) and [the corpus-UX todo](2026-06-28-corpus-ux-improvements.md).

## Platform optimization findings

### Database (better-sqlite3 / SQLite)
- **WAL mode is the single biggest win** for a web workload — concurrent reads don't block writes. With WAL, `synchronous=NORMAL` is safe + fast (fewer fsyncs; tiny last-commit-loss risk on power failure, never corruption).
- PRAGMAs are **per-connection** (mostly not persistent) — set them at startup.
- **WAL caveat:** requires all processes on the **same host** (shared memory) — fine for our single-VPS + host-volume design; never on network FS / across hosts. (Aligns with deployment decision.) Docker containers sharing a same-host volume are OK.
- Prepared statements: up to ~1.5x throughput (Drizzle already prepares).

### Map (Leaflet)
- **Render only in-viewport markers** = the biggest practical win for large sets.
- **Clustering:** `Leaflet.markercluster` (standard; fine to ~100k) or `supercluster` beyond. Use `chunkedLoading` to avoid UI freeze.
- **Canvas rendering** (`preferCanvas`) moves a few tiles vs. thousands of DOM nodes — much faster; tradeoff is less per-marker DOM flexibility (fine for our color+badge pins).
- **`clearLayers()` + `addLayers(batch)`** ~10x faster than per-marker updates.

### Frontend/SPA
- Debounce pan/zoom → bbox refetch; cache via TanStack Query keyed by (city,bbox,filters).
- Route-lazy-load the admin UI so public users don't download it.

## Corpus-UX findings (docs/KB best practices)
- **Front-matter metadata massively aids discoverability** — a 2025 technical-writers survey reported 89% improvement after adding front-matter tags. Cheap to adopt per file.
- File-naming: lowercase-hyphen, no special chars — **we already do this.** ✓
- Clear categories + consistent naming + logical hierarchy + a single front door — **we mostly have this** (index.md). Gaps: jargon glossary, status visibility, "start here for a task" paths.
- Markdown-in-Git KB = no lock-in, full history, any editor — **our model.** ✓
- Docusaurus exists for rendered docs sites — **overkill for an LLM-maintained corpus**; rejected. Our consumer is the LLM + occasional human, not a public docs site.

## Sources
- [Building a Markdown-Based Documentation System (Medium)](https://medium.com/@rosgluk/building-a-markdown-based-documentation-system-72bef3cb1db3)
- [Building a Markdown Knowledge Base: Structure, Linking, Search (edtr.md)](https://edtr.md/blog/markdown-for-knowledge-base)
- [Code Documentation Best Practices (Codacy)](https://blog.codacy.com/code-documentation)
- [Optimizing Leaflet Performance with Many Markers (Medium)](https://medium.com/@silvajohnny777/optimizing-leaflet-performance-with-a-large-number-of-markers-0dea18c2ec99)
- [Leaflet High-Performance Map Visualizations in React (Andrej Gajdos)](https://andrejgajdos.com/leaflet-developer-guide-to-high-performance-map-visualizations-in-react/)
- [Leaflet.markercluster](http://leaflet.github.io/Leaflet.markercluster/)
- [SQLite Optimizations for Ultra High-Performance (PowerSync)](https://powersync.com/blog/sqlite-optimizations-for-ultra-high-performance)
- [better-sqlite3 performance docs](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/performance.md)
- [SQLite WAL](https://sqlite.org/wal.html) · [WAL across Docker containers (Simon Willison)](https://simonwillison.net/2026/Apr/7/sqlite-wal-docker-containers/)
