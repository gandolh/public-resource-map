import { z } from "zod";

/**
 * A route's `:id`: any string. The handler answers an unknown id with 404, so a pattern here
 * would turn a 404 into a 400.
 */
export const idParamsSchema = z.object({ id: z.string() });
