import type { ResolvedExperience } from "@experience-engine/core";

export interface Formatters {
  currency(value: number): string;
  number(value: number): string;
  percent(value: number): string;
  date(iso: string): string;
}

/** Everything here derives from the resolved culture; nothing checks a culture id. */
export function createFormatters(experience: ResolvedExperience): Formatters {
  const formatting = experience.formatting as { currency?: string; numberingSystem?: string; dateStyle?: string };
  const locale = `${experience.locale}-u-nu-${formatting.numberingSystem ?? "latn"}`;

  const currency = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: formatting.currency ?? "USD",
    maximumFractionDigits: 0,
  });
  const number = new Intl.NumberFormat(locale);
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });
  const date = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" });

  return {
    currency: (value) => currency.format(value),
    number: (value) => number.format(value),
    percent: (value) => percent.format(value),
    date: (iso) => date.format(new Date(iso)),
  };
}
