import type { Direction, ExperienceId, ExperienceRequest, ResolvedExperience, ResourceReference } from "../types/index";

export type DeltaValue<T> = Readonly<{ from: T; to: T }>;

export interface CultureDelta {
  readonly request?: DeltaValue<string>;
  readonly locale?: DeltaValue<string>;
  readonly direction?: DeltaValue<Direction>;
  readonly formattingKeys: readonly string[];
  readonly typographyKeys: readonly string[];
}

export interface ThemeDelta {
  readonly request?: DeltaValue<string>;
  readonly tokenKeys: readonly string[];
  readonly componentKeys: readonly string[];
}

export interface MotionDelta {
  readonly request?: DeltaValue<string>;
  readonly strategy?: DeltaValue<string>;
}

export interface TokenDelta {
  readonly changed: Readonly<Record<string, DeltaValue<unknown>>>;
}

export interface ComponentDelta {
  readonly changed: Readonly<Record<string, DeltaValue<unknown>>>;
}

export interface ResourceDelta {
  readonly added: readonly ResourceReference[];
  readonly removed: readonly ResourceReference[];
  readonly retained: readonly ResourceReference[];
}

export interface ETPExperienceDelta {
  readonly from: ExperienceId;
  readonly to: ExperienceId;
  readonly culture: CultureDelta;
  readonly theme: ThemeDelta;
  readonly motion: MotionDelta;
  readonly tokens: TokenDelta;
  readonly components: ComponentDelta;
  readonly resources: ResourceDelta;
  readonly changedKeys: readonly string[];
}

export type DependencyNodeId = string;
export type DependencyNodeKind = "dimension" | "property" | "token" | "component" | "resource" | "motion";

export interface DependencyNode {
  readonly id: DependencyNodeId;
  readonly kind: DependencyNodeKind;
}

export interface DependencyGraph {
  readonly nodes: ReadonlyMap<DependencyNodeId, DependencyNode>;
  readonly edges: ReadonlyMap<DependencyNodeId, readonly DependencyNodeId[]>;
}

export interface PreparedExperience {
  readonly from: ResolvedExperience | undefined;
  readonly to: ResolvedExperience;
  readonly delta: ETPExperienceDelta;
  readonly affected: readonly DependencyNodeId[];
  readonly resources: readonly ResourceReference[];
}

export type TransitionStatus = "PREPARING" | "READY" | "TRANSITIONING" | "COMMITTED" | "FAILED" | "STALE";

export interface TransitionTransaction {
  readonly requestId: number;
  readonly request: ExperienceRequest;
  readonly from: ResolvedExperience | undefined;
  readonly to: ResolvedExperience;
  readonly delta: ETPExperienceDelta;
  readonly affected: readonly DependencyNodeId[];
  readonly prepared: PreparedExperience;
  readonly status: TransitionStatus;
}

export interface ETPCommitResult {
  readonly committed: boolean;
  readonly stale: boolean;
  readonly experience: ResolvedExperience;
}

export function resourceKey(resource: ResourceReference): string {
  return `${resource.kind}:${resource.id}@${resource.version ?? "0"}`;
}

export function diffSnapshots(
  previous: ResolvedExperience | undefined,
  next: ResolvedExperience,
): ETPExperienceDelta {
  const prev = previous;
  const changedKeys: string[] = [];
  const cultureChanged = !!prev && prev.request.culture !== next.request.culture;
  const themeChanged = !!prev && prev.request.theme !== next.request.theme;
  const motionChanged = !!prev && prev.request.motion !== next.request.motion;

  if (!prev) {
    return {
      from: "<none>", to: next.id,
      culture: { request: undefined, locale: undefined, direction: undefined, formattingKeys: Object.keys(next.formatting), typographyKeys: Object.keys(next.typography) },
      theme: { request: undefined, tokenKeys: Object.keys(next.tokens), componentKeys: [] },
      motion: { request: undefined, strategy: undefined },
      tokens: { changed: Object.fromEntries(Object.entries(next.tokens).map(([k, v]) => [k, { from: undefined, to: v }])) },
      components: { changed: {} },
      resources: { added: next.resources, removed: [], retained: [] },
      changedKeys: ["culture", "theme", "motion", "direction", "locale", ...Object.keys(next.tokens).map((k) => `token:${k}`)],
    };
  }

  if (cultureChanged) changedKeys.push("culture");
  if (themeChanged) changedKeys.push("theme");
  if (motionChanged) changedKeys.push("motion");
  if (prev.locale !== next.locale) changedKeys.push("locale");
  if (prev.direction !== next.direction) changedKeys.push("direction");

  const tokenChanged: Record<string, DeltaValue<unknown>> = {};
  for (const key of new Set([...Object.keys(prev.tokens), ...Object.keys(next.tokens)])) {
    if (prev.tokens[key] !== next.tokens[key]) {
      tokenChanged[key] = { from: prev.tokens[key], to: next.tokens[key] };
      changedKeys.push(`token:${key}`);
    }
  }

  const componentChanged: Record<string, DeltaValue<unknown>> = {};
  const prevComponents = (prev as ResolvedExperience & { components?: Record<string, unknown> }).components ?? {};
  const nextComponents = (next as ResolvedExperience & { components?: Record<string, unknown> }).components ?? {};
  for (const key of new Set([...Object.keys(prevComponents), ...Object.keys(nextComponents)])) {
    if (JSON.stringify(prevComponents[key]) !== JSON.stringify(nextComponents[key])) {
      componentChanged[key] = { from: prevComponents[key], to: nextComponents[key] };
      changedKeys.push(`component:${key}`);
    }
  }

  const prevResources = new Map(prev.resources.map((r) => [resourceKey(r), r]));
  const nextResources = new Map(next.resources.map((r) => [resourceKey(r), r]));
  const added = [...nextResources.entries()].filter(([k]) => !prevResources.has(k)).map(([, r]) => r);
  const removed = [...prevResources.entries()].filter(([k]) => !nextResources.has(k)).map(([, r]) => r);
  const retained = [...nextResources.entries()].filter(([k]) => prevResources.has(k)).map(([, r]) => r);

  return {
    from: prev.id,
    to: next.id,
    culture: { request: cultureChanged ? { from: prev.request.culture, to: next.request.culture } : undefined, locale: prev.locale !== next.locale ? { from: prev.locale, to: next.locale } : undefined, direction: prev.direction !== next.direction ? { from: prev.direction, to: next.direction } : undefined, formattingKeys: changedObjectKeys(prev.formatting, next.formatting), typographyKeys: changedObjectKeys(prev.typography, next.typography) },
    theme: { request: themeChanged ? { from: prev.request.theme, to: next.request.theme } : undefined, tokenKeys: Object.keys(tokenChanged), componentKeys: Object.keys(componentChanged) },
    motion: { request: motionChanged ? { from: prev.request.motion, to: next.request.motion } : undefined, strategy: prev.motion.defaultStrategy !== next.motion.defaultStrategy ? { from: prev.motion.defaultStrategy ?? "instant", to: next.motion.defaultStrategy ?? "instant" } : undefined },
    tokens: { changed: tokenChanged },
    components: { changed: componentChanged },
    resources: { added, removed, retained },
    changedKeys,
  };
}

