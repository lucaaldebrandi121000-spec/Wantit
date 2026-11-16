import { Suspense } from "react";
import { Dashboard } from "@/components/dashboard";

export default function HomePage() {
  // Suspense serve perché Dashboard legge i parametri dell'URL (?add=...)
  return (
    <Suspense>
      <Dashboard />
    </Suspense>
  );
}
