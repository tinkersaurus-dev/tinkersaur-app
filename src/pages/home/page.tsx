import { redirect } from "react-router";

export function meta() {
  return [
    { title: "Tinkersaur.us" },
    { name: "description", content: "Design Studio and Product Management" },
  ];
}

export function loader() {
  return redirect("/solutions/strategy/overview");
}

export default function Home() {
  return null;
}