function changedObjectKeys(a: Record<string, unknown>, b: Record<string, unknown>): string[] {
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((key) => JSON.stringify(a[key]) !== JSON.stringify(b[key]));
}

export function createDependencyGraph(from: ResolvedExperience | undefined, to: ResolvedExperience, delta: ETPExperienceDelta): DependencyGraph {
  const nodes = new Map<DependencyNodeId, DependencyNode>();
  const edges = new Map<DependencyNodeId, readonly DependencyNodeId[]>();
  const add = (id: string, kind: DependencyNodeKind) => {
    if (!nodes.has(id)) nodes.set(id, { id, kind });
  };
  const link = (source: string, target: string) => {
    const current = edges.get(source) ?? [];
    if (!current.includes(target)) edges.set(source, [...current, target]);
  };

  add(`culture:${to.request.culture}`, "dimension");
  add(`theme:${to.request.theme}`, "dimension");
  add(`motion:${to.request.motion}`, "dimension");
  add(`direction:${to.direction}`, "property");
  add(`locale:${to.locale}`, "property");
  link(`culture:${to.request.culture}`, `direction:${to.direction}`);
  link(`culture:${to.request.culture}`, `locale:${to.locale}`);

  for (const key of Object.keys(to.tokens)) {
    const token = `token:${key}`;
    add(token, "token");
    link(`theme:${to.request.theme}`, token);
  }
  for (const resource of to.resources) {
    const resourceId = `resource:${resourceKey(resource)}`;
    add(resourceId, "resource");
    if (resource.kind === "translation" || resource.kind === "font") link(`culture:${to.request.culture}`, resourceId);
    else link(`theme:${to.request.theme}`, resourceId);
  }
  add(`motion:${to.request.motion}`, "motion");
  if (delta.motion.request) add(`motion:${to.request.motion}`, "motion");
  if (from) {
    for (const key of delta.tokens.changed ? Object.keys(delta.tokens.changed) : []) link(`theme:${to.request.theme}`, `token:${key}`);
  }
  return { nodes, edges };
}

export function seedNodes(delta: ETPExperienceDelta, to: ResolvedExperience): DependencyNodeId[] {
  const seeds = new Set<DependencyNodeId>();
  if (delta.culture.request) seeds.add(`culture:${to.request.culture}`);
  if (delta.theme.request) seeds.add(`theme:${to.request.theme}`);
  if (delta.motion.request) seeds.add(`motion:${to.request.motion}`);
  for (const key of Object.keys(delta.tokens.changed)) seeds.add(`token:${key}`);
  for (const resource of delta.resources.added) seeds.add(`resource:${resourceKey(resource)}`);
  return [...seeds];
}

export function dependencyClosure(graph: DependencyGraph, seeds: readonly DependencyNodeId[]): readonly DependencyNodeId[] {
  const visited = new Set<DependencyNodeId>();
  const queue = [...seeds];
  while (queue.length) {
    const node = queue.shift()!;
    if (visited.has(node)) continue;
    visited.add(node);
    for (const child of graph.edges.get(node) ?? []) queue.push(child);
  }
  return [...visited].sort();
}
