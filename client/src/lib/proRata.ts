// client/src/lib/proRata.ts
// ============================================================================
// Minimal pro-rata (نسبة وتناسب) logic using full invoice for THIS month.
// Inputs: activation date, full invoice (net), anchor day (default 15), lang
// Outputs: monthly (usual), proAmount (for this month), nice script (AR/EN)
// ============================================================================

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

export interface ProResult {
  invoiceNet: number; // قيمة فاتورة هذا الشهر (صافي)
  monthlyNet: number; // الاشتراك الشهري المعتاد (صافي)
  proAmountNet: number; // قيمة النسبة والتناسب لهذا الشهر
  ratio: number; // proDays / cycleDays
  proDays: number; // أيام النسبة والتناسب
  cycleDays: number; // أيام الدورة
  activationUTC: Date;
  periodStartUTC: Date; // = activation
  periodEndUTC: Date; // = first anchor after activation
  nextPeriodEndUTC: Date; // = periodEnd + 1 cycle
}

/**
 * computeFromFullInvoice
 * يأخذ قيمة الفاتورة الحالية (شاملة النسبة والتناسب) + تاريخ التفعيل
 * ويحسِب الاشتراك الشهري المعتاد وقيمة النسبة والتناسب.
 */
export function computeFromFullInvoice(
  invoiceNet: number,
  activation: string | Date,
  anchorDay = 15
): ProResult {
  if (!Number.isFinite(invoiceNet) || invoiceNet <= 0) {
    throw new Error("invoiceNet must be a positive number");
  }
  const act =
    activation instanceof Date
      ? toUtcMidnight(activation)
      : toUtcMidnight(new Date(activation + "T00:00:00Z"));

  const end = firstAnchorAfterActivation(act, anchorDay);
  const startCycle = addMonthsUTC(end, -1, anchorDay);

  const cycleDays = Math.max(0, daysBetween(startCycle, end));
  const proDays = Math.max(0, Math.min(cycleDays, daysBetween(act, end)));
  const ratio = cycleDays === 0 ? 0 : proDays / cycleDays;

  // invoice = monthly * (1 + ratio) => monthly = invoice / (1 + ratio)
  const monthlyNet = invoiceNet / (1 + ratio);
  const proAmountNet = monthlyNet * ratio;

  const nextEnd = addMonthsUTC(end, 1, anchorDay);

  return {
    invoiceNet,
    monthlyNet,
    proAmountNet,
    ratio,
    proDays,
    cycleDays,
    activationUTC: act,
    periodStartUTC: act,
    periodEndUTC: end,
    nextPeriodEndUTC: nextEnd,
  };
}

/** نص جاهز للنسخ (AR/EN) */
export function buildScriptFromFullInvoice(o: ProResult, lang: Lang): string {
  const start = dmy(o.periodStartUTC);
  const end = dmy(o.periodEndUTC);
  const next = dmy(o.nextPeriodEndUTC);

  const invoice = `JD ${fmt3(o.invoiceNet)}${LRM}`;
  const monthly = `JD ${fmt3(o.monthlyNet)}${LRM}`;
  const pro = `JD ${fmt3(o.proAmountNet)}${LRM}`;

  if (lang === "ar") {
    return `أوضّح لحضرتك أن **قيمة فاتورة هذا الشهر هي ${invoice}**. تتضمن هذه الفاتورة **نسبة وتناسب بقيمة ${pro}** عن المدة من ${start} حتى ${end}، إضافةً إلى **قيمة الاشتراك الأساسية لهذا الشهر ${monthly}** عن المدة من ${end} حتى ${next}. ابتداءً من الفاتورة القادمة ستصدر القيمة الشهرية كما تم الاتفاق (${monthly}). تاريخ إصدار الفاتورة: ${end}.`;
  }

  return `Just to clarify, **this month's invoice is ${invoice}**. It includes a **proration of ${pro}** for the period from ${start} to ${end}, plus the **base subscription for this month of ${monthly}** covering ${end} to ${next}. Starting next invoice, the monthly amount will be ${monthly}. Invoice date: ${end}.`;
}
