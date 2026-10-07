import type { Metadata } from "next";
import { ExperiencePreview } from "@/components/preview/experience-preview";
import { FailureLab, RapidLab, UnknownLab } from "@/features/playground/labs";
import { PlaygroundStatus } from "@/features/playground/status";

export const metadata: Metadata = { title: "Playground" };

export default function PlaygroundPage() {
  return (
    <main className="page page-wide">
      <header className="page-head">
        <h1>Playground</h1>
        <p className="lede">
          Stress the guarded commit. Send requests faster than they can finish, make resources fail, and ask for things that do not exist. The application on
          the right only ever shows a fully prepared experience.
        </p>
      </header>

      <div className="playground">
        <div className="playground-labs">
          <RapidLab />
          <FailureLab />
          <UnknownLab />
        </div>
        <aside className="playground-preview" aria-label="Live application preview">
          <PlaygroundStatus />
          <div className="playground-frame">
            <ExperiencePreview sections="brief" />
          </div>
        </aside>
      </div>
    </main>
  );
}
