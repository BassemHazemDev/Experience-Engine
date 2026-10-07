import type { GateStatus } from "@/lib/evidence";

const STATUS: Record<GateStatus, { label: string; mark: string }> = {
  PASS: { label: "PASS", mark: "✓" },
  PASS_WITH_SCOPE: { label: "PASS_WITH_SCOPE", mark: "◐" },
  PENDING: { label: "PENDING", mark: "…" },
  NOT_CLAIMED: { label: "NOT CLAIMED", mark: "—" },
};

export function StatusBadge({ status }: { status: GateStatus }) {
  return (
    <span className="gate" data-status={status}>
      <span aria-hidden="true">{STATUS[status].mark}</span>
      {STATUS[status].label}
    </span>
  );
}
