## Resource detail page title is static

`meta` in `ui/app/routes/resources.$id.tsx` always returns `"Resource — CivicMap"`
regardless of which resource is loaded.

**Fix:** Change the `meta` export to read the resource name from loader data (or
keep the current client-fetch approach and update `document.title` via `useEffect`
once the resource is loaded).

**Acceptance:** Browser tab and `<title>` shows `"{resource.name} — CivicMap"`.
