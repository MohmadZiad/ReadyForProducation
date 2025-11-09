// client/src/lib/proRata.ts
// ============================================================================
// Minimal pro-rata (نسبة وتناسب) logic using configurable monthly values.
// Inputs: activation date, anchor day (default 15), and monthly net amount
// Outputs: monthly (usual), proAmount (for this month), period summary
// ============================================================================

import { translations } from "./i18n";

export type Lang = "ar" | "en";

const DAY_MS = 24 * 60 * 60 * 1000;
const LRM = "\u200E";

function toUtcMidnight(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
}
function utcDate(y: number, mZero: number, d: number): Date {
  return new Date(Date.UTC(y, mZero, d));
}
function lastDayOfMonth(y: number, mZero: number): number {
  return new Date(Date.UTC(y, mZero + 1, 0)).getUTCDate();
}
function clampDay(y: number, mZero: number, d: number): number {
  const last = lastDayOfMonth(y, mZero);
  return Math.max(1, Math.min(d, last));
}
function addMonthsUTC(base: Date, months: number, keepDay?: number): Date {
  const y = base.getUTCFullYear();
  const m = base.getUTCMonth();
  const d = keepDay ?? base.getUTCDate();
  const targetMonth = m + months;
  const targetYear = y + Math.floor(targetMonth / 12);
  const normMonth = ((targetMonth % 12) + 12) % 12;
  const dd = clampDay(targetYear, normMonth, d);
  return utcDate(targetYear, normMonth, dd);
}
function ymd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = `${d.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${d.getUTCDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function dmy(d: Date): string {
  const y = d.getUTCFullYear();
  const m = `${d.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${d.getUTCDate()}`.padStart(2, "0");
  return `${day}-${m}-${y}`;
}
function daysBetween(a: Date, b: Date): number {
  const A = toUtcMidnight(a).getTime();
  const B = toUtcMidnight(b).getTime();
  return Math.round((B - A) / DAY_MS);
}
function monthAnchorUTC(y: number, mZero: number, anchorDay = 15): Date {
  return utcDate(y, mZero, clampDay(y, mZero, anchorDay));
}
function firstAnchorAfterActivation(act: Date, anchorDay = 15): Date {
  const A = toUtcMidnight(act);
  const y = A.getUTCFullYear();
  const m = A.getUTCMonth();
  const thisAnchor = monthAnchorUTC(y, m, anchorDay);
  // Anchor end = أول 15 يأتي بعد/عند التفعيل
  return A.getUTCDate() >= clampDay(y, m, anchorDay)
    ? addMonthsUTC(thisAnchor, 1, anchorDay)
    : thisAnchor;
}

export function fmt3(n: number): string {
  return n.toFixed(3);
}

export interface PeriodResult {
  ratio: number; // proDays / cycleDays
  proDays: number; // أيام النسبة والتناسب
  cycleDays: number; // أيام الدورة
  activationUTC: Date;
  periodStartUTC: Date; // = activation
  cycleStartUTC: Date; // بداية دورة الفوترة
  periodEndUTC: Date; // = first anchor after activation
  nextPeriodEndUTC: Date; // = periodEnd + 1 cycle
}

export interface ProResult extends PeriodResult {
  invoiceNet: number; // قيمة فاتورة هذا الشهر (صافي)
  monthlyNet: number; // الاشتراك الشهري المعتاد (صافي)
  proAmountNet: number; // قيمة النسبة والتناسب لهذا الشهر
}

function computePeriod(
  activation: string | Date,
  anchorDay = 15
): PeriodResult {
  const act =
    activation instanceof Date
      ? toUtcMidnight(activation)
      : toUtcMidnight(new Date(activation + "T00:00:00Z"));

  const end = firstAnchorAfterActivation(act, anchorDay);
  const cycleStart = addMonthsUTC(end, -1, anchorDay);

  const cycleDays = Math.max(0, daysBetween(cycleStart, end));
  const proDays = Math.max(0, Math.min(cycleDays, daysBetween(act, end)));
  const ratio = cycleDays === 0 ? 0 : proDays / cycleDays;

  const nextEnd = addMonthsUTC(end, 1, anchorDay);

  return {
    ratio,
    proDays,
    cycleDays,
    activationUTC: act,
    periodStartUTC: act,
    cycleStartUTC: cycleStart,
    periodEndUTC: end,
    nextPeriodEndUTC: nextEnd,
  };
}

export function computeFromFullInvoice(
  invoiceNet: number,
  activation: string | Date,
  anchorDay = 15
): ProResult {
  if (!Number.isFinite(invoiceNet) || invoiceNet <= 0) {
    throw new Error("invoiceNet must be a positive number");
  }

  const period = computePeriod(activation, anchorDay);

  // invoice = monthly * (1 + ratio) => monthly = invoice / (1 + ratio)
  const monthlyNet = invoiceNet / (1 + period.ratio);
  const proAmountNet = monthlyNet * period.ratio;

  return {
    ...period,
    invoiceNet,
    monthlyNet,
    proAmountNet,
  };
}

export function computeFromMonthly(
  monthlyNet: number,
  activation: string | Date,
  anchorDay = 15
): ProResult {
  if (!Number.isFinite(monthlyNet) || monthlyNet < 0) {
    throw new Error("monthlyNet must be a non-negative number");
  }

  const period = computePeriod(activation, anchorDay);
  const proAmountNet = monthlyNet * period.ratio;
  const invoiceNet = monthlyNet + proAmountNet;

  return {
    ...period,
    invoiceNet,
    monthlyNet,
    proAmountNet,
  };
}

export function formatDateForLang(date: Date, lang: Lang): string {
  const locale = lang === "ar" ? "ar-JO" : "en-GB";
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  });
}

export interface ScriptAddonInfo {
  label: string;
  price: number;
}

export interface ScriptBundle {
  main: string;
  addOnLines: string[];
  allInclusiveNote: string;
  callMode: string;
  combined: string;
  addOnsList: string;
  addOnsListOrNone: string;
}

function formatTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/{{\s*([^}]+?)\s*}}/g, (match, key) => {
    const trimmed = key.trim();
    return trimmed in values ? values[trimmed] : match;
  });
}

/** نص جاهز للنسخ (AR/EN) */
export function buildScriptFromFullInvoice(
  o: ProResult,
  lang: Lang,
  options: { product: string; anchorDay: number; addOns: ScriptAddonInfo[] }
): ScriptBundle {
  const start = dmy(o.periodStartUTC);
  const activation = dmy(o.activationUTC);
  const end = dmy(o.periodEndUTC);
  const next = dmy(o.nextPeriodEndUTC);

  const invoice = `JD ${fmt3(o.invoiceNet)}${LRM}`;
  const monthly = `JD ${fmt3(o.monthlyNet)}${LRM}`;
  const pro = `JD ${fmt3(o.proAmountNet)}${LRM}`;

  const product = options.product || (lang === "ar" ? "—" : "—");
  const anchorDay = `${options.anchorDay}`;

  const addOnEntries = options.addOns.map((addon) => ({
    label: addon.label,
    priceDisplay: `JD ${fmt3(addon.price)}${LRM}`,
  }));

  const addOnsList = addOnEntries.length
    ? addOnEntries
        .map((entry) => `${entry.label} (${entry.priceDisplay.replace(LRM, "")})`)
        .join(lang === "ar" ? "، " : ", ")
    : translations[lang].proRataNoAddOns;

  const values: Record<string, string> = {
    product,
    anchorDay,
    activationDate: activation,
    periodStart: start,
    periodEnd: end,
    nextPeriodEnd: next,
    ratio: `${(o.ratio * 100).toFixed(2)}%`,
    monthlyNet: monthly,
    proRata: pro,
    firstInvoice: invoice,
    addOnsList,
    addOnsListOrNone: addOnsList,
  };

  const main = formatTemplate(translations[lang].script.main, values);
  const callMode = formatTemplate(translations[lang].script.callMode, values);
  const addOnLines = addOnEntries.map((entry) =>
    formatTemplate(translations[lang].script.addonLine, {
      ...values,
      label: entry.label,
      price: entry.priceDisplay.replace(LRM, ""),
    })
  );
  const allInclusiveNote = formatTemplate(
    translations[lang].script.allInclusiveNote,
    values
  );

  const combined = [main, ...addOnLines, allInclusiveNote]
    .filter(Boolean)
    .join("\n\n");

  return {
    main,
    addOnLines,
    allInclusiveNote,
    callMode,
    combined,
    addOnsList,
    addOnsListOrNone: addOnsList,
  };
}
