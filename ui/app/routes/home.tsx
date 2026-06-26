import { redirect } from "react-router";
import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => [
  { title: "CivicMap — Discover your city" },
];

export function clientLoader() {
  return redirect("/map");
}

export default function Home() {
  return null;
}
