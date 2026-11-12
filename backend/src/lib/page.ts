import { z } from "zod";

/** A page of `item`, as every list route answers: `PaginatedResponse<T>` in `shared/`. */
export function pageOf<T extends z.ZodType>(item: T) {
  return z.object({ data: z.array(item), total: z.number(), page: z.number(), pageSize: z.number() });
}
