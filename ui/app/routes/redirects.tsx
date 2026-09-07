import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

/**
 * The old event-centric routes. `/map` was the home surface, `/events` was a
 * standalone grid and `/resources/:id` was the place view — all three are now
 * one place-centric model, so old links land on their replacement rather than
 * on a 404.
 */
export function mapRedirect() {
  return redirect("/");
}

export function eventsRedirect() {
  return redirect("/whats-on");
}

export function resourceRedirect({ params }: LoaderFunctionArgs) {
  return redirect(params.id ? `/places/${params.id}` : "/");
}
