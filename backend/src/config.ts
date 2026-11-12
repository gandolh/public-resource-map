import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { wardClientOptionsFromEnv, type WardClientOptions } from "../vendor/ward/ward-auth.js";

/*
 * The one reader of the environment. Nothing loads a `.env` file here: the dev scripts pass the
 * repo root's `.env` to Node (`--env-file-if-exists`), and a deploy sets the container's
 * environment. So a missing required variable fails the parse, naming it, instead of a loader
 * quietly finding nothing.
 */

/** `backend/`: `src/` (dev) and `dist/` (built) sit one level under it, so this holds for both. */
const BACKEND_ROOT = fileURLToPath(new URL("../", import.meta.url));

/** Where the database lives when `DATABASE_PATH` is unset: `backend/data/app.db`. */
const DEFAULT_DATABASE_PATH = path.resolve(BACKEND_ROOT, "data/app.db");

const DEFAULT_OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const DEFAULT_INGEST_USER_AGENT = "CivicMap-prm/0.1 (admin-triggered event ingestion)";

/** The server's settings, parsed once at start. */
export interface Config {
  /** `HOST`: `0.0.0.0` by default, which a container needs. */
  host: string;
  /** `PORT`, 3001 by default. */
  port: number;
  /** `CORS_ORIGIN`: the one other origin allowed to call the API. */
  corsOrigin: string;
  /** `DATABASE_PATH`, absolute (a relative value is from the working directory). */
  databasePath: string;
  /**
   * `NODE_ENV=production`. Read for one reason: the legal posture keeps a source the registry
   * marks `forbidden` (the iaBilet rule) off a production server, and the image sets `NODE_ENV`, so
   * the safeguard can't be forgotten by a deploy that leaves out a purpose-named variable.
   */
  production: boolean;
  /** `PUBLIC_ORIGIN`, required: the origin the browser sees. Sign-in refuses every other. */
  publicOrigin: string;
  /** `PRM_BASE`, `/prm/` by default, always ending in `/`: the UI's base path. */
  appBase: string;
  /** `APP_URL`, or else `PUBLIC_ORIGIN` + `PRM_BASE`, with no trailing `/`: where mail links point. */
  appUrl: string;
  /** `AUTH_TRUSTED_PROXIES`: comma-separated addresses or ranges whose `X-Forwarded-For` is believed. */
  trustedProxies: string[];
  /** `INGEST_USER_AGENT`: how ingestion names itself to every source it reads. */
  ingestUserAgent: string;
  /** `NOMINATIM_USER_AGENT`: without one, nothing is geocoded (Nominatim's policy). */
  nominatimUserAgent: string | undefined;
  /** `OVERPASS_URL`: the Overpass endpoint the OSM sync asks. */
  overpassUrl: string;
  /** `WARD_OIDC_*`: "Sign in with Ward", or `undefined` when `WARD_OIDC_ISSUER` is unset. */
  ward: WardClientOptions | undefined;
}

/** The environment can't run the server. The message names every variable at fault. */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

