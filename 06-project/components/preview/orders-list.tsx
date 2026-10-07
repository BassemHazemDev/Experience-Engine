import { ORDERS } from "./data";
import { StatusBadge, type OrdersProps } from "./orders";

/**
 * Replacement for OrdersTable. This module is its own chunk: a theme that asks
 * for it lists it as a `code` resource, so the engine loads it before commit.
 */
export default function OrdersList({ messages, format }: OrdersProps) {
  return (
    <ul className="xp-orders-list" data-component="OrdersList">
      {ORDERS.map((order) => (
        <li key={order.id}>
          <div>
            <span className="xp-orders-list-name">{messages.customers[order.customer]}</span>
            <span className="xp-orders-list-meta">
              <bdi className="xp-code">#{order.id}</bdi>
              <span suppressHydrationWarning>{format.date(order.date)}</span>
            </span>
          </div>
          <div className="xp-orders-list-end">
            <span className="xp-num" suppressHydrationWarning>
              {format.currency(order.total)}
            </span>
            <StatusBadge status={order.status} messages={messages} />
          </div>
        </li>
      ))}
    </ul>
  );
}
