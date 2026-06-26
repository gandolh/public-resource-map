import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  layout("./components/Layout.tsx", [
    index("routes/home.tsx"),
    route("map", "routes/map.tsx"),
    route("events", "routes/events.tsx"),
    route("resources/:id", "routes/resources.$id.tsx"),
  ]),
] satisfies RouteConfig;
