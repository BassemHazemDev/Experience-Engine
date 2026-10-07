import type { ReactNode } from "react";
import { EngineBoundary } from "@/components/engine-boundary";
import { SiteHeader } from "@/components/shell/site-header";
import { SiteFooter } from "@/components/shell/site-footer";
import { DEFAULT_REQUEST } from "@/engine/definitions";
import { messageLoaders } from "@/engine/messages";

// One client engine for the whole site, so the experience you compose in the
// Studio is still the committed one when you open the Playground.
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const initialMessages = await messageLoaders[DEFAULT_REQUEST.culture]();
  return (
    <EngineBoundary initialRequest={DEFAULT_REQUEST} initialMessages={initialMessages}>
      <SiteHeader />
      {children}
      <SiteFooter />
    </EngineBoundary>
  );
}
