import type { Route } from "../+types/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Public resource map" },
    { name: "description", content: "" },
  ];
}

export default function Home() {
  return <>111</>;
}
