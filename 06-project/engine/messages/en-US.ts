const messages = {
  brand: "Nova Commerce",
  demoData: "Demo data",
  search: "Search orders, customers…",
  notifications: "Notifications",
  account: { name: "Maya Collins", role: "Store owner" },
  nav: {
    label: "Main",
    overview: "Overview",
    orders: "Orders",
    products: "Products",
    customers: "Customers",
    analytics: "Analytics",
    settings: "Settings",
  },
  hero: {
    title: "Good morning, Maya",
    body: "Sales are up this week. Three orders are waiting for your review.",
    cta: "Create campaign",
    secondary: "View report",
  },
  kpi: {
    revenue: "Revenue",
    orders: "Orders",
    conversion: "Conversion",
    aov: "Average order",
    vsLastWeek: "vs last week",
  },
  chart: { title: "Revenue", range: "Last 12 weeks", week: "Week" },
  table: {
    title: "Recent orders",
    order: "Order",
    customer: "Customer",
    date: "Date",
    status: "Status",
    total: "Total",
    viewAll: "View all orders",
  },
  status: { paid: "Paid", pending: "Pending", shipped: "Shipped", refunded: "Refunded" },
  customers: ["Olivia Bennett", "Noah Ramirez", "Emma Clarke", "Liam Foster", "Ava Mitchell"],
  activity: {
    title: "Activity",
    items: [
      "Olivia Bennett placed a new order",
      "Stock is low on Linen Throw, 4 left",
      "Payout sent to your bank account",
      "Noah Ramirez asked for a refund",
    ],
  },
  system: { title: "Store status", online: "Storefront online", payments: "Payments active", sync: "Inventory sync delayed" },
};

export type Messages = typeof messages;
export default messages;
