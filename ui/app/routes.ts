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
    /*
     * `login` and `register` are gone. They are Ward's now — `/ward/login` and
     * `/ward/register?app=prm`, reached by a full navigation rather than a
     * route in this app. prm is the estate's only app with public registration
     * open, and that registration happens at Ward.
     */

    // Old event-centric URLs, kept alive.
    route("map", "routes/legacy.map.tsx"),
    route("events", "routes/legacy.events.tsx"),
    route("resources/:id", "routes/legacy.resource.tsx"),
  ]),
] satisfies RouteConfig;
