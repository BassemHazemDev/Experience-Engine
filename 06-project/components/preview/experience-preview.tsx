"use client";

import { lazy, Suspense, useMemo, type CSSProperties } from "react";
import type { ResolvedExperience } from "@experience-engine/core";
import { useMessages, useResolvedExperience } from "@/components/engine-boundary";
import type { Messages } from "@/engine/messages";
import { createFormatters, type Formatters } from "@/lib/format";
import { resolveComponents } from "./adaptation";
import { ACTIVITY_TIMES, KPIS, WEEKLY_REVENUE } from "./data";
import { OrdersTable } from "./orders";
import { usePresentedExperience } from "./use-presented-experience";
import "./preview.css";

// Same module the theme's `code` resource loads, so by commit time it is cached.
const OrdersList = lazy(() => import("./orders-list"));

const UNITLESS = /weight/;

/** Resolved tokens and typography become CSS variables on the preview root. */
function toCssVariables(experience: ResolvedExperience): CSSProperties {
  const vars: Record<string, string> = {};
  for (const [key, value] of Object.entries(experience.tokens)) {
    if (key.startsWith("component.")) continue;
    vars[`--xp-${key.replace(/\./g, "-")}`] = typeof value === "number" && !UNITLESS.test(key) ? `${value}px` : String(value);
  }
  const type = experience.typography as { fontFamily?: string; displayFamily?: string; lineHeight?: number; letterSpacing?: string };
  if (type.fontFamily) vars["--xp-font-body"] = type.fontFamily;
  // A culture can name its own heading family when the theme’s display face lacks its script.
  if (type.displayFamily) vars["--xp-font-display"] = type.displayFamily;
  if (type.lineHeight) vars["--xp-line-height"] = String(type.lineHeight);
  if (type.letterSpacing) vars["--xp-letter-spacing"] = type.letterSpacing;
  return vars as CSSProperties;
}

const NAV_ITEMS = ["overview", "orders", "products", "customers", "analytics", "settings"] as const;

const NAV_ICONS: Record<(typeof NAV_ITEMS)[number], string> = {
  overview: "M3 11l7-7 7 7v6a1 1 0 01-1 1h-4v-5H8v5H4a1 1 0 01-1-1z",
  orders: "M5 3h10l1 4H4zM4 7h12v9a1 1 0 01-1 1H5a1 1 0 01-1-1zM8 11h4",
  products: "M10 2l7 4v8l-7 4-7-4V6zM3 6l7 4 7-4M10 10v8",
  customers: "M10 10a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM3.5 17a6.5 6.5 0 0113 0",
  analytics: "M4 16V9M10 16V4M16 16v-5",
  settings: "M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM10 2v2.5M10 15.5V18M2 10h2.5M15.5 10H18M4.5 4.5l1.7 1.7M13.8 13.8l1.7 1.7M4.5 15.5l1.7-1.7M13.8 6.2l1.7-1.7",
};

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

