// Demo data for the fictional Nova Commerce store. Amounts are shown in the
// resolved culture's currency without conversion; none of it is real.

export type OrderStatus = "paid" | "pending" | "shipped" | "refunded";

export interface Order {
  readonly id: string;
  readonly customer: number; // index into the culture's customer names
  readonly date: string;
  readonly status: OrderStatus;
  readonly total: number;
}

export const ORDERS: readonly Order[] = [
  { id: "4821", customer: 0, date: "2026-10-06", status: "paid", total: 1280 },
  { id: "4820", customer: 1, date: "2026-10-06", status: "refunded", total: 340 },
  { id: "4819", customer: 2, date: "2026-10-05", status: "shipped", total: 2115 },
  { id: "4818", customer: 3, date: "2026-10-05", status: "pending", total: 760 },
  { id: "4817", customer: 4, date: "2026-10-04", status: "paid", total: 1490 },
];

export const WEEKLY_REVENUE = [18, 22, 21, 27, 25, 31, 29, 36, 34, 41, 39, 47];

export const KPIS = [
  { key: "revenue", value: 48250, change: 0.124, format: "currency" },
  { key: "orders", value: 1284, change: 0.081, format: "number" },
  { key: "conversion", value: 0.036, change: -0.004, format: "percent" },
  { key: "aov", value: 96, change: 0.021, format: "currency" },
] as const;

export const ACTIVITY_TIMES = ["2026-10-06", "2026-10-06", "2026-10-05", "2026-10-05"];
