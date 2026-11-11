---
title: The copied place link keeps the /prm/ base path
created: 2026-11-12
status: open
tags: [ui, bug]
---

# The copied place link keeps the /prm/ base path

Found by brief 04's builder, out of its scope: the place sheet's "Copy link" builds the link as `${window.location.origin}/places/${place.id}` (`ui/app/components/place/PlaceDetail.tsx:46`). The deployed app is built with `PRM_BASE=/prm/` (Vite's `base` and React Router's `basename`), so a copied link drops the `/prm/` prefix and points at a page the estate doesn't serve.

## What to do

- Build the link from the router's base: `import.meta.env.BASE_URL` (Vite's `base`, always ending in `/`), as `new URL(`places/${id}`, `${location.origin}${import.meta.env.BASE_URL}`)`, or React Router's `useHref("/places/" + id)` resolved against the origin.
- A unit test with the base set to `/prm/` and to `/`, and an e2e step that copies the link and opens it.
