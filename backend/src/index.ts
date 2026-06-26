import Fastify from "fastify";
import cors from "@fastify/cors";
import { resourceRoutes } from "./routes/resources.js";
import { eventRoutes } from "./routes/events.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
});

await app.register(resourceRoutes, { prefix: "/api" });
await app.register(eventRoutes, { prefix: "/api" });

app.get("/health", async () => ({ status: "ok" }));

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";

try {
  await app.listen({ port, host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
