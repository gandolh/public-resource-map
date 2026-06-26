# Corpus — Schema & Conventions

This directory is the durable knowledge base for **public-resource-map**.
The LLM curates `wiki/`; humans curate sources and ask questions.

## Structure

```
corpus/
  CLAUDE.md              ← this file — schema + rules
  index.md               ← content catalog, the front door
  log.md                 ← chronological record of meaningful changes
  todos/                 ← captured ideas/tasks as prose (pre-spec)
  briefs/
    todo/                ← numbered work specs ready to build
    done/                ← completed briefs (immutable after move)
    superseded/          ← overridden briefs (never deleted)
  wiki/                  ← LLM-curated synthesis pages
```

## Workflows

**Capture**: write `todos/<YYYY-MM-DD>-<slug>.md`
**Spec**: promote to `briefs/todo/<NN>-<slug>.md` (next number, 2-digit pad)
**Build**: grill → plan → implement → verify
**Complete**: `mv briefs/todo/NN-slug.md briefs/done/`, append to `log.md`, fold into `wiki/`

## Conventions

- **Numbers are stable.** Never renumber a brief when it moves.
- **Standard markdown links**, relative to the file's location. No Obsidian `[[wikilinks]]`.
- **Absolute dates** (`2026-06-26`), never "yesterday" or "last week".
- **One concept per file.** Split pages past ~200 lines.
- **Source-of-truth ordering** when pages disagree:
  1. Actual code wins over any wiki claim.
  2. A brief in `done/` wins over `wiki/` if wiki hasn't caught up.
  3. `decisions.md` wins over `status.md` for tech choices not formally revisited.
- **The LLM owns `wiki/`; briefs are immutable once done.**
- **`TodoWrite`** is for in-session task lists; `corpus/` is durable project knowledge.
- Always read `index.md` first before answering a question against the corpus.
- Verify any path/function named in the wiki before acting on it — pages drift.
