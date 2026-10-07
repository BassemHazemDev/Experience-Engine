import { createDependencyGraph, seedNodes, type TransitionTransaction } from "@experience-engine/core";
import { ProvenanceTag } from "@/components/ui/primitives";

const DIMENSIONS = ["culture", "theme", "motion"] as const;

const short = (id: string) =>
  id
    .replace(/^resource:/, "")
    .replace(/^token:/, "")
    .replace(/@.*$/, "");

/**
 * The dependency graph the engine builds for one transition, with the
 * prepared closure highlighted. Nodes outside the closure were left alone.
 */
export function DependencyGraph({ transaction }: { transaction: TransitionTransaction }) {
  const graph = createDependencyGraph(transaction.from, transaction.to, transaction.delta);
  const affected = new Set(transaction.affected);
  const seeds = new Set(seedNodes(transaction.delta, transaction.to));
  const total = graph.nodes.size;

  return (
    <div className="graph">
      <div className="graph-summary">
        <p>
          <strong>
            {affected.size} of {total}
          </strong>{" "}
          nodes are in the prepared closure. The rest were not touched.
        </p>
        <ProvenanceTag kind="engine">Built by the engine for this transition</ProvenanceTag>
      </div>

      <div className="graph-tree" role="tree" aria-label="Dependency graph">
        <div className="graph-root" role="treeitem" aria-expanded="true">
          <span className="graph-node graph-node-root">Experience</span>
          <code>{transaction.to.id}</code>
        </div>

        {DIMENSIONS.map((dim) => {
          const id = `${dim}:${transaction.to.request[dim]}`;
          const children = graph.edges.get(id) ?? [];
          const groups = {
            property: children.filter((child) => graph.nodes.get(child)?.kind === "property"),
            resource: children.filter((child) => graph.nodes.get(child)?.kind === "resource"),
            token: children.filter((child) => graph.nodes.get(child)?.kind === "token"),
          };
          return (
            <div key={dim} className="graph-branch" data-dim={dim} role="treeitem" aria-expanded="true">
              <Node id={id} label={id} affected={affected.has(id)} seed={seeds.has(id)} dimension />
              <div className="graph-children" role="group">
                {children.length === 0 && <span className="graph-empty">No dependents in this graph</span>}
                {(["property", "resource", "token"] as const).map(
                  (kind) =>
                    groups[kind].length > 0 && (
                      <div key={kind} className="graph-group">
                        <span className="graph-group-label">
                          {kind === "property" ? "Properties" : kind === "resource" ? "Resources" : "Tokens"}
                        </span>
                        <div className="graph-chips">
                          {groups[kind].map((child) => (
                            <Node key={child} id={child} label={short(child)} affected={affected.has(child)} seed={seeds.has(child)} />
                          ))}
                        </div>
                      </div>
                    ),
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ul className="graph-legend">
        <li>
          <span className="graph-node" data-affected="true" data-dim="theme">
            in closure
          </span>
          prepared for this transition
        </li>
        <li>
          <span className="graph-node">untouched</span>
          outside the closure
        </li>
        <li>
          <span className="graph-node" data-affected="true" data-seed="true" data-dim="theme">
            seed
          </span>
          where the closure starts
        </li>
      </ul>
      <p className="note">The “Experience” root is added here for orientation; the engine’s graph starts at the three dimensions.</p>
    </div>
  );
}

function Node({ id, label, affected, seed, dimension }: { id: string; label: string; affected: boolean; seed: boolean; dimension?: boolean }) {
  return (
    <span
      className={dimension ? "graph-node graph-node-dimension" : "graph-node"}
      data-affected={affected}
      data-seed={seed}
      title={`${id}${affected ? " · in closure" : " · untouched"}${seed ? " · seed" : ""}`}
    >
      <span className="graph-node-state" aria-hidden="true">
        {affected ? "●" : "○"}
      </span>
      {label}
      <span className="sr-only">{affected ? ", in closure" : ", untouched"}</span>
    </span>
  );
}
