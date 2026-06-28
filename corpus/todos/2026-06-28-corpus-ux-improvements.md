# Corpus UX improvements (2026-06-28)

From [docs/KB best-practices research](2026-06-28-optimization-research.md). The corpus is already healthy (30 files, well-split, lowercase-hyphen naming, single front door, Git-native). These are incremental usability wins.

## Done already (this session)
- **[wiki/glossary.md](../wiki/glossary.md)** added — defines the jargon-dense domain (place, OSM, Overpass, staged event, reconcile, etc.). Research flagged a glossary as a top discoverability win for jargon-heavy KBs.
- **[index.md](../index.md)** upgraded into a real front door — added a "New here?" reading path + a **task-oriented "Start here" table** ("I want to… → go to…"), the research's "logical paths for common tasks" pattern. Glossary linked.

## Proposed (not yet done — needs a deliberate pass)

### 1. Front-matter metadata on every file [biggest remaining win]
Research: a 2025 technical-writers survey reported **89% discoverability improvement** after adding front-matter tags. Adopt a minimal YAML header on each corpus file:
```yaml
---
title: ...
status: draft | active | locked | done | superseded
updated: 2026-06-28
tags: [auth, ingestion, ui, ...]
---
```
- **Cost:** touches all ~30 files (mechanical but bulk). Do as one intentional pass, not silently.
- **Payoff:** an LLM/human can grep `status:` and `tags:` to find relevant files fast; staleness is visible via `updated:`.
- **Caveat:** keep it minimal — over-tagging is maintenance debt. Status + updated + 1–3 tags is enough.

### 2. Per-wiki-page "last updated / source-of-truth" line
Each wiki page gets a one-line footer: when last synced + which briefs/decisions it reflects. Catches drift (the corpus already warns "pages drift; verify before acting").

### 3. A `status.md` refresh cadence
`status.md` is dated 2026-06-26 and is now stale (predates the whole reframe). It's the "current state dashboard" — most valuable when current. Either refresh it now or note it's superseded by recent log entries. **Recommend refreshing it as part of the next build session.**

### 4. Decision IDs for cross-referencing
`decisions.md` sections are referenced by prose name ("decisions.md → Legal posture"). Stable anchor IDs (e.g. `D-001 Legal posture`) would make references precise and rename-safe. Low priority.

## Rejected
- **Docusaurus / a rendered docs site** — overkill. The corpus's primary consumer is the LLM + occasional human editor, not a public docs audience. Plain markdown-in-Git is the right tool.
