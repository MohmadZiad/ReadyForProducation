// client/src/lib/proRata.ts
// ============================================================================
// Minimal pro-rata (نسبة وتناسب) logic using configurable monthly values.
// Inputs: activation date, anchor day (default 15), and monthly net amount
// Outputs: monthly (usual), proAmount (for this month), period summary
// ============================================================================

import { translations } from "./i18n";

export const VAT_RATE = 0.16;

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

export interface AddOnBreakdown {
  id?: string;
  label?: string;
  addonBeforeTax: number;
  addonVAT: number;
  addonAfterTax: number;
}

export interface ProResult extends PeriodResult {
  invoiceNet: number;
  monthlyNet: number;
  proAmountNet: number;
  productId?: string;
  monthlyBeforeTax?: number;
  monthlyAfterTax?: number;
  prorationBeforeTax?: number;
  prorationAfterTax?: number;
  invoiceBeforeTax?: number;
  invoiceVAT?: number;
  invoiceAfterTax?: number;
  addOnsTotalBeforeTax?: number;
  addOnsAfterTax?: number;
  addOns?: AddOnBreakdown[];
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
  anchorDay = 15,
  options?: {
    productId?: string;
    addOns?: ScriptAddonInfo[];
    prorationBasePrice?: number;
  }
): ProResult {
  if (!Number.isFinite(monthlyNet) || monthlyNet < 0) {
    throw new Error("monthlyNet must be a non-negative number");
  }

  const period = computePeriod(activation, anchorDay);
  const addOns = options?.addOns ?? [];
  const addOnsTotalBeforeTax = addOns.reduce((sum, addon) => sum + addon.price, 0);
  const addOnsBreakdown: AddOnBreakdown[] = addOns.map((addon) => ({
    id: addon.label,
    label: addon.label,
    addonBeforeTax: addon.price,
    addonVAT: addon.price * VAT_RATE,
    addonAfterTax: addon.price * (1 + VAT_RATE),
  }));

  if (options?.productId === "iew") {
    const activationDate = period.activationUTC;
    const isActivationOnAnchor =
      activationDate.getUTCDate() ===
      clampDay(
        activationDate.getUTCFullYear(),
        activationDate.getUTCMonth(),
        anchorDay
      );

    const periodForCalc = isActivationOnAnchor
      ? { ...period, ratio: 0, proDays: 0 }
      : period;

    const baseBeforeTax = monthlyNet;

    const prorationBeforeTax = baseBeforeTax * periodForCalc.ratio;
    const monthlyAfterTax = baseBeforeTax * (1 + VAT_RATE);
    const prorationAfterTax = prorationBeforeTax * (1 + VAT_RATE);
    const addOnsAfterTax = addOnsTotalBeforeTax * (1 + VAT_RATE);
    const invoiceBeforeTax =
      baseBeforeTax + prorationBeforeTax + addOnsTotalBeforeTax;
    const invoiceVAT = invoiceBeforeTax * VAT_RATE;
    const invoiceAfterTax = invoiceBeforeTax + invoiceVAT;

    return {
      ...periodForCalc,
      productId: options.productId,
      monthlyBeforeTax: baseBeforeTax,
      monthlyAfterTax,
      prorationBeforeTax,
      prorationAfterTax,
      invoiceBeforeTax,
      invoiceVAT,
      invoiceAfterTax,
      addOnsTotalBeforeTax,
      addOnsAfterTax,
      addOns: addOnsBreakdown,
      invoiceNet: invoiceAfterTax,
      monthlyNet: monthlyAfterTax,
      proAmountNet: prorationAfterTax,
    };
  }

  const isAdslOrFiber =
    options?.productId === "adsl" || options?.productId === "ftth";

  if (isAdslOrFiber) {
    const prorationBaseBeforeTax = Number.isFinite(options?.prorationBasePrice)
      ? (options?.prorationBasePrice as number)
      : monthlyNet;

    const prorataRatio = period.proDays / 30;
    const prorationBeforeTax = prorationBaseBeforeTax * prorataRatio;
    const monthlyAfterTax = monthlyNet * (1 + VAT_RATE);
    const prorationAfterTax = prorationBeforeTax * (1 + VAT_RATE);
    const addOnsAfterTax = addOnsTotalBeforeTax * (1 + VAT_RATE);
    const invoiceBeforeTax =
      monthlyNet + prorationBeforeTax + addOnsTotalBeforeTax;
    const invoiceVAT = invoiceBeforeTax * VAT_RATE;
    const invoiceAfterTax = invoiceBeforeTax + invoiceVAT;

    return {
      ...period,
      ratio: prorataRatio,
      productId: options?.productId,
      monthlyBeforeTax: monthlyNet,
      monthlyAfterTax,
      prorationBeforeTax,
      prorationAfterTax,
      invoiceBeforeTax,
      invoiceVAT,
      invoiceAfterTax,
      addOnsTotalBeforeTax,
      addOnsAfterTax,
      addOns: addOnsBreakdown,
      invoiceNet: invoiceAfterTax,
      monthlyNet: monthlyAfterTax,
      proAmountNet: prorationAfterTax,
    };
  }

  const proAmountNet = monthlyNet * period.ratio;
  const invoiceNet = monthlyNet + proAmountNet;

  return {
    ...period,
    invoiceNet,
    monthlyNet,
    proAmountNet,
    monthlyBeforeTax: monthlyNet,
    monthlyAfterTax: monthlyNet,
    prorationBeforeTax: proAmountNet,
    prorationAfterTax: proAmountNet,
    invoiceBeforeTax: invoiceNet,
    invoiceVAT: 0,
    invoiceAfterTax: invoiceNet,
    addOnsTotalBeforeTax: 0,
    addOnsAfterTax: 0,
    addOns: [],
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
  options: {
    product: string;
    productId?: string;
    anchorDay: number;
    addOns: ScriptAddonInfo[];
  }
): ScriptBundle {
  const start = dmy(o.periodStartUTC);
  const activation = dmy(o.activationUTC);
  const end = dmy(o.periodEndUTC);
  const next = dmy(o.nextPeriodEndUTC);

  if (options.productId === "iew") {
    const monthlyAfterTax = `JD ${fmt3(o.monthlyAfterTax ?? 0)}${LRM}`;
    const prorationAfterTax = `JD ${fmt3(o.prorationAfterTax ?? 0)}${LRM}`;
    const invoiceAfterTax = `JD ${fmt3(o.invoiceAfterTax ?? o.invoiceNet)}${LRM}`;

    const addOnParts = (o.addOns ?? []).map((addon) => {
      const addonAfterTax = `JD ${fmt3(addon.addonAfterTax)}${LRM}`;
      return { label: addon.label ?? "", amount: addonAfterTax };
    });

    const addonSentenceWithProration = addOnParts.length
      ? lang === "ar"
        ? `كما تم إضافة خدمة ${addOnParts
            .map((item) => `${item.label} بقيمة ${item.amount}`)
            .join("، ")} بشكل ثابت.`
        : `Additionally, the ${addOnParts
            .map((item) => `${item.label} service for a fixed amount of ${item.amount}`)
            .join(" and ")}.`
      : "";

    const addonSentenceZero = addOnParts.length
      ? lang === "ar"
        ? `كما تم إضافة خدمة ${addOnParts
            .map((item) => `${item.label} بقيمة ${item.amount}`)
            .join("، ")}.`
        : `Additionally, the ${addOnParts
            .map((item) => `${item.label} service has been added for ${item.amount}`)
            .join(" and ")}.`
      : "";

    const hasProration = (o.prorationAfterTax ?? 0) > 0;

    const mainAr = hasProration
      ? `أوضح لحضرتك أن قيمة أول فاتورة هي **${invoiceAfterTax}** لاشتراك إنترنت في كل مكان.` +
        `\nتتضمن هذه الفاتورة نسبة تناسب بقيمة **${prorationAfterTax}** عن الفترة من **${start}** حتى **${end}**، إضافة إلى الاشتراك الشهري بقيمة **${monthlyAfterTax}**.` +
        (addonSentenceWithProration && lang === "ar"
          ? `\n${addonSentenceWithProration}`
          : "") +
        `\nمن دورة الفوترة القادمة تكون قيمة الفاتورة الشهرية هي **${monthlyAfterTax}**${
          addOnParts.length ? " بالإضافة إلى قيمة أي خدمات إضافية مفعّلة لديك." : ""
        }`
      : `أوضح لحضرتك أن قيمة أول فاتورة هي **${invoiceAfterTax}** (شامل الضريبة).` +
        `\nوهي عبارة عن الاشتراك الشهري بقيمة **${monthlyAfterTax}** عن الفترة القادمة.` +
        (addonSentenceZero && lang === "ar" ? `\n${addonSentenceZero}` : "") +
        `\nمن دورة الفوترة القادمة تكون قيمة الفاتورة الشهرية هي **${monthlyAfterTax}**${
          addOnParts.length ? " بالإضافة إلى الخدمات الإضافية." : ""
        }`;

    const mainEn = hasProration
      ? `I would like to clarify that the first invoice amount is **${invoiceAfterTax}** for the 'Internet Everywhere' subscription.` +
        `\nThis includes a prorated amount of **${prorationAfterTax}** for the period from **${start}** to **${end}**, plus the monthly subscription of **${monthlyAfterTax}**.` +
        (addonSentenceWithProration && lang === "en"
          ? `\n${addonSentenceWithProration}`
          : "") +
        `\nStarting from the next billing cycle, your monthly bill will be **${monthlyAfterTax}**${
          addOnParts.length ? " plus the cost of any active additional services." : ""
        }`
      : `I would like to clarify that the first invoice amount is **${invoiceAfterTax}** (Inc-Tax).` +
        `\nThis represents the standard monthly subscription of **${monthlyAfterTax}** for the upcoming period.` +
        (addonSentenceZero && lang === "en" ? `\n${addonSentenceZero}` : "") +
        `\nStarting from the next billing cycle, your monthly bill will be **${monthlyAfterTax}**${
          addOnParts.length ? " plus any active additional services." : ""
        }`;

    const main = lang === "ar" ? mainAr : mainEn;

    const addOnsList = addOnParts.length
      ? addOnParts
          .map((addon) => `${addon.label} (${addon.amount.replace(LRM, "")})`)
          .join(lang === "ar" ? "، " : ", ")
      : translations[lang].proRataNoAddOns;

    return {
      main,
      addOnLines: [],
      allInclusiveNote: "",
      callMode: "",
      combined: main,
      addOnsList,
      addOnsListOrNone: addOnsList,
    };
  }

  if (options.productId === "adsl" || options.productId === "ftth") {
    const monthlyAfterTax = `JD ${fmt3(o.monthlyAfterTax ?? o.monthlyNet)}${LRM}`;
    const prorationAfterTax = `JD ${fmt3(o.prorationAfterTax ?? o.proAmountNet)}${LRM}`;
    const invoiceAfterTax = `JD ${fmt3(o.invoiceAfterTax ?? o.invoiceNet)}${LRM}`;

    const addOnParts = (o.addOns ?? []).map((addon) => {
      const addonAfterTax = `JD ${fmt3(addon.addonAfterTax)}${LRM}`;
      return { label: addon.label ?? "", amount: addonAfterTax };
    });

    const addonSentence = addOnParts.length
      ? lang === "ar"
        ? `كما تم إضافة خدمة ${addOnParts
            .map((item) => `${item.label} بقيمة ${item.amount}`)
            .join("، ")}.`
        : `Additionally, the ${addOnParts
            .map((item) => `${item.label} service has been added for ${item.amount}`)
            .join(" and ")}.`
      : "";

    const mainAr =
      `أوضح لحضرتك أن قيمة أول فاتورة هي **${invoiceAfterTax}** (شامل الضريبة).` +
      `\nتتضمن هذه الفاتورة اشتراك الشهر الحالي بقيمة **${monthlyAfterTax}**، بالإضافة إلى نسبة تناسب بقيمة **${prorationAfterTax}** (محسوبة على سعر الأساس قبل الخصم) عن الفترة من **${start}** إلى **${end}**.` +
      (addonSentence && lang === "ar" ? `\n${addonSentence.trimEnd()}` : "");

    const mainEn =
      `The first invoice amount is **${invoiceAfterTax}** (Inc-Tax).` +
      `\nThis includes the current month's subscription of **${monthlyAfterTax}**, plus a prorated amount of **${prorationAfterTax}** (calculated on the non-discounted base price) for the period from **${start}** to **${end}**.` +
      (addonSentence && lang === "en" ? `\n${addonSentence.trim()}` : "");

    const main = lang === "ar" ? mainAr : mainEn;

    const addOnsList = addOnParts.length
      ? addOnParts
          .map((addon) => `${addon.label} (${addon.amount.replace(LRM, "")})`)
          .join(lang === "ar" ? "، " : ", ")
      : translations[lang].proRataNoAddOns;

    return {
      main,
      addOnLines: [],
      allInclusiveNote: "",
      callMode: "",
      combined: main,
      addOnsList,
      addOnsListOrNone: addOnsList,
    };
  }

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