function Navigation({ messages, variant }: { messages: Messages; variant: "rail" | "compact" }) {
  return (
    <nav className="xp-nav" data-variant={variant} data-component={variant === "compact" ? "NavigationCompact" : "Navigation"} aria-label={messages.nav.label}>
      <ul>
        {NAV_ITEMS.map((item, index) => (
          <li key={item}>
            <a
              href="#"
              onClick={(event) => event.preventDefault()}
              aria-current={index === 0 ? "page" : undefined}
              aria-label={variant === "compact" ? messages.nav[item] : undefined}
              title={variant === "compact" ? messages.nav[item] : undefined}
            >
              <Icon path={NAV_ICONS[item]} />
              {variant === "rail" && <span>{messages.nav[item]}</span>}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function RevenueChart({ messages, format }: { messages: Messages; format: Formatters }) {
  const width = 600;
  const height = 160;
  const max = Math.max(...WEEKLY_REVENUE);
  const step = width / (WEEKLY_REVENUE.length - 1);
  const points = WEEKLY_REVENUE.map((value, index) => [index * step, height - (value / max) * (height - 16) - 4] as const);
  const line = points.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const last = points[points.length - 1];

  return (
    <section className="xp-card xp-chart" aria-labelledby="xp-chart-title">
      <header className="xp-card-head">
        <h3 id="xp-chart-title">{messages.chart.title}</h3>
        <span className="xp-muted">{messages.chart.range}</span>
      </header>
      {/* The plot mirrors with the reading direction so time still runs from start to end. */}
      <svg className="xp-chart-plot" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={`${messages.chart.title}, ${messages.chart.range}`}>
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line key={ratio} x1="0" x2={width} y1={height * ratio} y2={height * ratio} className="xp-chart-grid" />
        ))}
        <path d={`${line} L${width} ${height} L0 ${height} Z`} className="xp-chart-area" />
        <path d={line} className="xp-chart-line" vectorEffect="non-scaling-stroke" />
        <circle cx={last[0] - 3} cy={last[1]} r="4" className="xp-chart-dot" />
      </svg>
      <footer className="xp-chart-axis xp-muted">
        <span suppressHydrationWarning>
          {messages.chart.week} {format.number(1)}
        </span>
        <span suppressHydrationWarning>
          {messages.chart.week} {format.number(WEEKLY_REVENUE.length)}
        </span>
      </footer>
    </section>
  );
}

export interface ExperiencePreviewProps {
  /** "brief" trims the lower sections for small placements such as the landing hero. */
  readonly sections?: "full" | "brief";
}

/**
 * Nova Commerce — a fictional storefront admin. One component tree; every
 * visible difference comes from the experience the engine resolved.
 */
export function ExperiencePreview({ sections = "full" }: ExperiencePreviewProps) {
  const committed = useResolvedExperience();
  const { presented: experience, motion } = usePresentedExperience(committed);
  const messages = useMessages(experience);
  const format = useMemo(() => createFormatters(experience), [experience]);
  const components = resolveComponents(experience);
  const style = useMemo(() => {
    const vars = toCssVariables(experience) as Record<string, string>;
    vars["--xp-ms"] = `${motion.strategy === "css" ? motion.durationMs : 0}ms`;
    vars["--xp-ease"] = motion.easing;
    return vars as CSSProperties;
  }, [experience, motion.strategy, motion.durationMs, motion.easing]);

  const navVariant = components.navigation.mode === "variant" ? "compact" : "rail";
  const ordersReplaced = components.orders.mode === "replacement";

  return (
    <div
      className="xp-root"
      dir={experience.direction}
      lang={experience.locale}
      style={style}
      data-experience-id={experience.id}
      data-culture={experience.request.culture}
      data-theme={experience.request.theme}
      data-motion={experience.request.motion}
      data-strategy={motion.strategy}
    >
      <header className="xp-topbar">
        <div className="xp-brand">
          <span className="xp-brand-mark" aria-hidden="true" />
          <span>{messages.brand}</span>
        </div>
        <div className="xp-search" role="search">
          <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <circle cx="9" cy="9" r="5.5" />
            <path d="M13.5 13.5L17 17" />
          </svg>
          <span>{messages.search}</span>
        </div>
        <div className="xp-topbar-end">
          <button type="button" className="xp-icon-button" aria-label={`${messages.notifications}: ${format.number(3)}`}>
            <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 8a5 5 0 0110 0c0 4 1.5 5 1.5 5h-13S5 12 5 8zM8.5 16a1.5 1.5 0 003 0" />
            </svg>
            <span className="xp-badge" suppressHydrationWarning>
              {format.number(3)}
            </span>
          </button>
          <div className="xp-account">
            <span className="xp-avatar" aria-hidden="true">
              {messages.account.name.charAt(0)}
            </span>
            <span className="xp-account-text">
              <span>{messages.account.name}</span>
              <span className="xp-muted">{messages.account.role}</span>
            </span>
          </div>
        </div>
      </header>

      <div className="xp-body">
        <Navigation messages={messages} variant={navVariant} />

        <main className="xp-main">
          <section className="xp-hero">
            <div>
              <h2>{messages.hero.title}</h2>
              <p>{messages.hero.body}</p>
            </div>
            <div className="xp-hero-actions">
              <button type="button" className="xp-button">
                {messages.hero.cta}
              </button>
              <button type="button" className="xp-button xp-button-quiet">
                {messages.hero.secondary}
              </button>
            </div>
          </section>

          <ul className="xp-kpis">
            {KPIS.map((kpi) => {
              const up = kpi.change >= 0;
              return (
                <li key={kpi.key} className="xp-card xp-kpi">
                  <span className="xp-label">{messages.kpi[kpi.key]}</span>
                  <strong suppressHydrationWarning>{format[kpi.format](kpi.value)}</strong>
                  <span className="xp-trend" data-direction={up ? "up" : "down"}>
                    <span aria-hidden="true">{up ? "▲" : "▼"}</span>
                    <span suppressHydrationWarning>{format.percent(Math.abs(kpi.change))}</span>
                    <span className="xp-muted">{messages.kpi.vsLastWeek}</span>
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="xp-columns">
            <RevenueChart messages={messages} format={format} />

            {sections === "full" && (
              <section className="xp-card xp-activity" aria-labelledby="xp-activity-title">
                <header className="xp-card-head">
                  <h3 id="xp-activity-title">{messages.activity.title}</h3>
                </header>
                <ol>
                  {messages.activity.items.map((item, index) => (
                    <li key={item}>
                      <span className="xp-activity-mark" aria-hidden="true" />
                      <span>{item}</span>
                      <time className="xp-muted" dateTime={ACTIVITY_TIMES[index]} suppressHydrationWarning>
                        {format.date(ACTIVITY_TIMES[index])}
                      </time>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>

          {sections === "full" && (
            <div className="xp-columns xp-columns-wide">
              <section className="xp-card xp-orders" aria-labelledby="xp-orders-title">
                <header className="xp-card-head">
                  <h3 id="xp-orders-title">{messages.table.title}</h3>
                  <a href="#" onClick={(event) => event.preventDefault()}>
                    {messages.table.viewAll}
                  </a>
                </header>
                {ordersReplaced ? (
                  <Suspense fallback={<div className="xp-orders-fallback" />}>
                    <OrdersList messages={messages} format={format} />
                  </Suspense>
                ) : (
                  <OrdersTable messages={messages} format={format} />
                )}
              </section>

              <section className="xp-card xp-system" aria-labelledby="xp-system-title">
                <header className="xp-card-head">
                  <h3 id="xp-system-title">{messages.system.title}</h3>
                </header>
                <ul>
                  <li data-level="ok">
                    <span aria-hidden="true">✓</span>
                    {messages.system.online}
                  </li>
                  <li data-level="ok">
                    <span aria-hidden="true">✓</span>
                    {messages.system.payments}
                  </li>
                  <li data-level="warn">
                    <span aria-hidden="true">!</span>
                    {messages.system.sync}
                  </li>
                </ul>
                <p className="xp-demo-note">{messages.demoData}</p>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