/** `KEY=` copied from an example file counts as unset, so the default applies. */
function unset(value: unknown): unknown {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

const text = (fallback: string) => z.preprocess(unset, z.string().trim().default(fallback));
const optionalText = z.preprocess(unset, z.string().trim().optional());

const databaseSchema = z.object({
  DATABASE_PATH: text(DEFAULT_DATABASE_PATH),
  NODE_ENV: z.string().optional(),
});

const serverSchema = databaseSchema.extend({
  HOST: text("0.0.0.0"),
  PORT: z.preprocess(unset, z.coerce.number<string>().int().min(1).max(65535).default(3001)),
  CORS_ORIGIN: text("http://localhost:5173"),
  PUBLIC_ORIGIN: z.preprocess(
    unset,
    z.string({ error: "PUBLIC_ORIGIN is not set: prm's sign-in needs its public origin (see .env.example)." }).trim(),
  ),
  PRM_BASE: text("/prm/"),
  APP_URL: optionalText,
  AUTH_TRUSTED_PROXIES: z.preprocess(unset, z.string().default("")),
  INGEST_USER_AGENT: text(DEFAULT_INGEST_USER_AGENT),
  NOMINATIM_USER_AGENT: optionalText,
  OVERPASS_URL: text(DEFAULT_OVERPASS_URL),
});

function parse<T extends z.ZodType>(schema: T, env: NodeJS.ProcessEnv): z.output<T> {
  const parsed = schema.safeParse(env);
  if (!parsed.success) throw new ConfigError(z.prettifyError(parsed.error));
  return parsed.data;
}

/** What the database scripts need: where the file is, and whether this is production. */
export interface DatabaseConfig {
  databasePath: string;
  production: boolean;
}

function databaseConfig(data: z.output<typeof databaseSchema>): DatabaseConfig {
  return { databasePath: path.resolve(data.DATABASE_PATH), production: data.NODE_ENV === "production" };
}

/**
 * The server's settings, or a `ConfigError` naming every bad variable (a missing
 * `PUBLIC_ORIGIN`, `PORT=abc`). A Ward set that is half there throws the library's own
 * error, naming what is missing. Tests pass their own `env`.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const data = parse(serverSchema, env);
  const appBase = data.PRM_BASE.endsWith("/") ? data.PRM_BASE : `${data.PRM_BASE}/`;
  const appUrl = (data.APP_URL ?? `${data.PUBLIC_ORIGIN.replace(/\/+$/, "")}${appBase}`).replace(/\/+$/, "");
  return {
    ...databaseConfig(data),
    host: data.HOST,
    port: data.PORT,
    corsOrigin: data.CORS_ORIGIN,
    publicOrigin: data.PUBLIC_ORIGIN,
    appBase,
    appUrl,
    trustedProxies: data.AUTH_TRUSTED_PROXIES.split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry !== ""),
    ingestUserAgent: data.INGEST_USER_AGENT,
    nominatimUserAgent: data.NOMINATIM_USER_AGENT,
    overpassUrl: data.OVERPASS_URL,
    ward: wardClientOptionsFromEnv(env),
  };
}

/** `OVERPASS_URL`, for `db:capture-osm`, which asks Overpass outside the server. */
export function loadOverpassUrl(env: NodeJS.ProcessEnv = process.env): string {
  return parse(z.object({ OVERPASS_URL: text(DEFAULT_OVERPASS_URL) }), env).OVERPASS_URL;
}

/** The settings of the migrate script and the account scripts. */
export function loadDatabaseConfig(env: NodeJS.ProcessEnv = process.env): DatabaseConfig {
  return databaseConfig(parse(databaseSchema, env));
}

/** The seed scripts' settings: the database, plus the users they create. Each is optional. */
export interface SeedConfig extends DatabaseConfig {
  /** `SEED_USERNAME`, `SEED_PASSWORD`, `SEED_ROLE`: the user `db:seed-users` creates. */
  seedUsername: string | undefined;
  seedPassword: string | undefined;
  seedRole: string | undefined;
  /** `SEED_DEMO_USERNAME`, `SEED_DEMO_PASSWORD`: the demo user `db:seed` gives favourites. */
  demoUsername: string | undefined;
  demoPassword: string | undefined;
}

const seedSchema = databaseSchema.extend({
  SEED_USERNAME: optionalText,
  SEED_PASSWORD: optionalText,
  SEED_ROLE: optionalText,
  SEED_DEMO_USERNAME: optionalText,
  SEED_DEMO_PASSWORD: z.preprocess(unset, z.string().optional()),
});

export function loadSeedConfig(env: NodeJS.ProcessEnv = process.env): SeedConfig {
  const data = parse(seedSchema, env);
  return {
    ...databaseConfig(data),
    seedUsername: data.SEED_USERNAME,
    seedPassword: data.SEED_PASSWORD,
    seedRole: data.SEED_ROLE,
    demoUsername: data.SEED_DEMO_USERNAME,
    demoPassword: data.SEED_DEMO_PASSWORD,
  };
}
