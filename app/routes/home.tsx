import { Navigate } from "react-router";

// eslint-disable-next-line react-refresh/only-export-components
export function meta() {
  return [
    { title: "Tinkersaur.us" },
    { name: "description", content: "Design Studio and Product Management" },
  ];
}

export default function Home() {
  return <Navigate to="/solutions" replace />;
}
