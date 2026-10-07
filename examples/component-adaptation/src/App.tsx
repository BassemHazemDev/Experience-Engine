import type { ComponentType, ReactNode } from "react";
import { useExperience } from "@experience-engine/react";
import { components, type Theme } from "./experience";

const ORDERS = [
  { id: "4821", customer: "Olivia Bennett", total: "$1,280" },
  { id: "4820", customer: "Noah Ramirez", total: "$340" },
];

function Button({ children }: { children?: ReactNode }) {
  return <button style={{ borderRadius: "var(--radius)", padding: "8px 14px" }}>{children}</button>;
}

function PillButton({ children }: { children?: ReactNode }) {
  return <button style={{ borderRadius: 999, padding: "8px 20px", fontWeight: 700 }}>{children}</button>;
}

function OrdersTable() {
  return (
    <table cellPadding={8}>
      <tbody>
        {ORDERS.map((order) => (
          <tr key={order.id}>
            <td>#{order.id}</td>
            <td>{order.customer}</td>
            <td>{order.total}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function OrdersList() {
  return (
    <ul>
      {ORDERS.map((order) => (
        <li key={order.id}>
          {order.customer} — {order.total}
        </li>
      ))}
    </ul>
  );
}

// The resolver returns a component name; the application decides what that name renders.
const registry: Record<string, ComponentType<{ children?: ReactNode }>> = { Button, PillButton, OrdersTable, OrdersList };

export function App() {
  const { experience, setTheme } = useExperience();
  if (!experience) return null;
  const { tokens } = experience;

  const button = components.resolve("Button", { variant: String(tokens["component.button"]) });
  const orders = components.resolve("OrdersTable", { replacement: String(tokens["component.orders"]) });
  const ButtonComponent = registry[button.component];
  const OrdersComponent = registry[orders.component];

  return (
    <main style={{ padding: 32, fontFamily: "system-ui, sans-serif", ["--radius" as string]: `${tokens.radius}px` }}>
      <p>
        {(["comfortable", "rounded", "compact"] as Theme[]).map((theme) => (
          <button key={theme} onClick={() => void setTheme(theme).catch(() => undefined)} aria-pressed={experience.request.theme === theme}>
            {theme}
          </button>
        ))}
      </p>

      <section style={{ display: "grid", gap: Number(tokens.gap), border: "1px solid #ccc", borderRadius: "var(--radius)", padding: 16 }}>
        <ButtonComponent>Create order</ButtonComponent>
        <OrdersComponent />
      </section>

      <pre>
        Button      → {button.mode} ({button.component}){"\n"}
        OrdersTable → {orders.mode} ({orders.component}){"\n"}
        radius      → token ({String(tokens.radius)}px)
      </pre>
    </main>
  );
}
