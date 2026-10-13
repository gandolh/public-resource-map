import { type RouteConfig, route, layout } from "@react-router/dev/routes";

/**
 * Place-centric IA. The map is home, and `/places/:id` is a child of it so the
 * map stays mounted underneath — one place surface whether you clicked a pin or
 * opened a shared link.
 */
export default [
  layout("./components/Layout.tsx", [
    route("/", "routes/map.tsx", [route("places/:id", "routes/place.tsx")]),
    route("whats-on", "routes/whats-on.tsx"),
    route("archive", "routes/archive.tsx"),
    route("about-data", "routes/about-data.tsx"),
    /*
     * prm's own accounts (brief 24 of Ward's corpus): its login page, with
     * "Sign in with Ward" beside the form, its register page (prm is the
     * estate's one app with public registration), and account settings.
     */
    route("login", "routes/login.tsx"),
    route("register", "routes/register.tsx"),
    route("settings", "routes/settings.tsx"),

    // Old event-centric URLs, kept alive.
    route("map", "routes/legacy.map.tsx"),
    route("events", "routes/legacy.events.tsx"),
    route("resources/:id", "routes/legacy.resource.tsx"),
  ]),
  // The admin shell (brief 16): its own layout, and its own chunks, which the
  // public pages never load.
  layout("./routes/admin/AdminLayout.tsx", [
    route("admin", "routes/admin/review.tsx"),
    route("admin/sources", "routes/admin/sources.tsx"),
  ]),
] satisfies RouteConfig;
