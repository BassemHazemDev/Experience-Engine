import type { Messages } from "./en-US";

const messages: Messages = {
  brand: "نوفا كوميرس",
  demoData: "بيانات تجريبية",
  search: "ابحث في الطلبات والعملاء…",
  notifications: "الإشعارات",
  account: { name: "مايا كولينز", role: "مالكة المتجر" },
  nav: {
    label: "القائمة الرئيسية",
    overview: "نظرة عامة",
    orders: "الطلبات",
    products: "المنتجات",
    customers: "العملاء",
    analytics: "التحليلات",
    settings: "الإعدادات",
  },
  hero: {
    title: "صباح الخير يا مايا",
    body: "ارتفعت المبيعات هذا الأسبوع. هناك ثلاثة طلبات بانتظار مراجعتك.",
    cta: "إنشاء حملة",
    secondary: "عرض التقرير",
  },
  kpi: {
    revenue: "الإيرادات",
    orders: "الطلبات",
    conversion: "معدل التحويل",
    aov: "متوسط قيمة الطلب",
    vsLastWeek: "مقارنة بالأسبوع الماضي",
  },
  chart: { title: "الإيرادات", range: "آخر ١٢ أسبوعًا", week: "الأسبوع" },
  table: {
    title: "أحدث الطلبات",
    order: "الطلب",
    customer: "العميل",
    date: "التاريخ",
    status: "الحالة",
    total: "الإجمالي",
    viewAll: "عرض كل الطلبات",
  },
  status: { paid: "مدفوع", pending: "قيد الانتظار", shipped: "تم الشحن", refunded: "مُسترد" },
  customers: ["ليلى حسن", "عمر السيد", "نور عبد الله", "يوسف إبراهيم", "سارة محمود"],
  activity: {
    title: "النشاط",
    items: [
      "ليلى حسن أنشأت طلبًا جديدًا",
      "المخزون منخفض لمنتج «غطاء كتان»، تبقّى ٤ قطع",
      "تم تحويل المستحقات إلى حسابك البنكي",
      "عمر السيد طلب استرداد المبلغ",
    ],
  },
  system: { title: "حالة المتجر", online: "واجهة المتجر تعمل", payments: "المدفوعات مفعّلة", sync: "تأخر في مزامنة المخزون" },
};

export default messages;
