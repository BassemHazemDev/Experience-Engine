"use client";

import type { ComponentResolution, ResolvedExperience, TransitionTransaction } from "@experience-engine/core";
import { useStudioRuntime } from "@/components/engine-boundary";
import { resolveComponents } from "@/components/preview/adaptation";
import { ProvenanceTag } from "@/components/ui/primitives";

const show = (value: unknown) => (value === undefined ? "—" : typeof value === "object" ? JSON.stringify(value) : String(value));
const isColor = (value: unknown) => typeof value === "string" && /^(#|rgb|hsl)/.test(value);

function Change({ name, from, to }: { name: string; from: unknown; to: unknown }) {
  return (
    <div className="change">
      <dt>{name}</dt>
      <dd>
        <span className="change-from">
          {isColor(from) && <span className="swatch" style={{ background: String(from) }} aria-hidden="true" />}
          {show(from)}
        </span>
        <span className="change-arrow" aria-label="changed to">
          →
        </span>
        <span className="change-to">
          {isColor(to) && <span className="swatch" style={{ background: String(to) }} aria-hidden="true" />}
          {show(to)}
        </span>
      </dd>
    </div>
  );
}

function keyed(from: ResolvedExperience | undefined, to: ResolvedExperience, field: "typography" | "formatting", keys: readonly string[]) {
  return keys.map((key) => <Change key={`${field}.${key}`} name={`${field}.${key}`} from={from?.[field][key]} to={to[field][key]} />);
}

const describeResolution = (resolution: ComponentResolution | undefined) =>
  resolution ? `${resolution.component} (${resolution.mode})` : undefined;

const COMPONENT_ROWS = [
  { key: "navigation", name: "Navigation", token: "component.nav" },
  { key: "orders", name: "OrdersTable", token: "component.orders" },
] as const;

const RESOURCE_KINDS = ["translation", "font", "asset", "code"] as const;

function DimensionHead({ name, changed, count }: { name: string; changed: boolean; count?: string }) {
  return (
    <h3>
      <span className="delta-dot" aria-hidden="true">
        {changed ? "●" : "○"}
      </span>
      {name}
      <span className="delta-state">{changed ? (count ?? "changed") : "unchanged"}</span>
    </h3>
  );
}

/** What changed between two committed experiences, grouped the way the protocol's delta is. */
export function DeltaView({ transaction }: { transaction: TransitionTransaction }) {
  const { engine } = useStudioRuntime();
  const { delta, from, to } = transaction;
  const cultureChanged = Boolean(delta.culture.request);
  const themeChanged = Boolean(delta.theme.request);
  const motionChanged = Boolean(delta.motion.request);

  // `component.*` tokens select an adaptation; they are listed with the
  // component they drive instead of among the visual tokens.
  const tokens = Object.entries(delta.tokens.changed).filter(([key]) => !key.startsWith("component."));

  // Density is declared on the theme definition, so it is read from the registry.
  const density = {
    from: from ? engine.themes.get(from.request.theme)?.density : undefined,
    to: engine.themes.get(to.request.theme)?.density,
  };

  // What the core ComponentResolver returns for each of the two snapshots.
  const before = from ? resolveComponents(from) : undefined;
  const after = resolveComponents(to);
  const components = COMPONENT_ROWS.map((row) => ({
    ...row,
    from: before?.[row.key],
    to: after[row.key],
    changed: before?.[row.key].component !== after[row.key].component,
    tokenChange: delta.tokens.changed[row.token],
  }));
  const componentsChanged = components.some((component) => component.changed);

  const { added, retained, removed } = delta.resources;
  const resourcesChanged = added.length > 0 || removed.length > 0;

  return (
    <div className="delta">
      <div className="delta-dimensions">
        <section className="delta-dim" data-dim="culture" data-changed={cultureChanged}>
          <DimensionHead name="Culture" changed={cultureChanged} />
          {cultureChanged ? (
            <dl>
              <Change name="culture" from={delta.culture.request!.from} to={delta.culture.request!.to} />
              {delta.culture.locale && <Change name="locale" from={delta.culture.locale.from} to={delta.culture.locale.to} />}
              {delta.culture.direction && <Change name="direction" from={delta.culture.direction.from} to={delta.culture.direction.to} />}
              {keyed(from, to, "typography", delta.culture.typographyKeys)}
              {keyed(from, to, "formatting", delta.culture.formattingKeys)}
            </dl>
          ) : (
            <p className="note">Nothing to prepare.</p>
          )}
        </section>

        <section className="delta-dim" data-dim="theme" data-changed={themeChanged}>
          <DimensionHead name="Theme" changed={themeChanged} count={`${tokens.length} tokens`} />
          {themeChanged ? (
            <dl>
              <Change name="theme" from={delta.theme.request!.from} to={delta.theme.request!.to} />
              {density.from !== density.to && <Change name="density" from={density.from} to={density.to} />}
              {tokens.map(([key, value]) => (
                <Change key={key} name={`token:${key}`} from={value.from} to={value.to} />
              ))}
            </dl>
          ) : (
            <p className="note">Nothing to prepare.</p>
          )}
        </section>

        <section className="delta-dim" data-dim="motion" data-changed={motionChanged}>
          <DimensionHead name="Motion" changed={motionChanged} />
          {motionChanged ? (
            <dl>
              <Change name="motion" from={delta.motion.request!.from} to={delta.motion.request!.to} />
              {delta.motion.strategy && <Change name="strategy" from={delta.motion.strategy.from} to={delta.motion.strategy.to} />}
              <Change name="durationMs" from={from?.motion.durationMs} to={to.motion.durationMs} />
              <Change name="easing" from={from?.motion.easing} to={to.motion.easing} />
            </dl>
          ) : (
            <p className="note">Nothing to prepare.</p>
          )}
        </section>

        <section className="delta-dim" data-dim="theme" data-changed={componentsChanged}>
          <DimensionHead name="Components" changed={componentsChanged} />
          <dl>
            {components.map((component) =>
              component.changed ? (
                <div key={component.key} className="change-group">
                  <Change name={component.name} from={describeResolution(component.from)} to={describeResolution(component.to)} />
                  {component.tokenChange && (
                    <p className="change-cause">
                      selected by theme token <code>{component.token}</code>: {show(component.tokenChange.from)} → {show(component.tokenChange.to)}
                    </p>
                  )}
                </div>
              ) : (
                <div key={component.key} className="change change-same">
                  <dt>{component.name}</dt>
                  <dd>{describeResolution(component.to)}, unchanged</dd>
                </div>
              ),
            )}
          </dl>
          <ProvenanceTag kind="engine">Resolved by the core ComponentResolver</ProvenanceTag>
        </section>

        <section className="delta-dim delta-resources" data-changed={resourcesChanged}>
          <DimensionHead name="Resources" changed={resourcesChanged} count={`${added.length} added`} />
          <dl>
            {RESOURCE_KINDS.map((kind) => {
              const list = [
                ...added.filter((resource) => resource.kind === kind).map((resource) => ({ id: resource.id, how: "added" })),
                ...retained.filter((resource) => resource.kind === kind).map((resource) => ({ id: resource.id, how: "retained" })),
                ...removed.filter((resource) => resource.kind === kind).map((resource) => ({ id: resource.id, how: "no longer needed" })),
              ];
              if (list.length === 0) return null;
              return (
                <div key={kind} className="change">
                  <dt>{kind}</dt>
                  {list.map((item) => (
                    <dd key={`${item.id}-${item.how}`} data-how={item.how}>
                      <span className="change-to">{item.id}</span>
                      <span className="change-how">{item.how}</span>
                    </dd>
                  ))}
                </div>
              );
            })}
          </dl>
        </section>
      </div>

      <details className="delta-keys">
        <summary>
          All {delta.changedKeys.length} changed keys <ProvenanceTag kind="engine">Typed delta computed by the engine</ProvenanceTag>
        </summary>
        {delta.changedKeys.length === 0 ? (
          <p className="note">None. The target equals the current experience.</p>
        ) : (
          <ul>
            {delta.changedKeys.map((key) => (
              <li key={key} data-dim={key.startsWith("token:") || key === "theme" ? "theme" : key === "motion" ? "motion" : "culture"}>
                {key}
              </li>
            ))}
          </ul>
        )}
        <p className="note">
          The engine reports component selection as <code>token:component.*</code> keys. The Components panel shows what those tokens resolve to.
        </p>
      </details>
    </div>
  );
}
