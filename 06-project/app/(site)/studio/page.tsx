import type { Metadata } from "next";
import { Workbench } from "@/features/studio/workbench";

export const metadata: Metadata = { title: "Studio" };

export default function StudioPage() {
  return (
    <main className="studio-page">
      <h1 className="sr-only">Experience Engine Studio</h1>
      <Workbench />
    </main>
  );
}
