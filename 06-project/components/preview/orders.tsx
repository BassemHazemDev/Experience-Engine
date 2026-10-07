import type { Messages } from "@/engine/messages";
import type { Formatters } from "@/lib/format";
import { ORDERS, type OrderStatus } from "./data";

export interface OrdersProps {
  readonly messages: Messages;
  readonly format: Formatters;
}

export function StatusBadge({ status, messages }: { status: OrderStatus; messages: Messages }) {
  return (
    <span className="xp-status" data-status={status}>
      <span className="xp-status-mark" aria-hidden="true" />
      {messages.status[status]}
    </span>
  );
}

/** Base component: a full data table. */
export function OrdersTable({ messages, format }: OrdersProps) {
  const t = messages.table;
  return (
    <table className="xp-table" data-component="OrdersTable">
      <thead>
        <tr>
          <th scope="col">{t.order}</th>
          <th scope="col">{t.customer}</th>
          <th scope="col">{t.date}</th>
          <th scope="col">{t.status}</th>
          <th scope="col" className="xp-num">
            {t.total}
          </th>
        </tr>
      </thead>
      <tbody>
        {ORDERS.map((order) => (
          <tr key={order.id}>
            <td>
              <bdi className="xp-code">#{order.id}</bdi>
            </td>
            <td>{messages.customers[order.customer]}</td>
            <td suppressHydrationWarning>{format.date(order.date)}</td>
            <td>
              <StatusBadge status={order.status} messages={messages} />
            </td>
            <td className="xp-num" suppressHydrationWarning>
              {format.currency(order.total)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
